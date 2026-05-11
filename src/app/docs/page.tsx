"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";

type DocSection = {
  id: string;
  title: string;
  method: string;
  path: string;
  description: string;
  requestLabel?: string;
  request: string;
  responseLabel?: string;
  response: string;
  notes?: string[];
};

const BASE_URL_NOTE =
  "브라우저에서 호출 시 동일 오리진 기준 상대 경로(예: /api/chat)를 사용합니다.";

const SECTIONS: DocSection[] = [
  {
    id: "text",
    title: "Text (LLM)",
    method: "POST",
    path: "/api/chat",
    description:
      "프롬프트 입력에 대해 한국어로 텍스트 응답을 생성합니다. 내부적으로 LLM 업스트림과 연동됩니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "input": "질문 또는 지시문",
  "temperature": 0.1
}`,
    responseLabel: "성공 (200)",
    response: `{
  "text": "모델이 생성한 한국어 답변 문자열"
}`,
    notes: [
      "`temperature`는 생략 시 0.1에 가깝게 처리됩니다.",
      "한도 초과 시 429와 `{ \"error\": \"일일 체험 한도를 초과했습니다. ...\" }` 형태로 응답할 수 있습니다.",
    ],
  },
  {
    id: "embedding",
    title: "Embedding",
    method: "POST",
    path: "/api/embedding",
    description: "입력 텍스트를 임베딩 벡터(숫자 배열)로 변환합니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "input": "임베딩할 문장",
  "input_type": "string"
}`,
    responseLabel: "성공 (200)",
    response: `{
  "embeddingVector": [0.012, -0.034, ...]
}`,
    notes: [
      "`text` 필드로 보내도 동작합니다(내부에서 `input`과 동일하게 처리).",
      "업스트림 오류 시 `error` 메시지와 함께 비-200 상태 코드가 반환될 수 있습니다.",
    ],
  },
  {
    id: "rerank",
    title: "Re-ranking",
    method: "POST",
    path: "/api/rerank",
    description: "질의와 후보 문장 목록을 받아 관련도에 따라 재정렬하는 결과를 반환합니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "query": "검색 질의",
  "input": ["후보 문장 1", "후보 문장 2"]
}`,
    responseLabel: "성공 (200)",
    response: `// 업스트림 Re-rank API 응답 구조가 그대로 전달됩니다.`,
    notes: [
      "`query`는 비어 있으면 안 되고, `input`은 문자열 배열이어야 합니다.",
    ],
  },
  {
    id: "tts",
    title: "TTS (텍스트 음성 변환)",
    method: "POST",
    path: "/api/tts",
    description:
      "텍스트를 음성으로 합성합니다. 업스트림 TTS로 프록시하며, 성공 시 오디오 바이너리를 반환합니다. 음성 목록은 `GET /api/tts`로 조회할 수 있습니다.",
    requestLabel: "본문 (application/json)",
    request: `{
  "text": "읽을 문장(필수)",
  "language": "ko | korean | english | japanese 등 (선택)",
  "speaker": "ryan 등 (선택)",
  "instruct": "스타일·톤 지시 (선택)",
  "style_instruction": "instruct 별칭 (선택)"
}`,
    responseLabel: "성공 (200)",
    response: `Content-Type: audio/mpeg 등 (업스트림이 반환한 오디오 타입)
<바이너리 오디오 스트림>`,
    notes: [
      "`text`만 필수입니다. `language`는 짧은 코드(ko, en) 또는 korean/english 등으로 보낼 수 있습니다.",
      "오류 시 JSON `{ \"error\": \"...\" }`와 함께 400·429·500·504 등이 반환될 수 있습니다. 한도 초과 시 429 메시지가 올 수 있습니다.",
      "합성 요청은 최대 약 58초 제한이 있어, 초과 시 504가 날 수 있습니다.",
      "스피커 목록: `GET /api/tts` (업스트림 `/tts/speakers` 프록시).",
    ],
  },
  {
    id: "stt",
    title: "STT (Speech-to-Text)",
    method: "POST",
    path: "/api/stt",
    description:
      "음성 파일을 업로드하여 텍스트로 변환합니다. `multipart/form-data`로 전송합니다.",
    requestLabel: "본문 (multipart/form-data)",
    request: `필드:
  file        — 오디오 파일 (필수)
  language    — 선택
  task        — 선택
  beam_size   — 선택
  vad_filter  — 선택`,
    responseLabel: "성공 (200)",
    response: `업스트림 STT 서비스의 JSON 응답이 그대로 반환됩니다.`,
    notes: [
      "최대 실행 시간 제한이 있어 장시간 처리 시 504(시간 초과)가 날 수 있습니다.",
      "`file`이 없으면 400과 안내 메시지가 반환됩니다.",
    ],
  },
  {
    id: "voice-clone",
    title: "Voice Clone (보이스 클론)",
    method: "POST",
    path: "/api/voice-clone",
    description:
      "참조 음성 파일을 업로드하면 해당 화자의 목소리로 텍스트를 합성합니다. `x_vector_only_mode`로 합성 방식을 선택할 수 있습니다. `multipart/form-data`로 전송합니다.",
    requestLabel: "본문 (multipart/form-data)",
    request: `필드:
  ref_audio         — 참조 음성 파일 (필수, WAV/MP3 등)
  text              — 합성할 텍스트 (필수)
  language          — 언어 (선택, 기본 Korean)
                      Korean | English | Chinese | Japanese 등
  x_vector_only_mode — true | false (선택, 기본 true)
                      true  → 음색만 복제 (ref_text 불필요, 빠름)
                      false → 음색+억양·스타일 복제 (ref_text 권장)
  ref_text          — 참조 음성의 스크립트 (x_vector_only_mode=false 시 권장)`,
    responseLabel: "성공 (200)",
    response: `Content-Type: audio/wav (또는 업스트림 오디오 타입)
<바이너리 오디오 스트림>`,
    notes: [
      "`ref_audio`와 `text`만 필수입니다.",
      "`x_vector_only_mode=true`일 때는 `ref_text` 없이도 동작하며, 더 빠르게 합성됩니다.",
      "`x_vector_only_mode=false`일 때는 `ref_text`(참조 음성 스크립트)를 함께 보내면 억양·발화 스타일까지 복제됩니다.",
      "최대 실행 시간 제한(60초)이 있어 초과 시 504가 날 수 있습니다.",
    ],
  },
  {
    id: "image2text",
    title: "Image2Text (Vision OCR)",
    method: "POST",
    path: "/api/image2text",
    description:
      "이미지를 업로드하면 Vision 모델이 내용을 설명하고 이미지 내 텍스트를 추출합니다. `multipart/form-data`로 전송합니다.",
    requestLabel: "본문 (multipart/form-data)",
    request: `필드:
  image       — 이미지 파일 (필수, JPG/PNG/WEBP/GIF 등)
  prompt      — 분석 지시 (선택)
                기본값: "이 이미지 내용을 한국어로 설명하고,
                         이미지 안의 글자를 줄바꿈 유지해서 그대로 추출해줘."
  temperature — 0~1 실수 (선택, 기본 0.1)`,
    responseLabel: "성공 (200)",
    response: `{
  "text": "이미지 분석 결과 및 추출된 텍스트 문자열"
}`,
    notes: [
      "`image` 파일만 필수입니다. `prompt`를 생략하면 이미지 설명 + 텍스트 추출 지시가 기본으로 사용됩니다.",
      "이미지는 서버에서 base64로 인코딩되어 Vision API로 전달됩니다.",
      "응답이 빈 문자열이거나 형식이 올바르지 않으면 502가 반환될 수 있습니다.",
      "최대 실행 시간 제한(115초)이 있어 초과 시 504가 날 수 있습니다.",
      "한도 초과 시 `/api/chat`과 동일하게 429 응답이 올 수 있습니다.",
    ],
  },
];

