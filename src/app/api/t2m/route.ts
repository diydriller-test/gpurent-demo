import { NextResponse } from "next/server";

import { resolveUpstreamContext } from "../_lib/upstream";

export const maxDuration = 300;

type T2mRequestBody = {
  prompt?: unknown;
  audio_duration?: unknown;
  lyrics?: unknown;
  instrumental?: unknown;
};

function randomInferenceId(): string {
  return `web-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 290_000);

  try {
    const body = (await req.json().catch(() => null)) as T2mRequestBody | null;

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const audioDuration =
      typeof body?.audio_duration === "number" && body.audio_duration > 0
        ? body.audio_duration
        : 30;
    const lyrics =
      typeof body?.lyrics === "string" ? body.lyrics : "";
    const instrumental =
      typeof body?.instrumental === "boolean" ? body.instrumental : false;

    if (!prompt && !lyrics.trim()) {
      return NextResponse.json(
        { error: "prompt 또는 lyrics를 입력해주세요." },
        { status: 400 },
      );
    }

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const inferenceId = randomInferenceId();
    const upstreamUrl = `${upstreamBasePath}/music/_inference/text2music/${inferenceId}`;

    const payload = {
      prompt,
      lyrics,
      instrumental,
      vocal_language: "unknown",
      bpm: null,
      keyscale: "",
      timesignature: "",
      audio_duration: audioDuration,
      thinking: true,
      use_cot_caption: true,
      use_cot_language: true,
      use_cot_metas: true,
      inference_steps: 50,
      guidance_scale: 7.0,
      use_adg: false,
      cfg_interval_start: 0.0,
      cfg_interval_end: 1.0,
      shift: 1.0,
      infer_method: "ode",
      sampler_mode: "euler",
      enable_normalization: true,
      normalization_db: -1.0,
      use_random_seed: true,
      seed: -1,
      audio_format: "mp3",
      mp3_bitrate: "128k",
      mp3_sample_rate: 48000,
    };

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { access_token: apiKey } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
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
              : "T2M API 요청 실패");
      return NextResponse.json({ error: message }, { status });
    }

    const contentType =
      upstreamRes.headers.get("content-type") ?? "audio/mpeg";

    return new Response(upstreamRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "음악 생성 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    console.error("T2M API Error:", error);
    return NextResponse.json(
      { error: "T2M 서버 연결에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}
