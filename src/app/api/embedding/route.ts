import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

type EmbeddingRequestBody = {
  // playground에서 보낼 때
  text?: unknown;
  // developer console에서 보낼 때(요청 스펙)
  input?: unknown;
  input_type?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | EmbeddingRequestBody
      | null;

    const text =
      typeof body?.text === "string"
        ? body.text.trim()
        : typeof body?.input === "string"
          ? body.input.trim()
          : "";

    const inputType =
      typeof body?.input_type === "string" ? body.input_type : "string";

    if (!text) {
      return NextResponse.json(
        { error: "input/text를 확인해주세요." },
        { status: 400 },
      );
    }

    // const apiKey = process.env.EMBEDDING_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json(
    //     { error: "EMBEDDING_API_KEY가 설정되지 않았습니다." },
    //     { status: 500 },
    //   );
    // }

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const authHeader = req.headers.get("authorization");
    const upstreamRes = await fetch(
      `${upstreamBasePath}/embedding/_inference/text_embedding/qwen3`,
      {
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
          input: text,
          task_settings: { additionalProp1: {} },
          input_type: inputType,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(120_000),
      },
    );

    const upstreamJson = (await upstreamRes.json().catch(() => null)) as
      | unknown
      | null;

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : (upstreamJson as { error?: string })?.error ?? "Embedding API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const embeddingVector = (
      upstreamJson as
        | { inference_results?: Array<{ text_embedding?: unknown }> }
        | null
    )?.inference_results?.[0]?.text_embedding;

    if (!Array.isArray(embeddingVector)) {
      return NextResponse.json(
        { error: "Embedding 응답 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    // 숫자 배열로 정규화
    const normalized = embeddingVector
      .map((v: unknown) => (typeof v === "number" ? v : Number(v)))
      .filter((v: number) => Number.isFinite(v));

    return NextResponse.json({ embeddingVector: normalized });
  } catch (error: unknown) {
    console.error("Embedding API Error:", error);
    return NextResponse.json(
      { error: "Embedding 서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}

