import { NextResponse } from "next/server";

import { resolveUpstreamContext } from "../_lib/upstream";

export const maxDuration = 60;

function randomInferenceId(): string {
  return `vc_${Math.floor(Math.random() * 1_000_000_000)}`;
}

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 58_000);

  try {
    const formData = await req.formData();

    const refAudioVal = formData.get("ref_audio");
    if (!refAudioVal || !(refAudioVal instanceof Blob)) {
      return NextResponse.json(
        { error: "ref_audio 파일을 multipart/form-data로 보내주세요." },
        { status: 400 },
      );
    }

    const text = formData.get("text");
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "text를 확인해주세요." },
        { status: 400 },
      );
    }

    const language =
      typeof formData.get("language") === "string"
        ? (formData.get("language") as string)
        : "Korean";
    const xVectorOnlyMode = formData.get("x_vector_only_mode");
    const refText = formData.get("ref_text");

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const inferenceId = randomInferenceId();
    const upstreamUrl = `${upstreamBasePath}/voice-clone/_inference/tts/${inferenceId}`;

    const upstreamForm = new FormData();
    const fileName =
      typeof (refAudioVal as { name?: unknown }).name === "string"
        ? ((refAudioVal as { name?: unknown }).name as string)
        : "reference.wav";
    upstreamForm.append("ref_audio", refAudioVal, fileName);
    upstreamForm.append("text", text.trim());
    upstreamForm.append("language", language);
    upstreamForm.append(
      "x_vector_only_mode",
      typeof xVectorOnlyMode === "string" ? xVectorOnlyMode : "true",
    );
    if (typeof refText === "string" && refText.trim()) {
      upstreamForm.append("ref_text", refText.trim());
    }

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        ...(apiKey ? { access_token: apiKey } : {}),
      },
      body: upstreamForm,
      signal: controller.signal,
    });

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const maybeJson = (await upstreamRes.json().catch(() => null)) as {
        error?: string;
        detail?: unknown;
      } | null;
      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : maybeJson?.error ??
            (typeof maybeJson?.detail === "string"
              ? maybeJson.detail
              : "Voice Clone API 요청 실패");
      return NextResponse.json({ error: message }, { status });
    }

    const contentType =
      upstreamRes.headers.get("content-type") ?? "audio/wav";
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
        { error: "Voice Clone 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    console.error("Voice Clone API Error:", error);
    return NextResponse.json(
      { error: "Voice Clone 서버 연결에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}
