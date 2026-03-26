import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { NextResponse } from "next/server";
import { getVllmOpenAiConfig } from "../_lib/vllm";

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

function parseTemperature(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0.2;
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError("JSON object not found");
  }
  return JSON.parse(candidate.slice(start, end + 1));
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

    const parsedTemperature = parseTemperature(body?.temperature);

    const { baseURL, apiKey } = getVllmOpenAiConfig();

    const llm = new ChatOpenAI({
      apiKey,
      configuration: { baseURL },
      model: "openai/gpt-oss-120b",
      temperature: parsedTemperature,
      timeout: 120_000,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`당신은 한국어 고객 리뷰 감정 분석 전문가입니다.
아래 텍스트의 문맥을 읽고, 작성자의 감정을 긍정·부정·중립으로 분류하고, 근거가 될 만큼 구체적인 점수로 수치화합니다.
복합적인 리뷰(예: 음식은 좋고 배송은 나쁨)인 경우 **측면(aspect)별**로 나누어 분석합니다.

[분석 대상 텍스트]
{text}

출력 형식 (반드시 아래 JSON만 출력. 다른 설명·마크다운·코드펜스 금지):
{{
  "overall": {{
    "label": "positive" | "negative" | "neutral",
    "score": 0.0에서 1.0 사이의 실수 (1에 가까울수록 긍정, 0에 가까울수록 부정, 중립은 대략 0.4~0.6)
  }},
  "aspects": [
    {{
      "aspect": "한글로 짧은 측면 이름 (예: 음식, 배송, 시설, 색감, 만족도)",
      "label": "positive" | "negative" | "neutral",
      "score": 0.0~1.0
    }}
  ]
}}

규칙:
- 원문에 없는 사실을 지어내지 말 것
- aspects는 문맥상 구분되는 주제가 있으면 2개 이상 채우고, 짧은 단일 감정 문장이면 1개 또는 빈 배열 가능
- score는 해당 측면에 대한 **긍정적 극성**으로 통일 (높을수록 그 측면에 대한 만족·호의)
- JSON 키 이름과 label 값은 위 스키마를 정확히 따를 것`);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    const raw = await chain.invoke({ text });

    let parsed: unknown;
    try {
      parsed = extractJsonObject(raw);
    } catch {
      return NextResponse.json(
        { error: "모델 응답을 JSON으로 해석하지 못했습니다." },
        { status: 502 },
      );
    }

    const normalized = normalizePayload(parsed);
    if (!normalized) {
      return NextResponse.json(
        { error: "감정 분석 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error("Sentiment API Error:", error);
    const err = error as {
      response?: { status?: number };
      status?: number;
      message?: string;
    };
    const msg = String(err?.message ?? "").toLowerCase();
    const is429 =
      err?.response?.status === 429 ||
      err?.status === 429 ||
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("too many requests");
    if (is429) {
      return NextResponse.json(
        { error: "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
