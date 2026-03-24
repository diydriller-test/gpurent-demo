// src/app/api/chat/route.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { input, temperature } = await req.json();

    const parsedTemperature =
      typeof temperature === "number" && Number.isFinite(temperature)
        ? temperature
        : typeof temperature === "string" &&
            Number.isFinite(Number(temperature))
          ? Number(temperature)
          : 0.1;

    const llm = new ChatOpenAI({
      configuration: { baseURL: "http://gpurent.kogrobo.com:11115/trial/llm/v1" },
      // apiKey: process.env.OPENAI_API_KEY, // .env.local의 키 사용
      model: "openai/gpt-oss-120b",
      temperature: parsedTemperature,
    });

    const prompt =
      ChatPromptTemplate.fromTemplate("{input} 한국어로 답변해줘.");
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    const response = await chain.invoke({ input });

    return NextResponse.json({ text: response });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const err = error as { response?: { status?: number }; status?: number; message?: string };
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
