import { NextResponse } from "next/server";

import { resolveUpstreamContext } from "../_lib/upstream";

export const maxDuration = 300;

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
    const contentType = req.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let prompt = "";
    let negativePrompt = " ";
    let width = 1024;
    let height = 1024;
    let numInferenceSteps = 10;
    let seed = randomSeed();
    let imageFile: File | null = null;

    if (isMultipart) {
      const form = await req.formData();
      prompt = typeof form.get("prompt") === "string" ? (form.get("prompt") as string).trim() : "";
      negativePrompt = typeof form.get("negative_prompt") === "string" ? (form.get("negative_prompt") as string) : " ";
      const w = Number(form.get("width"));
      const h = Number(form.get("height"));
      const steps = Number(form.get("num_inference_steps"));
      const s = Number(form.get("seed"));
      width = w > 0 ? w : 1024;
      height = h > 0 ? h : 1024;
      numInferenceSteps = steps > 0 ? Math.floor(steps) : 10;
      seed = s >= 0 && !isNaN(s) ? Math.floor(s) : randomSeed();
      const maybeFile = form.get("image");
      if (maybeFile instanceof File && maybeFile.size > 0) {
        imageFile = maybeFile;
      }
    } else {
      const body = (await req.json().catch(() => null)) as {
        prompt?: unknown;
        negative_prompt?: unknown;
        width?: unknown;
        height?: unknown;
        num_inference_steps?: unknown;
        seed?: unknown;
      } | null;
      prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
      negativePrompt = typeof body?.negative_prompt === "string" ? body.negative_prompt : " ";
      width = typeof body?.width === "number" && body.width > 0 ? body.width : 1024;
      height = typeof body?.height === "number" && body.height > 0 ? body.height : 1024;
      numInferenceSteps =
        typeof body?.num_inference_steps === "number" && body.num_inference_steps > 0
          ? Math.floor(body.num_inference_steps)
          : 10;
      seed = typeof body?.seed === "number" && body.seed >= 0 ? Math.floor(body.seed) : randomSeed();
    }

    if (!prompt) {
      return NextResponse.json({ error: "prompt를 입력해주세요." }, { status: 400 });
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
    if (imageFile) {
      upstreamForm.append("image", imageFile);
    }

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

    const resContentType = upstreamRes.headers.get("content-type") ?? "image/png";

    return new Response(upstreamRes.body, {
      status: 200,
      headers: {
        "Content-Type": resContentType,
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
