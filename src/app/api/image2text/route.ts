import { NextResponse } from "next/server";
import { resolveUpstreamContext, withUpstreamClientIp } from "../_lib/upstream";

export const maxDuration = 120;

const MODEL = "Qwen/Qwen3.6-35B-A3B";
const DEFAULT_PROMPT =
  "이 이미지 내용을 한국어로 설명하고, 이미지 안의 글자를 줄바꿈 유지해서 그대로 추출해줘.";

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 115_000);

  try {
    const formData = await req.formData();

    const imageVal = formData.get("image");
    if (!imageVal || !(imageVal instanceof Blob)) {
      return NextResponse.json(
        { error: "image 필드를 multipart/form-data로 보내주세요." },
        { status: 400 },
      );
    }

    const promptRaw = formData.get("prompt");
    const prompt =
      typeof promptRaw === "string" && promptRaw.trim()
        ? promptRaw.trim()
        : DEFAULT_PROMPT;

    const temperatureRaw = formData.get("temperature");
    const temperature =
      typeof temperatureRaw === "string" &&
      Number.isFinite(Number(temperatureRaw))
        ? Number(temperatureRaw)
        : 0.1;

    const arrayBuffer = await imageVal.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageVal.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamUrl = `${upstreamBasePath}/llm/v1/chat/completions`;
    const authHeader = req.headers.get("authorization");

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: withUpstreamClientIp(req, {
        "Content-Type": "application/json",
        ...(apiKey
          ? { Authorization: `Bearer ${apiKey}` }
          : authHeader
            ? { Authorization: authHeader }
            : {}),
      }),
      body: JSON.stringify({
        model: MODEL,
        temperature,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const upstreamJson = (await upstreamRes.json().catch(() => null)) as unknown;

    if (!upstreamRes.ok) {
      const status = upstreamRes.status || 500;
      const message =
        status === 429
          ? "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요."
          : (upstreamJson as { error?: string; message?: string })?.error ||
            (upstreamJson as { error?: string; message?: string })?.message ||
            "Image2Text API 요청 실패";
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
        { error: "Image2Text 응답 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Image2Text 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    console.error("Image2Text API Error:", error);
    return NextResponse.json(
      { error: "서버 연결에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}
