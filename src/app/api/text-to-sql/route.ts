import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { NextResponse } from "next/server";
import { getVllmOpenAiConfig } from "../_lib/vllm";

type TextToSqlBody = {
  text?: unknown;
  temperature?: unknown;
};

export type TextToSqlResult = {
  /** 생성된 SQL 한 문장(또는 세미콜론 없이 단일 쿼리) */
  sql: string;
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

function normalizePayload(data: unknown): TextToSqlResult | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const sql = typeof o.sql === "string" ? o.sql.trim() : "";
  if (!sql) return null;
  return { sql };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as TextToSqlBody | null;

    const text =
      typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "text(자연어 질문)를 문자열로 보내주세요." },
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

    const prompt = ChatPromptTemplate.fromTemplate(`당신은 한국어 질문을 MySQL 호환 SQL로 바꾸는 Text-to-SQL 전문가입니다.
사용자가 스키마를 주지 않았다면, 질문에 등장하는 테이블·컬럼 이름을 합리적으로 추정하세요. 한국어 질문의 의도(집계, 필터, 정렬, 기간, LIMIT 등)를 반영합니다.

[자연어 질문]
{text}

출력 형식 (반드시 아래 JSON만 출력. 다른 설명·마크다운·코드펜스 금지):
{{
  "sql": "단일 SELECT 문 하나. 세미콜론은 생략해도 됨."
}}

규칙:
- sql에는 실행 가능한 한 줄(또는 여러 줄이어도 하나의 쿼리)만 넣을 것
- DDL/DROP/DELETE/UPDATE/INSERT는 사용하지 말고 SELECT 위주로 작성할 것 (읽기 전용 분석 가정)
- 날짜·지역·금액 조건은 질문에 맞게 WHERE/HAVING/GROUP BY/ORDER BY/LIMIT를 사용할 것
- 테이블·컬럼명은 소문자 스네이크 케이스를 선호할 것`);

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
        { error: "SQL 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error("Text-to-SQL API Error:", error);
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
