import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

type NerBody = {
  text?: unknown;
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

    const temperature = parseTemperatureOptional(body?.temperature);

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/ner/api/ner`;

    const authHeader = req.headers.get("authorization");
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
        text,
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

    return NextResponse.json(normalized);
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
