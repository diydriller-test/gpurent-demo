import { NextResponse } from "next/server";

import { resolveUpstreamContext, withUpstreamClientIp } from "../_lib/upstream";

type TtsRequestBody = {
  text?: unknown;
  language?: unknown;
  speaker?: unknown;
  instruct?: unknown;
  style_instruction?: unknown;
};

function normalizeLanguage(raw: string): string {
  const v = raw.trim().toLowerCase();
  // short codes -> upstream expected names
  if (v === "ko" || v === "kr" || v === "korea" || v === "korean") return "korean";
  if (v === "en" || v === "eng" || v === "english") return "english";
  if (v === "zh" || v === "cn" || v === "chinese") return "chinese";
  if (v === "ja" || v === "jp" || v === "japanese") return "japanese";
  if (v === "fr" || v === "french") return "french";
  if (v === "de" || v === "german") return "german";
  if (v === "it" || v === "italian") return "italian";
  if (v === "es" || v === "spanish") return "spanish";
  if (v === "pt" || v === "portuguese") return "portuguese";
  if (v === "ru" || v === "russian") return "russian";
  return v;
}

function randomIntPathSegment(): string {
  const n = Math.floor(Math.random() * 1_000_000_000);
  return String(n);
}

export async function GET(req: Request) {
  try {
    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamRes = await fetch(`${upstreamBasePath}/tts/speakers`, {
      method: "GET",
      headers: withUpstreamClientIp(req, {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    const data = (await upstreamRes.json().catch(() => null)) as unknown;
    return NextResponse.json(data ?? {}, { status: upstreamRes.status });
  } catch (error: unknown) {
    console.error("TTS speakers error:", error);
    return NextResponse.json(
      { error: "TTS speakers 정보를 불러올 수 없습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 58_000);

  try {
    const body = (await req.json().catch(() => null)) as TtsRequestBody | null;

    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const language =
      typeof body?.language === "string" ? body.language.trim() : "";
    const speaker =
      typeof body?.speaker === "string" ? body.speaker.trim() : "";
    const instruct =
      typeof body?.instruct === "string" ? body.instruct.trim() : "";

    // 프론트 호환 (style_instruction -> instruct)
    const styleInstruction =
      typeof body?.style_instruction === "string"
        ? body.style_instruction.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        { error: "text를 확인해주세요." },
        { status: 400 },
      );
    }

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const rand = randomIntPathSegment();
    const upstreamUrl = `${upstreamBasePath}/tts/_inference/tts/${rand}`;

    const form = new URLSearchParams();
    form.set("text", text);
    if (language) form.set("language", normalizeLanguage(language));
    if (speaker) form.set("speaker", speaker.toLowerCase());
    if (instruct) form.set("instruct", instruct);
    else if (styleInstruction) form.set("instruct", styleInstruction);

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: withUpstreamClientIp(req, {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      }),
      body: form.toString(),
      signal: controller.signal,
    });

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const maybeJson = (await upstreamRes.json().catch(() => null)) as
        | { error?: string; detail?: unknown }
        | null;

      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : maybeJson?.error ??
            (typeof maybeJson?.detail === "string"
              ? maybeJson.detail
              : "TTS API 요청 실패");

      return NextResponse.json({ error: message }, { status });
    }

    // 오디오 바이너리 그대로 전달
    const contentType =
      upstreamRes.headers.get("content-type") ?? "audio/mpeg";

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "TTS 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    console.error("TTS API Error:", error);
    return NextResponse.json(
      { error: "TTS 서버 연결에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}

