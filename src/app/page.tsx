"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { getApis } from "@/lib/api";

type Capability = {
  label: string;
  detail: string;
  href: string;
  disabled?: boolean;
};

const CAPABILITY_FALLBACK: Capability[] = [
  {
    label: "STT",
    detail: "faster-whisper-large-v3",
    href: "/api-test?task=stt&view=detail",
  },
  {
    label: "TTS",
    detail: "Qwen3-TTS-12Hz-1.7B-CustomVoice",
    href: "/api-test?task=tts&view=detail",
  },
  {
    label: "Embedding",
    detail: "Qwen3-Embedding-8B",
    href: "/api-test?task=embedding&view=detail",
  },
  {
    label: "Reranking",
    detail: "Qwen3-Reranker-8B",
    href: "/api-test?task=reranker&view=detail",
  },
  {
    label: "Voice Clone",
    detail: "Qwen3-TTS-12Hz-1.7B-Base",
    href: "/api-test?task=voice-clone&view=detail",
  },
  {
    label: "Image-to-Text",
    detail: "google/gemma-4-26b-a4b-it",
    href: "/api-test?task=image2text&view=detail",
  },
  {
    label: "Image Generation",
    detail: "Qwen-Image-Edit-2511-Lightning",
    href: "/api-test?task=t2i&view=detail",
  },
  {
    label: "Text-to-Music",
    detail: "acestep-v15-xl-sft",
    href: "/api-test?task=t2m&view=detail",
  },
  {
    label: "LLM",
    detail: "google/gemma-4-26b-a4b-it",
    href: "/api-test?task=llm&view=detail",
  },
];

const TASK_ROUTES: Record<string, string> = {
  STT: "stt",
  TTS: "tts",
  Embedding: "embedding",
  Reranker: "reranker",
  Reranking: "reranker",
  "Voice Clone": "voiceClone",
  Vision: "image2text",
  "Image-to-Text": "image2text",
  "Text-to-Music": "t2m",
  "Music Generation": "t2m",
  "Image Generation": "t2i",
  "Text-to-Image": "t2i",
  "Text Generation": "llm",
  Text: "llm",
  LLM: "llm",
};

const TASK_LABELS: Record<string, string> = {
  STT: "STT",
  TTS: "TTS",
  Embedding: "Embedding",
  Reranker: "Reranking",
  Reranking: "Reranking",
  "Voice Clone": "Voice Clone",
  Vision: "Image-to-Text",
  "Image-to-Text": "Image-to-Text",
  "Image Generation": "Image Generation",
  "Text-to-Image": "Image Generation",
  "Text-to-Music": "Text-to-Music",
  "Music Generation": "Text-to-Music",
  "Text Generation": "LLM",
  Text: "LLM",
  LLM: "LLM",
};

const TASK_DETAILS: Record<string, string> = {
  STT: "faster-whisper-large-v3",
  TTS: "Qwen3-TTS-12Hz-1.7B-CustomVoice",
  Embedding: "Qwen3-Embedding-8B",
  Reranker: "Qwen3-Reranker-8B",
  Reranking: "Qwen3-Reranker-8B",
  "Voice Clone": "Qwen3-TTS-12Hz-1.7B-Base",
  Vision: "google/gemma-4-26b-a4b-it",
  "Image-to-Text": "google/gemma-4-26b-a4b-it",
  "Image Generation": "Qwen-Image-Edit-2511-Lightning",
  "Text-to-Image": "Qwen-Image-Edit-2511-Lightning",
  "Text-to-Music": "acestep-v15-xl-sft",
  "Music Generation": "acestep-v15-xl-sft",
  "Text Generation": "google/gemma-4-26b-a4b-it",
  Text: "google/gemma-4-26b-a4b-it",
  LLM: "google/gemma-4-26b-a4b-it",
};

const METRICS = [
  { value: "9", label: "available APIs" },
  { value: "1", label: "workbench" },
  { value: "RPM", label: "requests per minute" },
];

