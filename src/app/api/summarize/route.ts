import { NextResponse } from "next/server";
import { resolveUpstreamBasePath } from "../_lib/upstream";

type SummarizeBody = {
  text?: unknown;
  styleLine?: unknown;
};

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

    const styleLineInput = asOptionalString(body?.styleLine);
    const styleLine =
      styleLineInput ||
      "(지정 없음 — 문맥에 맞게 한두 문단 또는 불릿 형태로 요약하세요)";

    const upstreamBasePath = await resolveUpstreamBasePath(req);
    const upstreamUrl = `${upstreamBasePath}/summarize/api/summarize`;

    const authHeader = req.headers.get("authorization");
    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ text, styleLine }),
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
            "요약 API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const summary =
      typeof (upstreamJson as { summary?: unknown } | null)?.summary === "string"
        ? ((upstreamJson as { summary?: string }).summary ?? "").trim()
        : "";

    if (!summary) {
      return NextResponse.json(
        { error: "요약 응답 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error("Summarize API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "요약 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
