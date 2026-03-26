import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { NextResponse } from "next/server";
import { getVllmOpenAiConfig } from "../_lib/vllm";

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

function parseTemperature(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0.1;
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

    const parsedTemperature = parseTemperature(body?.temperature);

    const { baseURL, apiKey } = getVllmOpenAiConfig();

    const llm = new ChatOpenAI({
      apiKey,
      configuration: { baseURL },
      model: "openai/gpt-oss-120b",
      temperature: parsedTemperature,
      timeout: 120_000,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`당신은 한국어 개체명 인식(NER) 전문가입니다.
아래 문장을 읽고, 고유명사·수치·시간·조직 등 의미 있는 개체를 찾아 정형화된 범주로 분류합니다. 단순 키워드 매칭이 아니라 문맥을 반영하세요.

[입력 문장]
{text}

사용 가능한 label 예시 (필요 시 유사 태그를 추가해도 됨, 짧은 대문자 권장):
- PER: 인물 이름
- LOC: 장소·지명
- ORG: 조직·회사·기관
- DAT: 날짜·시간·기간
- MON: 금액·화폐
- MISC: 그 외 고유 정보(제품명 등 문맥상 중요한 경우)

출력 형식 (반드시 아래 JSON만 출력. 다른 설명·마크다운·코드펜스 금지):
{{
  "entities": [
    {{
      "text": "원문에 나타난 표면 형태 그대로",
      "label": "PER",
      "category": "Person / 인물"
    }}
  ]
}}

규칙:
- entities 배열에 문장에서 식별한 모든 개체를 넣을 것 (없으면 빈 배열)
- text는 입력 문장의 부분 문자열과 일치하도록 복사할 것
- category는 label의 의미를 한눈에 알 수 있게 짧게 (영문·한글 병기 가능)
- 원문에 없는 개체를 지어내지 말 것`);

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
        { error: "NER 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error("NER API Error:", error);
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
