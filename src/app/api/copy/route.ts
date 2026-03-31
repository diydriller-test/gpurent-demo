import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

type AdCopyBody = {
  brief?: unknown;
  toneLine?: unknown;
  channelLine?: unknown;
  temperature?: unknown;
};

export type AdCopyResult = {
  headline: string;
  body: string;
};

function parseTemperatureOptional(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function asOptionalString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function normalizePayload(data: unknown): AdCopyResult | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const headline = typeof o.headline === "string" ? o.headline.trim() : "";
  const body = typeof o.body === "string" ? o.body.trim() : "";
  if (!headline || !body) return null;
  return { headline, body };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as AdCopyBody | null;

    const brief =
      typeof body?.brief === "string" ? body.brief.trim() : "";
    if (!brief) {
      return NextResponse.json(
        { error: "brief(제품·서비스 브리프)를 문자열로 보내주세요." },
        { status: 400 },
      );
    }

    const toneLine =
      asOptionalString(body?.toneLine) ||
      "(지정 없음 — 적절한 톤을 선택하세요)";
    const channelLine =
      asOptionalString(body?.channelLine) ||
      "(지정 없음 — 범용 카피로 작성하세요)";

    const temperature = parseTemperatureOptional(body?.temperature);

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/copywrite/api/copy`;

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
        brief,
        toneLine,
        channelLine,
        ...(typeof temperature === "number" ? { temperature } : {}),
      }),
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
            "카피 API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const normalized = normalizePayload(upstreamJson);
    if (!normalized) {
      return NextResponse.json(
        { error: "카피 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error("Ad copy API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "카피 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
