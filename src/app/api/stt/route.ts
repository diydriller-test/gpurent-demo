import { NextResponse } from "next/server";
import { resolveUpstreamContext } from "../_lib/upstream";

export const maxDuration = 60;

type SttMultipartFields = {
  language?: string | null;
  task?: string | null;
  beam_size?: string | null;
  vad_filter?: string | null;
};

function asString(v: FormDataEntryValue | null): string | null {
  if (typeof v === "string") return v;
  return null;
}

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 58_000);

  try {
    const formData = await req.formData();

    const fileVal = formData.get("file");
    if (!fileVal || !(fileVal instanceof Blob)) {
      return NextResponse.json(
        { error: "file 필드를 multipart/form-data로 보내주세요." },
        { status: 400 },
      );
    }

    const fields = {
      language: asString(formData.get("language")),
      task: asString(formData.get("task")),
      beam_size: asString(formData.get("beam_size")),
      vad_filter: asString(formData.get("vad_filter")),
    } satisfies SttMultipartFields;

    // const apiKey = process.env.TTS_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json(
    //     { error: "TTS_API_KEY가 설정되지 않았습니다." },
    //     { status: 500 },
    //   );
    // }

    const upstreamForm = new FormData();
    const fileName =
      typeof (fileVal as { name?: unknown }).name === "string"
        ? ((fileVal as { name?: unknown }).name as string)
        : "audio";
    upstreamForm.append("file", fileVal, fileName);
    if (fields.language) upstreamForm.append("language", fields.language);
    if (fields.task) upstreamForm.append("task", fields.task);
    if (fields.beam_size) upstreamForm.append("beam_size", fields.beam_size);
    if (fields.vad_filter)
      upstreamForm.append("vad_filter", fields.vad_filter);

    const { upstreamBasePath, apiKey } = await resolveUpstreamContext(req);
    const upstreamRes = await fetch(`${upstreamBasePath}/stt/_inference/stt/my_stt`, {
      method: "POST",
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: upstreamForm,
      signal: controller.signal,
    });

    const upstreamJson = (await upstreamRes.json().catch(() => null)) as
      | unknown
      | null;

    const status = upstreamRes.status;
    if (!upstreamRes.ok && status === 429) {
      return NextResponse.json(
        { error: "일일 체험 한도를 초과했습니다. 회원가입 후 이용해주세요." },
        { status: 429 },
      );
    }

    return NextResponse.json(upstreamJson ?? {}, { status });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "STT 요청이 시간 초과되었습니다." },
        { status: 504 },
      );
    }
    console.error("STT API Error:", error);
    return NextResponse.json(
      { error: "STT 서버 연결에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}