const WORKFLOW = [
  {
    eyebrow: "01 · Browse",
    title: "필요한 API를 먼저 고릅니다.",
    body: "텍스트, 검색, 음성, 비전, 이미지 생성까지 API별 목적과 입력 구조를 한 화면에서 비교합니다.",
  },
  {
    eyebrow: "02 · Test",
    title: "Playground에서 바로 실행합니다.",
    body: "API마다 다른 입력 폼으로 실제 요청을 보내고, 결과와 response payload를 확인합니다.",
  },
  {
    eyebrow: "03 · Ship",
    title: "결정한 API를 코드로 연결합니다.",
    body: "API key, endpoint, 코드 스니펫, 요금제를 같은 흐름에서 확인하고 제품에 붙입니다.",
  },
];

const SIGNALS = [
  "API catalog by capability",
  "Per-API playgrounds",
  "Latency and response review",
  "Playground to code handoff",
  "RPM-based capacity planning",
  "Server-side API key flow",
];

const TRUST_POINTS = [
  "API별 빠른 테스트",
  "예측 가능한 RPM 플랜",
  "개발자 친화적 코드 handoff",
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "모두의 창업 지원금으로 어떻게 신청하면 되나요?",
    a: "기관 정책상 각 API가 개별 상품으로 등록되어 있습니다. 필요한 API를 지원 한도 내에서 선택하시면 기관을 통해 구매 정보가 전달되며, 이후 운영팀이 계정에 사용 권한을 활성화해 드립니다. 7월 1일 사용 시작 전까지 운영팀이 별도로 안내를 진행할 예정입니다.",
  },
  {
    q: "AI API 오마카세는 어떤 서비스인가요?",
    a: "AI 서비스 개발에 필요한 다양한 API를 제공하는 플랫폼입니다. LLM, Embedding, Reranking, STT, TTS, OCR, 이미지 생성·분석 등의 AI API를 제공하며, 하나의 계정으로 여러 API를 사용할 수 있고 필요한 서비스만 선택하여 이용할 수 있습니다.",
  },
  {
    q: "월 결제 한 번으로 모든 API를 사용할 수 있나요?",
    a: "아닙니다. 현재 기관 정책에 따라 서비스가 9개의 개별 상품으로 분리되어 있습니다. 필요한 API를 각각 선택하셔야 하며, 선택한 서비스만 사용 가능합니다.",
  },
  {
    q: "월 정액인가요?",
    a: "네. Pro 요금제는 월 정액제로 운영되며, 추가 사용량에 따른 별도 과금 없이 동일한 월 비용으로 사용하실 수 있습니다.",
  },
  {
    q: "사용량은 토큰 기준인가요?",
    a: "아닙니다. AI API 오마카세는 토큰 차감 방식이 아닙니다. 요금제는 분당 호출 수(RPM)와 동시 접속 IP 수 기준으로 운영되며, 사용량이 많다고 추가 과금되는 구조가 아닙니다.",
  },
  {
    q: "하나의 계정으로 모든 API를 사용할 수 있나요?",
    a: "네. 계정은 1개만 생성되며 API Key도 1개만 발급됩니다. 다만 이용 권한은 구매(선택)하신 API 서비스에 대해서만 활성화됩니다. 예를 들어 LLM, Embedding, Reranking API를 선택하셨다면 하나의 API Key로 위 3개의 서비스를 모두 호출할 수 있습니다.",
  },
  {
    q: "API Key는 어떻게 발급되나요?",
    a: "계정당 API Key 1개가 자동으로 발급됩니다. 필요 시 직접 재발급이 가능하며, 노출된 Key는 삭제 후 새로 생성할 수 있습니다. 발급된 Key에는 구매하신 API 서비스 권한이 자동으로 연결됩니다.",
  },
  {
    q: "팀원들과 API Key를 공유할 수 있나요?",
    a: "네, 가능합니다. 다만 Pro 플랜 기준으로 동시에 사용할 수 있는 IP 수가 제한되며 현재 기준 최대 3개 IP까지 지원합니다.",
  },
  {
    q: "GPT, Claude, Gemini 모델을 사용할 수 있나요?",
    a: "현재는 자체 제공 모델 중심으로 운영됩니다. GPT, Claude, Gemini 연동 기능은 향후 확대될 예정입니다.",
  },
  {
    q: "서비스가 성장하면 더 높은 트래픽도 지원 가능한가요?",
    a: "네. 현재 Pro 요금제는 MVP 및 초기 서비스 운영에 적합한 수준이며, 대규모 상용 서비스가 필요한 경우 Enterprise 플랜을 통해 별도 협의가 가능합니다.",
  },
  {
    q: "한국어 STT 정확도는 어느 정도인가요?",
    a: "Whisper 기반 엔진을 사용하고 있으며, 오픈소스 STT 중에서는 높은 수준의 정확도를 제공합니다. 다만 음성 품질과 도메인에 따라 결과가 달라질 수 있으므로 Playground 테스트를 권장합니다.",
  },
  {
    q: "회의록 자동 요약 기능이 있나요?",
    a: "회의록 전용 기능은 제공하지 않지만 STT API와 LLM API 조합을 이용하여 자동 요약 기능을 쉽게 구현할 수 있습니다.",
  },
  {
    q: "장애가 발생하면 어떻게 되나요?",
    a: "서비스는 Load Balancer와 고가용성(HA) 구조로 운영됩니다. 장애 발생 시 자동 복구가 우선 수행되며, 문제가 지속될 경우 운영팀이 직접 대응합니다. 문의는 이메일 또는 전화로 가능합니다.",
  },
];

