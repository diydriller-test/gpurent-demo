import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      input?: unknown;
      systemPrompt?: unknown;
      temperature?: unknown;
    } | null;

    const input = typeof body?.input === "string" ? body.input.trim() : "";
    const systemPrompt =
      typeof body?.systemPrompt === "string" ? body.systemPrompt.trim() : "";
    if (!input) {
      return NextResponse.json(
        { error: "input(질문/지시문)를 문자열로 보내주세요." },
        { status: 400 },
      );
    }

    const parsedTemperature =
      typeof body?.temperature === "number" && Number.isFinite(body.temperature)
        ? body.temperature
        : typeof body?.temperature === "string" &&
            Number.isFinite(Number(body.temperature))
          ? Number(body.temperature)
          : 0.1;

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/llm/v1/chat/completions`;
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
        model: "Qwen/Qwen3.6-35B-A3B",
        temperature: parsedTemperature,
        messages: [
          ...(systemPrompt
            ? [{ role: "system" as const, content: systemPrompt }]
            : []),
          {
            role: "user",
            content: input,
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    const upstreamJson = (await upstreamRes
      .json()
      .catch(() => null)) as unknown;

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : (upstreamJson as { error?: string; message?: string })?.error ||
            (upstreamJson as { error?: string; message?: string })?.message ||
            "Chat API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const text =
      typeof (
        upstreamJson as {
          choices?: Array<{ message?: { content?: unknown } }>;
        } | null
      )?.choices?.[0]?.message?.content === "string"
        ? String(
            (
              upstreamJson as {
                choices: Array<{ message?: { content?: string } }>;
              }
            ).choices[0]?.message?.content ?? "",
          ).trim()
        : "";

    if (!text) {
      return NextResponse.json(
        { error: "Chat 응답 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error("API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Chat 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
