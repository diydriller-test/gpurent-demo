import { NextResponse } from "next/server";

import { resolveUpstreamContext } from "../_lib/upstream";

export const maxDuration = 300;

type T2iRequestBody = {
  prompt?: unknown;
  negative_prompt?: unknown;
  width?: unknown;
  height?: unknown;
  num_inference_steps?: unknown;
  seed?: unknown;
};

function randomInferenceId(): string {
  return `web-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 290_000);

  try {
    const body = (await req.json().catch(() => null)) as T2iRequestBody | null;

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const negativePrompt =
      typeof body?.negative_prompt === "string" ? body.negative_prompt : " ";
    const width =
      typeof body?.width === "number" && body.width > 0 ? body.width : 1024;
    const height =
      typeof body?.height === "number" && body.height > 0 ? body.height : 1024;
    const numInferenceSteps =
      typeof body?.num_inference_steps === "number" &&
      body.num_inference_steps > 0
        ? Math.floor(body.num_inference_steps)
        : 10;
    const seed =
      typeof body?.seed === "number" && body.seed >= 0
        ? Math.floor(body.seed)
        : randomSeed();

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt를 입력해주세요." },
        { status: 400 },
      );
    }

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const authHeader = req.headers.get("authorization");
    const inferenceId = randomInferenceId();
    const upstreamUrl = `${upstreamBasePath}/image/_inference/image-edit/${inferenceId}`;

    const upstreamForm = new FormData();
    upstreamForm.append("prompt", prompt);
    upstreamForm.append("negative_prompt", negativePrompt);
    upstreamForm.append("width", String(width));
    upstreamForm.append("height", String(height));
    upstreamForm.append("num_inference_steps", String(numInferenceSteps));
    upstreamForm.append("seed", String(seed));

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        ...(apiKey
          ? { Authorization: `Bearer ${apiKey}` }
          : authHeader
            ? { Authorization: authHeader }
            : {}),
      },
      body: upstreamForm,
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
              : "이미지 생성 API 요청 실패");
      return NextResponse.json({ error: message }, { status });
    }

    const contentType = upstreamRes.headers.get("content-type") ?? "image/png";

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
        { error: "이미지 생성 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    console.error("T2I API Error:", error);
    return NextResponse.json(
      { error: "이미지 생성 서버 연결에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}