const FAQ_VISIBLE_COUNT = 10;

const PARTICIPANT_NOTICE_SESSION_KEY =
  "ai-api-omakase-participant-notice-dismissed";

function normalizeTask(taskKey?: string | null, name?: string | null) {
  const raw = `${taskKey ?? ""} ${name ?? ""}`.toLowerCase();
  if (/text[-\s]?to[-\s]?music|music generation|t2m|music/.test(raw)) {
    return "Text-to-Music";
  }
  if (/text[-\s]?to[-\s]?image|image generation|imagegen|t2i/.test(raw)) {
    return "Image Generation";
  }
  if (/image[-\s]?to[-\s]?text|vision|ocr|i2t/.test(raw)) {
    return "Image-to-Text";
  }
  if (/voice clone|voiceclone/.test(raw)) return "Voice Clone";
  if (/rerank/.test(raw)) return "Reranking";
  if (/embedding/.test(raw)) return "Embedding";
  if (/\bstt\b|speech[-\s]?to[-\s]?text|transcription/.test(raw)) return "STT";
  if (/\btts\b|text[-\s]?to[-\s]?speech/.test(raw)) return "TTS";
  if (/\bllm\b|text generation|chat/.test(raw)) return "LLM";
  return taskKey ?? name ?? "AI API";
}

function taskLabel(taskKey?: string | null, name?: string | null) {
  const task = normalizeTask(taskKey, name);
  return TASK_LABELS[task] ?? task;
}

function taskDetail(taskKey?: string | null, name?: string | null, fallback?: string | null) {
  const task = normalizeTask(taskKey, name);
  return TASK_DETAILS[task] ?? fallback ?? "AI Engine · API";
}