const TOC_SECTION_IDS = ["overview", ...SECTIONS.map((s) => s.id)];

const LAST_TOC_SECTION_ID = TOC_SECTION_IDS[TOC_SECTION_IDS.length - 1];

/** 고정 상단 네비(h-16) + scroll-mt와 맞춘 활성화 기준선(뷰포트 상단 기준 px) */
const TOC_ACTIVATION_LINE_PX = 112;

/**
 * 스크롤 위치에 맞는 TOC 항목 1개만 계산합니다.
 * - 맨 아래에 도달하면 항상 마지막 섹션
 * - 그 외에는 `rect.top <= 기준선`인 섹션들 중 문서 순서상 마지막
 * (중간에 `break` 하면 안 됨 — 그게 두 칸 점프 원인이 됩니다)
 */
function computeActiveTocId(): string {
  const { scrollY, innerHeight } = window;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const atBottom = maxScroll <= 0 || scrollY >= maxScroll - 2;
  if (atBottom) return LAST_TOC_SECTION_ID;

  const line = TOC_ACTIVATION_LINE_PX;
  let active = TOC_SECTION_IDS[0];

  for (const id of TOC_SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= line) {
      active = id;
    }
  }

  return active;
}

function docsTocLinkClass(isActive: boolean) {
  return isActive
    ? "docs-toc-link-active block rounded-lg px-2 py-1.5 transition-all duration-300"
    : "block rounded-lg px-2 py-1.5 text-foreground/70 transition-all duration-300 hover:bg-white/5 hover:text-accent";
}

