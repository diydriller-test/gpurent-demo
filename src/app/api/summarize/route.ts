import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { NextResponse } from "next/server";
import { getVllmOpenAiConfig } from "../_lib/vllm";

type SummarizeBody = {
  text?: unknown;
  temperature?: unknown;
  style?: unknown;
};

function parseTemperature(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0.3;
}

function asOptionalString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as SummarizeBody | null;

    const text =
      typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "text(요약할 본문)를 문자열로 보내주세요." },
        { status: 400 },
      );
    }

    const style = asOptionalString(body?.style);
    const styleLine =
      style ||
      "(지정 없음 — 문맥에 맞게 한두 문단 또는 불릿 형태로 요약하세요)";
    const parsedTemperature = parseTemperature(body?.temperature);

    const { baseURL, apiKey } = getVllmOpenAiConfig();

    const llm = new ChatOpenAI({
      apiKey,
      configuration: { baseURL },
      model: "openai/gpt-oss-120b",
      temperature: parsedTemperature,
      timeout: 120_000,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`당신은 한국어 텍스트 요약 전문가입니다.
아래 본문을 읽고 핵심만 추려 짧게 압축하세요. 리뷰·뉴스·회의록·긴 설명문 등 비정형 텍스트를 정리하는 데 활용됩니다.

[원문]
{text}

[요약 형식·톤 지시]
{styleLine}

요구사항:
- 원문에 없는 사실을 지어내지 말 것
- 핵심 메시지·결론·행동 항목이 있으면 드러낼 것
- 출력은 한국어만 사용
- 불필요한 메타 문장(“다음은 요약입니다” 등)은 생략`);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    const summary = await chain.invoke({
      text,
      styleLine,
    });

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error("Summarize API Error:", error);
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
