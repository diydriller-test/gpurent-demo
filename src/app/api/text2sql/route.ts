import { NextResponse } from "next/server";
import { resolveUpstreamBasePath } from "../_lib/upstream";

type TextToSqlBody = {
  text?: unknown;
  schema?: unknown;
  temperature?: unknown;
};

export type TextToSqlResult = {
  /** 생성된 SQL 한 문장(또는 세미콜론 없이 단일 쿼리) */
  sql: string;
};

function parseTemperatureOptional(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function asOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

    const schema = asOptionalString(body?.schema);
    const temperature = parseTemperatureOptional(body?.temperature);

    const upstreamBasePath = await resolveUpstreamBasePath(req);
    const upstreamUrl = `${upstreamBasePath}/sql/api/text2sql`;

    const authHeader = req.headers.get("authorization");
    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        text,
        ...(schema ? { schema } : {}),
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
            "Text2SQL API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const normalized = normalizePayload(upstreamJson);
    if (!normalized) {
      return NextResponse.json(
        { error: "SQL 결과 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error("Text-to-SQL API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Text2SQL 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
