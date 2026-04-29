import { NextResponse } from "next/server";
import {
  DEFAULT_AD_COPY_LANGUAGE,
  getAdCopyLanguageLabel,
  isAdCopyLanguageCode,
} from "@/lib/adCopyLanguages";
import { resolveUpstreamContext } from "../_lib/upstream";

type AdCopyBody = {
  brief?: unknown;
  tone?: unknown;
  channel?: unknown;
  temperature?: unknown;
  language?: unknown;
};

function parseTemperature(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0.7;
}

function asOptionalString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
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

    const tone = asOptionalString(body?.tone);
    const channel = asOptionalString(body?.channel);
    const toneLine = tone || "(지정 없음 — 적절한 톤을 선택하세요)";
    const channelLine = channel || "(지정 없음 — 범용 카피로 작성하세요)";

    const rawLang =
      typeof body?.language === "string" ? body.language.trim() : "";
    const languageCode =
      rawLang === ""
        ? DEFAULT_AD_COPY_LANGUAGE
        : isAdCopyLanguageCode(rawLang)
          ? rawLang
          : null;
    if (languageCode === null) {
      return NextResponse.json(
        {
          error:
            "`language`는 지원되는 언어 코드여야 합니다. (예: ko, en, ja, zh)",
        },
        { status: 400 },
      );
    }
    const languageLabel = getAdCopyLanguageLabel(languageCode);

    const parsedTemperature = parseTemperature(body?.temperature);

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/copywrite/api/copy`;
    const authHeader = req.headers.get("authorization");

    /** 출력 언어·요구사항은 업스트림 `brief` 스키마 안에 포함 */
    const upstreamBrief = [
      `당신은 글로벌 광고 카피 전문가입니다. 아래 브리프를 바탕으로 효과적인 광고 문구를 작성하세요.`,
      ``,
      `[출력 언어]`,
      `반드시 ${languageLabel}로만 작성하세요. 헤드라인·본문·슬로건 모두 이 언어로만 출력합니다. 다른 언어를 섞지 마세요.`,
      ``,
      `[브리프]`,
      brief,
      ``,
      `요구사항:`,
      `- 헤드라인(또는 메인 슬로건)과 본문(또는 짧은 설명 문구)을 구분해 제시`,
      `- 과장·허위 표현은 피하고, 브리프에 맞는 매력 포인트를 살릴 것`,
      `- 불필요한 메타 설명(“다음은 카피입니다” 등)은 생략`,
    ].join("\n");

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
        brief: upstreamBrief,
        toneLine,
        channelLine,
        temperature: parsedTemperature,
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
            "Ad copy API 요청 실패";
      return NextResponse.json({ error: message }, { status });
    }

    const upstreamObj =
      upstreamJson && typeof upstreamJson === "object"
        ? (upstreamJson as Record<string, unknown>)
        : null;

    let copy = "";
    if (typeof upstreamObj?.copy === "string") {
      copy = upstreamObj.copy.trim();
    } else {
      const choices = upstreamObj?.choices;
      const content =
        Array.isArray(choices) &&
        choices[0] &&
        typeof choices[0] === "object" &&
        typeof (choices[0] as { message?: { content?: unknown } }).message
          ?.content === "string"
          ? String(
              (choices[0] as { message: { content: string } }).message.content,
            ).trim()
          : "";
      copy = content;
    }

    if (!copy) {
      return NextResponse.json(
        { error: "Ad copy 응답 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({ copy });
  } catch (error: unknown) {
    console.error("Ad copy API Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Ad copy 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
