import { NextResponse } from "next/server";
import { resolveUpstreamContext, withUpstreamClientIp } from "../_lib/upstream";

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

    // const apiKey = process.env.QWEN_API_KEY ?? process.env.RERANK_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json(
    //     { error: "QWEN_API_KEY가 설정되지 않았습니다." },
    //     { status: 500 }
    //   );
    // }

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    console.log("apiKey", apiKey);
    const upstreamRes = await fetch(`${upstreamBasePath}/reranker/_inference/rerank/qwen3`, {
      method: "POST",
      headers: withUpstreamClientIp(req, {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      }),
      body: JSON.stringify({
        query,
        input: inputList,
      }),
    });

    const upstreamJson = (await upstreamRes.json().catch(() => null)) as unknown;

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : (upstreamJson as { error?: string })?.error ?? "Reranker API 요청 실패";
      return NextResponse.json({ error: message }, { status });
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