export default function Home() {
  const [capabilities, setCapabilities] =
    useState<Capability[]>(CAPABILITY_FALLBACK);
  const [participantNoticeOpen, setParticipantNoticeOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<Set<number>>(() => new Set([0]));
  const [showAllFaq, setShowAllFaq] = useState(false);

  const visibleFaq = showAllFaq
    ? FAQ_ITEMS
    : FAQ_ITEMS.slice(0, FAQ_VISIBLE_COUNT);

  function toggleFaq(index: number) {
    setOpenFaq((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;

    getApis()
      .then((raw) => {
        if (cancelled) return;

        const seen = new Set<string>();
        const next = raw
          .filter((api) => api.is_active !== false)
          .map((api) => {
            const task = normalizeTask(api.task_key, api.name);
            const route = TASK_ROUTES[task] ?? "llm";
            return {
              label: taskLabel(task, api.name),
              detail: taskDetail(
                task,
                api.name,
                api.model_display ?? api.company_name,
              ),
              href: `/api-test?task=${route}&view=detail`,
            };
          })
          .filter((item) => {
            if (seen.has(item.label)) return false;
            seen.add(item.label);
            return true;
          })
          .slice(0, 9);

        if (next.length > 0) setCapabilities(next);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let shouldOpen = false;

    try {
      if (sessionStorage.getItem(PARTICIPANT_NOTICE_SESSION_KEY) !== "true") {
        shouldOpen = true;
      }
    } catch {
      shouldOpen = true;
    }

    if (!shouldOpen) return;

    const timer = window.setTimeout(() => {
      setParticipantNoticeOpen(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function closeParticipantNotice() {
    setParticipantNoticeOpen(false);
    try {
      sessionStorage.setItem(PARTICIPANT_NOTICE_SESSION_KEY, "true");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#08090d]">
      <SiteNav fixed />

      {participantNoticeOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/28 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="participant-notice-title"
        >
          <div className="w-full max-w-[520px] border border-black/[0.08] bg-white p-6 shadow-[0_30px_120px_rgba(8,9,13,0.22)] md:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-normal text-[#d84a3a]">
                  beta access
                </p>
                <h2
                  id="participant-notice-title"
                  className="mt-3 text-[26px] font-semibold leading-tight tracking-normal text-[#08090d]"
                >
                  8월까지 모두의 창업 참가자 전용으로 운영됩니다.
                </h2>
              </div>
              <button
                type="button"
                onClick={closeParticipantNotice}
                aria-label="안내 닫기"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] text-black/42 transition-colors hover:border-black/16 hover:text-black"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-5 text-[15px] leading-7 text-black/58">
              AI API 오마카세는 현재 모두의 창업 참가자에게 우선 제공되고
              있습니다. 안정적인 사용 경험을 위해 8월까지 제한적으로 운영합니다.
            </p>
            <p className="mt-3 text-[14px] leading-6 text-black/50">
              참가자가 아니지만 사용을 원하시면 이메일로 문의해주세요.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:help@kogrobo.com?subject=AI%20API%20%EC%98%A4%EB%A7%88%EC%B9%B4%EC%84%B8%20%EC%82%AC%EC%A0%84%20%EC%82%AC%EC%9A%A9%20%EB%AC%B8%EC%9D%98"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#08090d] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-black"
              >
                이메일 문의하기
              </a>
              <button
                type="button"
                onClick={closeParticipantNotice}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-black/[0.12] bg-white px-5 text-[14px] font-semibold text-black/68 transition-colors hover:border-black/20 hover:text-black"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="pt-[72px]">
        <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#f7f8fb]">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 py-16 md:px-8 md:py-20 lg:px-10 lg:py-24 xl:grid-cols-[minmax(0,1fr)_minmax(560px,1.1fr)] 2xl:max-w-[1680px]">
            <div className="flex min-w-0 flex-col justify-start pb-6 md:pb-10">
              <div>
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-black/58 shadow-[0_1px_2px_rgba(8,9,13,0.04)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15b87a]" />
                  AI API workbench
                </div>

                <h1 className="max-w-[920px] break-keep text-[32px] font-semibold leading-[1.07] tracking-normal text-[#08090d] sm:text-[40px] md:text-[48px] lg:text-[48px] xl:text-[52px] 2xl:text-[60px]">
                  <span className="block">필요한 AI API를</span>
                  <span className="block">테스트하고 선택하세요.</span>
                </h1>

                <p className="mt-7 max-w-[340px] break-words text-[16px] leading-8 text-black/62 sm:max-w-[720px] md:text-[19px]">
                  AI API 오마카세는 9개 AI API를 한 곳에서 탐색하고 테스트하는
                  개발자용 플랫폼입니다. 결과를 확인한 뒤 바로 제품에 연결하세요.
                </p>

                <div className="mt-9 flex max-w-[340px] flex-col gap-3 sm:max-w-none sm:flex-row">
                  <Link
                    href="/api-test"
                    className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#08090d] px-5 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(8,9,13,0.16)] transition-colors hover:bg-black sm:w-auto"
                  >
                    플레이그라운드 바로 실행
                  </Link>
                  <Link
                    href="/plans"
                    className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-black/[0.12] bg-white px-5 text-[14px] font-semibold text-black/72 shadow-[0_1px_2px_rgba(8,9,13,0.04)] transition-colors hover:border-black/20 hover:text-black sm:w-auto"
                  >
                    요금제 비교하기
                  </Link>
                </div>

                <div className="mt-6 grid gap-2 text-[13px] text-black/46 sm:flex sm:flex-wrap sm:gap-x-4">
                  {TRUST_POINTS.map((point) => (
                    <span key={point} className="inline-flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#15b87a]" />
                      {point}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-14 grid max-w-3xl grid-cols-1 border-y border-black/[0.08] sm:grid-cols-3">
                {METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="min-w-0 border-b border-black/[0.08] py-4 pr-3 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:py-5 sm:pr-4 sm:last:border-r-0"
                  >
                    <p className="text-[22px] font-semibold tracking-normal text-[#08090d] sm:text-[28px]">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-[12px] font-medium uppercase tracking-normal text-black/42">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-stretch gap-3 xl:justify-center">
              <figure className="flex w-full max-w-[720px] flex-col gap-4 xl:ml-auto">
                <figcaption className="break-keep text-center text-[14px] font-medium leading-snug text-black/68 sm:text-[15px] lg:text-[16px]">
                  누구나 따라 할 수 있는 QA 챗봇 프롬프트 코딩 예제
                </figcaption>
                <div className="relative w-full overflow-hidden rounded-xl border border-black/[0.08] bg-[#f0f1f4] shadow-[0_24px_90px_rgba(8,9,13,0.09)]">
                  <div className="aspect-video w-full">
                    <iframe
                      src="https://www.youtube.com/embed/__hdL92vSoY?autoplay=1&mute=1&loop=1&playlist=__hdL92vSoY&modestbranding=1&rel=0&playsinline=1"
                      title="누구나 따라 할 수 있는 QA 챗봇 프롬프트 코딩 예제"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="block h-full w-full border-0"
                    />
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </section>

        <section className="border-b border-black/[0.06] bg-white px-5 py-16 md:px-8 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-normal text-black/38">
                how it works
              </p>
              <h2 className="mt-4 max-w-xl text-[38px] font-semibold leading-[1.05] tracking-normal md:text-[52px]">
                API를 고르고, 테스트하고, 결정합니다.
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-7 text-black/54">
                AI API 오마카세는 여러 AI 기능을 API 단위로 정리해, 개발자가
                직접 비교하고 빠르게 붙일 수 있게 만드는 Workbench입니다.
              </p>
            </div>

            <div className="grid gap-0 border border-black/[0.08] bg-[#fbfbfc] md:grid-cols-3">
              {WORKFLOW.map((item) => (
                <div
                  key={item.eyebrow}
                  className="border-b border-black/[0.08] bg-white p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-8 text-[21px] font-semibold leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[14px] leading-6 text-black/54">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fb] px-5 py-16 md:px-8 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="border border-black/[0.08] bg-white p-6 md:p-8">
              <p className="font-mono text-[12px] uppercase tracking-normal text-black/38">
                api catalog
              </p>
              <h2 className="mt-4 max-w-lg text-[32px] font-semibold leading-[1.08] tracking-normal md:text-[42px]">
                여러 AI 기능을 하나의 개발 경험으로 연결합니다.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-black/54">
                Text, retrieval, speech, vision, generation API를 같은 인증과
                같은 사용 흐름으로 다룹니다. 필요한 API를 고르고 결과를 확인하세요.
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {capabilities.map((capability) => {
                  const cardContent = (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-[18px] font-semibold">
                          {capability.label}
                        </h3>
                        <span className="font-mono text-[12px] text-black/24 group-hover:text-black/58">
                          ↗
                        </span>
                      </div>
                      <p className="mt-8 break-words text-[13px] leading-5 text-black/48">
                        {capability.detail}
                      </p>
                    </>
                  );

                  return (
                    <Link
                      key={capability.label}
                      href={capability.href}
                      className="group min-h-[128px] border border-black/[0.07] bg-[#fbfbfc] p-4 transition-colors hover:border-black/[0.16] hover:bg-white"
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between border border-black/[0.08] bg-[#08090d] p-6 text-white md:p-8">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-normal text-white/36">
                  enterprise signals
                </p>
                <h2 className="mt-5 max-w-lg text-[38px] font-semibold leading-[1.05] tracking-normal md:text-[48px]">
                  필요한 API만 구독하여 무제한으로 사용하세요.
                </h2>
                <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/56">
                  Playground에서 먼저 테스트하고, 코드 예제로 바로 개발에 적용하세요.
                </p>
              </div>

              <div className="mt-14 grid gap-2 sm:grid-cols-2">
                {SIGNALS.map((signal) => (
                  <div
                    key={signal}
                    className="border border-white/[0.10] bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-[14px] text-white/72">{signal}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/api-test"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-5 text-[14px] font-semibold text-[#08090d] transition-colors hover:bg-white/90"
                >
                  플레이그라운드 바로 실행
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/[0.18] px-5 text-[14px] font-semibold text-white/72 transition-colors hover:border-white/30 hover:text-white"
                >
                  API docs 보기
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="border-t border-black/[0.06] bg-white px-5 py-16 md:px-8 md:py-20 lg:px-10"
        >
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="font-mono text-[12px] uppercase tracking-normal text-black/38">
                frequently asked
              </p>
              <h2 className="mt-4 max-w-md text-[32px] font-semibold leading-[1.05] tracking-normal md:text-[44px]">
                자주 묻는 질문
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-black/54">
                서비스 도입 전에 가장 많이 받은 질문을 정리했습니다. 더
                궁금한 점이 있으시면 언제든 이메일로 문의해주세요.
              </p>
              <a
                href="mailto:help@kogrobo.com?subject=AI%20API%20%EC%98%A4%EB%A7%88%EC%B9%B4%EC%84%B8%20%EB%AC%B8%EC%9D%98"
                className="mt-7 inline-flex h-11 items-center justify-center rounded-lg border border-black/[0.12] bg-white px-5 text-[14px] font-semibold text-black/72 shadow-[0_1px_2px_rgba(8,9,13,0.04)] transition-colors hover:border-black/20 hover:text-black"
              >
                help@kogrobo.com 으로 문의하기
              </a>
            </div>

            <div>
              <ul className="border-t border-black/[0.08]">
                {visibleFaq.map((item, index) => {
                  const isOpen = openFaq.has(index);
                  const panelId = `faq-panel-${index}`;
                  const buttonId = `faq-button-${index}`;
                  return (
                    <li
                      key={item.q}
                      className="border-b border-black/[0.08]"
                    >
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          onClick={() => toggleFaq(index)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-black md:py-6"
                        >
                          <span className="text-[15px] font-medium leading-snug text-[#08090d] md:text-[17px]">
                            {item.q}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center font-mono text-[18px] leading-none text-black/42 transition-transform duration-200 ${
                              isOpen ? "rotate-45 text-black/72" : ""
                            }`}
                          >
                            +
                          </span>
                        </button>
                      </h3>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        hidden={!isOpen}
                        className="pb-6 pr-2 text-[14px] leading-7 text-black/58 md:pr-10 md:text-[15px]"
                      >
                        {item.a}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {FAQ_ITEMS.length > FAQ_VISIBLE_COUNT ? (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAllFaq((prev) => !prev)}
                    className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-normal text-black/58 transition-colors hover:text-black"
                  >
                    <span>
                      {showAllFaq
                        ? "접기"
                        : `더 보기 +${FAQ_ITEMS.length - FAQ_VISIBLE_COUNT}`}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`transition-transform duration-200 ${
                        showAllFaq ? "rotate-180" : ""
                      }`}
                    >
                      ↓
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
