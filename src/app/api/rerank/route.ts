import { NextResponse } from "next/server";

const RERANK_ENDPOINT = "http://gpurent.kogrobo.com:51087/_inference/rerank/qwen3";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { query?: unknown; input?: unknown }
      | null;

    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const inputList = Array.isArray(body?.input)
      ? body.input.filter((item): item is string => typeof item === "string")
      : [];

    if (!query || inputList.length === 0) {
      return NextResponse.json(
        { error: "query와 input을 확인해주세요." },
        { status: 400 }
      );
    }

    const apiKey = process.env.QWEN_API_KEY ?? process.env.RERANK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "QWEN_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const upstreamRes = await fetch(RERANK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: JSON.stringify({
        query,
        input: inputList,
      }),
    });

    const upstreamJson = (await upstreamRes.json().catch(() => null)) as unknown;

    if (!upstreamRes.ok) {
      return NextResponse.json(
        upstreamJson ?? { error: "Reranker API 요청 실패" },
        { status: upstreamRes.status || 500 }
      );
    }

    return NextResponse.json(upstreamJson ?? {});
  } catch (error: unknown) {
    console.error("Rerank API Error:", error);
    return NextResponse.json(
      { error: "Reranker 서버 연결에 실패했습니다." },
      { status: 500 }
    );
  }
}
