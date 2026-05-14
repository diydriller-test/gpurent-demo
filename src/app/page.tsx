"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { getApis } from "@/lib/api";

type Capability = {
  label: string;
  detail: string;
  href: string;
};

const CAPABILITY_FALLBACK: Capability[] = [
  {
    label: "Speech",
    detail: "STT, TTS, voice clone",
    href: "/api-test?task=stt",
  },
  {
    label: "Retrieval",
    detail: "Embedding and rerank",
    href: "/api-test?task=embedding",
  },
  {
    label: "Generation",
    detail: "Text, image, music",
    href: "/api-test?task=llm",
  },
  {
    label: "Vision",
    detail: "Image-to-text pipelines",
    href: "/api-test?task=image2text",
  },
];

const TASK_ROUTES: Record<string, string> = {
  STT: "stt",
  TTS: "tts",
  Embedding: "embedding",
  Reranker: "reranker",
  "Voice Clone": "voiceClone",
  Vision: "image2text",
  "Text-to-Music": "t2m",
  "Image Generation": "t2i",
  "Text Generation": "llm",
};

const METRICS = [
  { value: "14+", label: "available APIs" },
  { value: "1", label: "workbench" },
  { value: "RPS", label: "capacity pricing" },
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
  "RPS-based capacity planning",
  "Server-side API key flow",
];

const TRUST_POINTS = [
  "API별 빠른 테스트",
  "예측 가능한 RPS 플랜",
  "개발자 친화적 코드 handoff",
];

const ROUTING_STEPS = [
  ["select", "Embedding"],
  ["test", "Playground run"],
  ["ship", "API key + code"],
];

function taskLabel(taskKey?: string, name?: string) {
  if (!taskKey) return name ?? "AI API";
  if (taskKey === "Text Generation") return "Text";
  if (taskKey === "Vision") return "Vision";
  return taskKey;
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
            const task = api.task_key ?? api.name;
            const route = TASK_ROUTES[task] ?? "llm";
            return {
              label: taskLabel(api.task_key, api.name),
              detail: api.card_sublabel ?? api.model_display ?? api.company_name,
              href: `/api-test?task=${route}`,
            };
          })
          .filter((item) => {
            if (seen.has(item.label)) return false;
            seen.add(item.label);
            return true;
          })
          .slice(0, 8);

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

                <h1 className="max-w-[920px] text-[42px] font-semibold leading-[1.04] tracking-normal text-[#08090d] sm:text-[56px] md:text-[70px] lg:text-[82px] xl:text-[92px]">
                  <span className="block">필요한 AI API를</span>
                  <span className="block">테스트하고 선택하세요.</span>
                </h1>

                <p className="mt-7 max-w-[720px] break-all text-[16px] leading-8 text-black/62 sm:break-words md:text-[19px]">
                  AI API 오마카세는 여러 AI API를 한 곳에서 탐색하고,
                  Playground에서 직접 테스트한 뒤 제품에 연결하는 개발자용 플랫폼입니다.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/api-test?api=llm"
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
                    className="min-w-0 border-b border-black/[0.08] py-4 pr-3 last:border-b-0 sm:border-b-0 sm:border-r sm:py-5 sm:pr-4 sm:last:border-r-0"
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

            <div className="flex min-w-0 items-center lg:justify-end">
              <div className="w-full max-w-[580px] overflow-hidden border border-black/[0.08] bg-white shadow-[0_24px_90px_rgba(8,9,13,0.09)]">
                <div className="flex h-11 items-center justify-between border-b border-black/[0.06] px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="truncate font-mono text-[11px] text-black/38">
                    api.workbench
                  </span>
                </div>

                <div className="p-5">
                  <div className="border border-black/[0.06] bg-[#fbfbfc] p-4">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-normal text-black/35">
                          selected API
                        </p>
                        <h2 className="mt-2 break-words text-[22px] font-semibold leading-tight tracking-normal">
                          Embedding API
                        </h2>
                      </div>
                      <span className="rounded-md bg-[#eafaf3] px-2 py-1 font-mono text-[11px] font-medium text-[#08764c]">
                        live
                      </span>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {ROUTING_STEPS.map(([label, value], index) => (
                        <div
                          key={label}
                          className="border border-black/[0.06] bg-white p-3"
                        >
                          <p className="font-mono text-[10px] uppercase text-black/35">
                            0{index + 1} · {label}
                          </p>
                          <p className="mt-2 text-[13px] font-semibold leading-5 text-[#08090d]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr]">
                      <div className="border border-black/[0.06] bg-[#f7f8fb] p-3">
                        <p className="font-mono text-[10px] uppercase tracking-normal text-black/35">
                          endpoint
                        </p>
                        <p className="mt-2 break-words text-[15px] font-semibold">
                          POST /api/embedding
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border border-black/[0.06] bg-white p-3">
                          <p className="font-mono text-[10px] text-black/35">
                            latency
                          </p>
                          <p className="mt-1 text-[17px] font-semibold">
                            320ms
                          </p>
                        </div>
                        <div className="border border-black/[0.06] bg-white p-3">
                          <p className="font-mono text-[10px] text-black/35">
                            response
                          </p>
                          <p className="mt-1 text-[17px] font-semibold">
                            200 OK
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border border-black/[0.06] bg-white px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-normal text-black/35">
                        result review
                      </p>
                      <p className="mt-1 break-words text-[14px] leading-6 text-black/62">
                        워크벤치에서 결과를 확인하고, 같은 endpoint를 코드 예제로
                        바로 연결합니다.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 items-center gap-4 border border-black/[0.06] bg-[#08090d] p-4 text-white sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-normal text-white/36">
                        production handoff
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-white/84">
                        선택한 API를 API key와 코드 스니펫으로 바로 넘깁니다.
                      </p>
                    </div>
                    <span className="font-mono text-[12px] text-white/45">
                      200 OK
                    </span>
                  </div>
                </div>
              </div>
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
                {capabilities.map((capability) => (
                  <Link
                    key={capability.label}
                    href={capability.href}
                    className="group min-h-[128px] border border-black/[0.07] bg-[#fbfbfc] p-4 transition-colors hover:border-black/[0.16] hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[18px] font-semibold">
                        {capability.label}
                      </h3>
                      <span className="font-mono text-[12px] text-black/24 group-hover:text-black/58">
                        ↗
                      </span>
                    </div>
                    <p className="mt-8 text-[13px] leading-5 text-black/48">
                      {capability.detail}
                    </p>
                  </Link>
                ))}
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
                  href="/api-test?api=llm"
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