export default function DocsPage() {
  const [activeSectionId, setActiveSectionId] = useState<string>("overview");

  useEffect(() => {
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = computeActiveTocId();
        setActiveSectionId((prev) => (prev === next ? prev : next));
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    window.addEventListener("hashchange", update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("load", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);
  return (
    <div className="min-h-screen bg-grid-pattern">
      <SiteNav />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-12 lg:py-16">
        <aside className="shrink-0 lg:w-56">
          <nav
            aria-label="문서 목차"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/40">
              On this page
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="#overview"
                  aria-current={
                    activeSectionId === "overview" ? "location" : undefined
                  }
                  className={docsTocLinkClass(activeSectionId === "overview")}
                >
                  개요 · 인증
                </a>
              </li>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={
                      activeSectionId === s.id ? "location" : undefined
                    }
                    className={docsTocLinkClass(activeSectionId === s.id)}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-12 scroll-mt-28" id="overview">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              API 문서
            </h1>
            <p className="mt-4 max-w-2xl text-foreground/70">
              AI API 오마카세 데모 앱이 제공하는 HTTP 엔드포인트 요약입니다. 요청 시
              발급받은 액세스 토큰이 필요한 경우, 아래 헤더를 포함합니다.
            </p>
            <p className="mt-3 max-w-2xl border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-foreground/60">
              앞으로도 새로운 API가 계속 추가되고, 기존 엔드포인트 스펙도 개선될
              예정입니다. 아래 목록은 시점에 따라 늘어나거나 바뀔 수 있으니
              공지·문서 업데이트를 함께 확인해 주세요.
            </p>
            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-surface/50 p-4 font-mono text-sm">
              <p className="text-foreground/50">Authorization: Bearer {"<your_access_token>"}</p>
              <p className="border-t border-white/10 pt-3 text-foreground/45">
                {BASE_URL_NOTE}
              </p>
            </div>
          </header>

          <div className="space-y-12">
            {SECTIONS.map((api) => (
              <section
                key={api.id}
                id={api.id}
                className="scroll-mt-28 rounded-2xl border border-white/5 bg-surface/50 p-6 md:p-8"
              >
                <div className="mb-4 flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                    {api.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-accent/20 px-2 py-1 font-mono text-xs font-medium text-accent md:text-sm">
                      {api.method}
                    </span>
                    <code className="rounded-lg bg-background/50 px-2 py-1 font-mono text-sm text-foreground/90">
                      {api.path}
                    </code>
                  </div>
                </div>
                <p className="mb-6 text-foreground/65">{api.description}</p>

                <div className="grid gap-6 md:grid-cols-1 md:gap-8 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                      {api.requestLabel ?? "요청"}
                    </h3>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-background/40 p-4 font-mono text-xs leading-relaxed text-foreground/85 md:text-sm">
                      {api.request.trim()}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
                      {api.responseLabel ?? "응답"}
                    </h3>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-background/40 p-4 font-mono text-xs leading-relaxed text-foreground/85 md:text-sm">
                      {api.response.trim()}
                    </pre>
                  </div>
                </div>

                {api.notes && api.notes.length > 0 ? (
                  <ul className="mt-6 list-disc space-y-1.5 pl-5 text-sm text-foreground/55">
                    {api.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <p className="mt-14 border-t border-white/10 pt-10 text-center text-sm text-foreground/45">
            API는 지속적으로 추가·확장되며, 엔드포인트와 제한 사항은 서비스
            업데이트에 따라 달라질 수 있습니다. 최신 동작은{" "}
            <Link href="/api-test" className="text-accent hover:underline">
              API 체험
            </Link>
            과 실제 응답을 기준으로 확인해 주세요.
          </p>
        </main>
      </div>
    </div>
  );
}
