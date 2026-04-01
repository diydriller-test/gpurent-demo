import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

type NerBody = {
  text?: unknown;
  prompt?: unknown;
  temperature?: unknown;
};

export type NerEntity = {
  /** 원문에서의 표면 형태 */
  text: string;
  /** 짧은 태그 (예: PER, LOC, ORG, DAT, MON) */
  label: string;
  /** 범주 설명 (영문·한글 가능, 예: Person / 인물) */
  category: string;
};

export type NerResult = {
  entities: NerEntity[];
};

const NER_PROMPT_TERMS: Array<{ label: string; terms: string[] }> = [
  { label: "PER", terms: ["인물", "사람", "person", "people"] },
  { label: "LOC", terms: ["장소", "지역", "위치", "location", "place"] },
  { label: "ORG", terms: ["조직", "회사", "기관", "organization", "org"] },
  { label: "DAT", terms: ["날짜", "일자", "date"] },
  { label: "TIM", terms: ["시간", "시각", "time"] },
  { label: "MON", terms: ["금액", "돈", "비용", "money", "amount"] },
  { label: "EVENT", terms: ["행사", "이벤트", "event"] },
];

function parseTemperatureOptional(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function normalizeEntity(raw: unknown): NerEntity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === "string" ? o.text.trim() : "";
  const label = typeof o.label === "string" ? o.label.trim() : "";
  const category = typeof o.category === "string" ? o.category.trim() : "";
  if (!text || !label || !category) return null;
  return { text, label, category };
}

function normalizePayload(data: unknown): NerResult | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const raw = Array.isArray(o.entities) ? o.entities : [];
  const entities = raw
    .map((e) => normalizeEntity(e))
    .filter((x): x is NerEntity => x !== null);
  return { entities };
}

function deriveRequestedLabels(prompt: string): string[] {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (!normalizedPrompt) return [];

  return NER_PROMPT_TERMS.filter(({ terms }) =>
    terms.some((term) => normalizedPrompt.includes(term.toLowerCase())),
  ).map(({ label }) => label);
}

function applyPromptPreference(result: NerResult, prompt: string): NerResult {
  const requestedLabels = deriveRequestedLabels(prompt);
  if (requestedLabels.length === 0) return result;

  const requestedSet = new Set(requestedLabels);
  const normalizedPrompt = prompt.trim().toLowerCase();
  const isExclusive =
    /만\b|만\s|only|우선|위주|중심/.test(normalizedPrompt);

  if (isExclusive) {
    return {
      entities: result.entities.filter((entity) => requestedSet.has(entity.label)),
    };
  }

  const prioritized = result.entities.filter((entity) =>
    requestedSet.has(entity.label),
  );
  const remaining = result.entities.filter(
    (entity) => !requestedSet.has(entity.label),
  );
  return { entities: [...prioritized, ...remaining] };
}

function buildUpstreamNerPrompt(text: string, prompt: string): string {
  if (!prompt.trim()) return text;
  return [
    "다음 문장에서 개체명을 추출해 주세요.",
    `추가 요청사항: ${prompt.trim()}`,
    "응답은 개체 추출 결과만 반환해 주세요.",
    `문장: ${text}`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as NerBody | null;

    const text =
      typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "text(분석할 문장)를 문자열로 보내주세요." },
        { status: 400 },
      );
    }

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const temperature = parseTemperatureOptional(body?.temperature);

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/ner/api/ner`;

    const authHeader = req.headers.get("authorization");
    const upstreamText = buildUpstreamNerPrompt(text, prompt);

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey
          ? { Authorization: `Bearer ${apiKey}` }
          : authHeader
            ? { Authorization: authHeader }
            : {}),
      },
      body: JSON.stringify({
        text: upstreamText,
        ...(typeof temperature === "number" ? { temperature } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    const upstreamJson = (await upstreamRes.json().catch(() => null)) as unknown;

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : (upstreamJson as { error?: string; message?: string })?.error ||
            (upstreamJson as { error?: string; message?: string })?.message ||
            "NER API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const normalized = normalizePayload(upstreamJson);
    if (!normalized) {
      return NextResponse.json(
        { error: "NER 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(applyPromptPreference(normalized, prompt));
  } catch (error: unknown) {
    console.error("NER API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "NER 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
