import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

type SentimentBody = {
  text?: unknown;
  temperature?: unknown;
};

export type SentimentLabel = "positive" | "negative" | "neutral";

export type SentimentPolarity = {
  label: SentimentLabel;
  /** 0(매우 부정) ~ 1(매우 긍정) 근거 기반 수치 */
  score: number;
};

export type SentimentAspect = SentimentPolarity & {
  /** 예: 음식, 배송, 시설 */
  aspect: string;
};

export type SentimentAnalysisResult = {
  overall: SentimentPolarity;
  aspects: SentimentAspect[];
};

function parseTemperatureOptional(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function isSentimentLabel(v: unknown): v is SentimentLabel {
  return v === "positive" || v === "negative" || v === "neutral";
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function normalizePolarity(
  raw: unknown,
): SentimentPolarity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = o.label;
  const score = o.score;
  if (!isSentimentLabel(label)) return null;
  const s =
    typeof score === "number" && Number.isFinite(score)
      ? score
      : typeof score === "string" && Number.isFinite(Number(score))
        ? Number(score)
        : null;
  if (s === null) return null;
  return { label, score: clamp01(s) };
}

function normalizeAspect(raw: unknown): SentimentAspect | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const aspect = typeof o.aspect === "string" ? o.aspect.trim() : "";
  if (!aspect) return null;
  const p = normalizePolarity({
    label: o.label,
    score: o.score,
  });
  if (!p) return null;
  return { aspect, ...p };
}

function normalizePayload(data: unknown): SentimentAnalysisResult | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const overall = normalizePolarity(o.overall);
  if (!overall) return null;
  const aspectsRaw = Array.isArray(o.aspects) ? o.aspects : [];
  const aspects = aspectsRaw
    .map((a) => normalizeAspect(a))
    .filter((x): x is SentimentAspect => x !== null);
  return { overall, aspects };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as SentimentBody | null;

    const text =
      typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "text(분석할 리뷰·문장)를 문자열로 보내주세요." },
        { status: 400 },
      );
    }

    const temperature = parseTemperatureOptional(body?.temperature);

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/sentiment/api/sentiment`;

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
            "감정 분석 API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const normalized = normalizePayload(upstreamJson);
    if (!normalized) {
      return NextResponse.json(
        { error: "감정 분석 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error("Sentiment API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "감정 분석 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
