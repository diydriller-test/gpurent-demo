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
    detail: "Qwen3.6 35B multi modal",
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
    detail: "Qwen3.6 35B",
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
  Vision: "Qwen3.6 35B multi modal",
  "Image-to-Text": "Qwen3.6 35B multi modal",
  "Image Generation": "Qwen-Image-Edit-2511-Lightning",
  "Text-to-Image": "Qwen-Image-Edit-2511-Lightning",
  "Text-to-Music": "acestep-v15-xl-sft",
  "Music Generation": "acestep-v15-xl-sft",
  "Text Generation": "Qwen3.6 35B",
  Text: "Qwen3.6 35B",
  LLM: "Qwen3.6 35B",
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

const TTS_DEMO_PAYLOAD = `{
  "language": "ko",
  "speaker": "warm",
  "style_instruction": "차분하고 신뢰감 있게",
  "text": "안녕하세요. AI API 오마카세입니다."
}`;

type TtsDemoPhase = "typing" | "ready" | "generating" | "done";

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

function HeroTtsWorkbench() {
  const [typedPayload, setTypedPayload] = useState("");
  const [phase, setPhase] = useState<TtsDemoPhase>("typing");

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });

    async function run() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setTypedPayload(TTS_DEMO_PAYLOAD);
        setPhase("done");
        return;
      }

      while (!cancelled) {
        setTypedPayload("");
        setPhase("typing");
        await wait(520);

        for (let index = 0; index < TTS_DEMO_PAYLOAD.length; index += 1) {
          if (cancelled) return;
          setTypedPayload(TTS_DEMO_PAYLOAD.slice(0, index + 1));
          await wait(TTS_DEMO_PAYLOAD[index] === "\n" ? 105 : 20);
        }

        if (cancelled) return;
        setPhase("ready");
        await wait(1250);

        if (cancelled) return;
        setPhase("generating");
        await wait(980);

        if (cancelled) return;
        setPhase("done");
        await wait(3600);

        if (cancelled) return;
        await wait(900);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const isGenerating = phase === "generating";
  const isDone = phase === "done";
  const showCursor = phase === "ready" || phase === "generating";
  const statusLabel =
    phase === "typing" ? "typing" : phase === "ready" ? "ready" : isGenerating ? "generating" : "200 OK";

  return (
    <div
      data-hero-tts-workbench
      className="w-full max-w-[540px] overflow-hidden border border-black/[0.08] bg-white shadow-[0_24px_90px_rgba(8,9,13,0.09)]"
    >
      <div className="flex h-9 items-center justify-between border-b border-black/[0.06] px-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="truncate font-mono text-[11px] text-black/38">
          api.workbench
        </span>
      </div>

      <div className="relative p-3 sm:p-4">
        <div className="border border-black/[0.06] bg-[#fbfbfc] p-3">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-normal text-black/35">
                selected API
              </p>
              <h2 className="mt-1.5 break-words text-[21px] font-semibold leading-tight tracking-normal">
                TTS API
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d84a3a]/25 bg-[#d84a3a]/8 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#a93229]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d84a3a]" />
              live test
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-black/[0.06] py-2 font-mono text-[10px] text-black/48">
            <span className="truncate">Qwen3-TTS-12Hz-1.7B-CustomVoice</span>
            <span className="text-black/20">/</span>
            <span className="font-semibold text-black/64">POST /api/tts</span>
          </div>

          <div className="mt-3 overflow-hidden border border-black/[0.08] bg-[#08090d]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-3 py-1.5">
              <p className="font-mono text-[10px] uppercase tracking-normal text-white/42">
                request payload
              </p>
              <p className="font-mono text-[10px] uppercase tracking-normal text-[#d84a3a]">
                {statusLabel}
              </p>
            </div>
            <pre className="min-h-[88px] whitespace-pre-wrap p-3 font-mono text-[10.5px] leading-[1.38] text-white/86">
              {typedPayload}
              {phase === "typing" ? (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-[#d84a3a]" />
              ) : null}
            </pre>
          </div>

          <div className="relative mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              className={[
                "inline-flex h-10 min-w-[124px] items-center justify-center bg-[#d84a3a] px-4 text-[13px] font-semibold text-white transition-transform",
                isGenerating ? "gap-2" : "",
                phase === "ready" ? "translate-y-px scale-[0.99]" : "",
              ].join(" ")}
            >
              {isGenerating ? (
                <span className="hero-tts-spinner h-3 w-3 rounded-full border-2 border-white/35 border-t-white" />
              ) : null}
              {isGenerating ? "생성 중" : isDone ? "재생 중" : "음성 합성"}
            </button>
            <span className="font-mono text-[10px] text-black/42">
              API key ready
            </span>
            <span
              className={[
                "hero-demo-cursor pointer-events-none absolute left-[108px] top-[25px] z-10 h-7 w-[22px] transition-all duration-500",
                showCursor ? "opacity-100" : "translate-x-[-36px] translate-y-[-12px] opacity-0",
              ].join(" ")}
              aria-hidden="true"
            />
          </div>
        </div>

        <div
          className={[
            "mt-3 border border-black/[0.06] bg-white p-3 transition-all duration-300",
            isDone ? "translate-y-0 opacity-100" : "translate-y-2 opacity-20",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-normal text-black/35">
                generated audio
              </p>
              <h3 className="mt-1.5 text-[17px] font-semibold leading-tight">
                생성된 음성을 바로 확인합니다.
              </h3>
            </div>
            <span className="rounded-full border border-[#d84a3a]/25 bg-[#d84a3a]/8 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#a93229]">
              200 OK
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-y border-black/[0.06] py-2 font-mono text-[10px] text-black/46">
            <span>
              latency <strong className="text-black/82">1.24s</strong>
            </span>
            <span>
              duration <strong className="text-black/82">6.8s</strong>
            </span>
            <span>
              format <strong className="text-black/82">wav</strong>
            </span>
          </div>

          <p className="mt-3 text-[12px] leading-5 text-black/54">
            언어, 화자, 스타일 지시와 읽어줄 텍스트를 입력하면 합성 결과와 응답 정보를
            한 화면에서 확인합니다.
          </p>

          <div
            className={[
              "hero-tts-wave mt-3 flex h-10 items-end justify-center gap-1 border border-[#d84a3a]/20 bg-[#d84a3a]/5",
              isDone ? "is-playing" : "",
            ].join(" ")}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <i
                key={index}
                className="block w-1.5 rounded-full bg-[#d84a3a]"
                style={{
                  height: `${[10, 19, 14, 28, 36, 16, 24, 18, 31, 22, 12, 26][index]}px`,
                  animationDelay: `${index * 80}ms`,
                }}
              />
            ))}
          </div>

          <p className="mt-2 font-mono text-[10px] uppercase text-black/34">
            audio ready · code handoff
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [capabilities, setCapabilities] =
    useState<Capability[]>(CAPABILITY_FALLBACK);

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

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#08090d]">
      <SiteNav fixed />

      <main className="pt-[72px]">
        <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#f7f8fb]">
          <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1440px] grid-cols-1 gap-10 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,0.78fr)] lg:px-10 lg:py-12">
            <div className="flex min-h-[560px] min-w-0 flex-col justify-between py-6 md:py-10">
              <div>
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-black/58 shadow-[0_1px_2px_rgba(8,9,13,0.04)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15b87a]" />
                  AI API workbench
                </div>

                <h1 className="max-w-[920px] text-[38px] font-semibold leading-[1.07] tracking-normal text-[#08090d] sm:text-[56px] md:text-[70px] lg:text-[82px] xl:text-[92px]">
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

            <div className="flex min-w-0 items-start lg:-mt-11 lg:justify-end">
              <HeroTtsWorkbench />
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
                  운영 가능한 AI infra는 조용하고, 예측 가능해야 합니다.
                </h2>
                <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/56">
                  실험용 데모가 아니라 production에 붙일 수 있는 trace, capacity,
                  API key 흐름을 첫 경험부터 같은 언어로 제공합니다.
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
      </main>

    </div>
  );
}
