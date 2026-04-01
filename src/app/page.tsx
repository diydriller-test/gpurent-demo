"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NavAuthButton } from "@/components/NavAuthButton";

type ApiCard = {
  name: string;
  description: string;
  icon: string;
  apiId?: "llm" | "embedding" | "reranker" | "tts" | "stt";
  comingSoon?: boolean;
};

const APIS: ApiCard[] = [
  {
    name: "Text",
    description: "대화, 요약, 생성 작업을 빠르게 처리하는 텍스트 생성 API",
    icon: "✦",
    apiId: "llm",
  },
  {
    name: "STT",
    description: "음성을 텍스트로 변환하는 스피치 투 텍스트 API",
    icon: "◉",
    apiId: "stt",
  },
  {
    name: "Embedding",
    description:
      "텍스트를 벡터로 변환하는 임베딩 API. RAG, 시맨틱 검색에 최적화",
    icon: "◇",
    apiId: "embedding",
  },
  {
    name: "Re-ranking",
    description: "검색 결과의 관련도를 재정렬하여 정확도 향상",
    icon: "⇅",
    apiId: "reranker",
  },
  {
    name: "TTS",
    description: "텍스트를 자연스러운 음성으로 변환하는 텍스트 투 스피치 API",
    icon: "♪",
    apiId: "tts",
  },
  {
    name: "더 많은 API 확인하러 가기",
    description: "전체 API를 둘러보고 All을 선택하세요",
    icon: "+",
    comingSoon: true,
  },
];

const BENEFITS = [
  {
    title: "월정액제",
    description:
      "사용량 변동이 있어도 매달 같은 기준으로 비용을 계획할 수 있는 안정적인 과금 구조",
  },
  {
    title: "자체 GPU 인프라",
    description: "우리 회사 GPU로 구축하여 훨씬 저렴한 가격 제공",
  },
  {
    title: "확장 가능한 API",
    description: "임베딩, 리랭킹, TTS 등 다양한 API를 하나의 플랫폼에서",
  },
];

const HERO_BADGES = [
  "월정액 중심 비용 구조",
  "자체 GPU 인프라 운영",
  "Playground로 바로 테스트",
  "텍스트·임베딩·TTS 통합 제공",
];

const OMAKASE_LLM_STARTER_PRICE = 190000;
const USD_TO_KRW = 1530;
const GPT4O_INPUT_USD_PER_M = 5;
const GPT4O_OUTPUT_USD_PER_M = 15;
const GPT4O_BLEND_USD_PER_M = (GPT4O_INPUT_USD_PER_M + GPT4O_OUTPUT_USD_PER_M) / 2;
const GPT4O_KRW_PER_M_TOKEN = GPT4O_BLEND_USD_PER_M * USD_TO_KRW;
const TARGET_BREAK_EVEN_X = OMAKASE_LLM_STARTER_PRICE / GPT4O_KRW_PER_M_TOKEN;
const TARGET_BREAK_EVEN_Y = OMAKASE_LLM_STARTER_PRICE;
const TARGET_GRAPH_MAX_X = 70;
const TARGET_GRAPH_MAX_Y = 1100000;
const TARGET_GRAPH_TICKS_X = [0, 10, 20, 30, 40, 50, 60, 70];
const TARGET_GRAPH_TICKS_Y = [0, 100000, 190000, 300000, 500000, 700000, 1000000];
const TARGET_GRAPH_LEFT = 90;
const TARGET_GRAPH_RIGHT = 870;
const TARGET_GRAPH_TOP = 72;
const TARGET_GRAPH_BOTTOM = 392;

const TARGET_CUSTOMERS = [
  {
    title: "대량 Chunking / 전처리 개발자",
    description:
      "문서 분할과 전처리를 반복할수록 토큰 과금보다 월정액 구조가 더 유리해집니다.",
  },
  {
    title: "PoC 대량, 반복 실험자",
    description:
      "프롬프트와 파이프라인을 계속 바꿔 검증해야 한다면, 실험 속도와 예측 가능한 비용이 더 중요합니다.",
  },
  {
    title: "동시 End-user 다수 서비스",
    description:
      "동시 요청이 많은 서비스일수록 교점 이후 구간에서 비용 예측성과 운영 설명력이 확실히 좋아집니다.",
  },
];

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatGraphWonTick(value: number) {
  if (value === 0) return "";
  return `${Math.round(value / 10000)}만원`;
}

function graphX(x: number) {
  return (
    TARGET_GRAPH_LEFT +
    (x / TARGET_GRAPH_MAX_X) * (TARGET_GRAPH_RIGHT - TARGET_GRAPH_LEFT)
  );
}

function graphY(y: number) {
  return (
    TARGET_GRAPH_BOTTOM -
    (y / TARGET_GRAPH_MAX_Y) * (TARGET_GRAPH_BOTTOM - TARGET_GRAPH_TOP)
  );
}

const DIFFERENTIATORS = [
  {
    title: "비용이 예측됩니다",
    description:
      "토큰 사용량에 따라 청구서가 흔들리는 구조 대신, 월정액 중심으로 예산을 안정적으로 관리할 수 있습니다.",
  },
  {
    title: "도입 속도가 빠릅니다",
    description:
      "텍스트 생성, 임베딩, 리랭킹, TTS, STT를 한 플랫폼에서 바로 테스트하고 필요한 기능만 빠르게 붙일 수 있습니다.",
  },
  {
    title: "운영 효율이 높습니다",
    description:
      "자체 GPU 인프라를 기반으로 가격 경쟁력을 확보하고, 여러 벤더를 따로 관리할 필요를 줄여줍니다.",
  },
];

const FITS_FOR = [
  "PoC를 빠르게 시작해야 하는 팀",
  "토큰 과금 대신 고정 비용이 필요한 팀",
  "여러 AI 기능을 한 번에 붙여야 하는 팀",
];

const COMPARISON_ROWS = [
  {
    label: "비용 구조",
    before: "토큰/사용량에 따라 월 청구가 흔들릴 수 있음",
    after: "월정액 중심으로 예산 계획이 더 명확함",
  },
  {
    label: "도입 방식",
    before: "기능별로 여러 벤더를 비교하고 각각 붙여야 함",
    after: "한 플랫폼에서 테스트 후 필요한 API만 빠르게 연결",
  },
  {
    label: "확장 경로",
    before: "플랜 기준이 제각각이라 운영 확장 판단이 어려움",
    after: "Starter에서 Pro로 RPS 기준에 따라 단순하게 확장",
  },
  {
    label: "운영 관리",
    before: "API 공급자와 비용 구조가 분산되어 관리 피로도가 큼",
    after: "자체 GPU 인프라 기반으로 운영/가격 구조를 한 번에 이해 가능",
  },
];

const USE_CASES = [
  {
    title: "고객 응대 자동화",
    summary:
      "STT + LLM + 요약 API를 조합해 상담 내용을 빠르게 정리하고 응답 품질을 높입니다.",
    flow: "STT -> Text -> Summary",
    outcome: "상담 기록 자동화, 응답 속도 개선, CS 운영 효율 향상",
  },
  {
    title: "검색 정확도 향상",
    summary:
      "Embedding + Reranker를 함께 사용해 문서 검색 정확도를 높이고 필요한 결과를 더 빠르게 찾을 수 있습니다.",
    flow: "Embedding -> Reranker",
    outcome: "RAG 품질 향상, 검색 결과 정밀도 개선, 정보 탐색 시간 단축",
  },
  {
    title: "콘텐츠 운영 자동화",
    summary:
      "Copywrite, Sentiment, NER를 조합해 마케팅 문안 생성부터 리뷰 분석, 핵심 엔티티 추출까지 한 번에 처리합니다.",
    flow: "Copywrite -> Sentiment -> NER",
    outcome: "콘텐츠 제작 시간 절감, 리뷰 분석 자동화, 운영 인사이트 확보",
  },
];

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Playground에서 바로 검증",
    description:
      "텍스트, 임베딩, TTS, STT 등 필요한 API를 직접 테스트하며 우리 서비스에 맞는 조합을 빠르게 확인합니다.",
  },
  {
    step: "02",
    title: "Starter로 작게 시작",
    description:
      "낮은 진입 비용의 월정액 플랜으로 부담 없이 시작하고, 운영 전 실제 사용 흐름을 안전하게 검증할 수 있습니다.",
  },
  {
    step: "03",
    title: "트래픽에 맞춰 Pro로 확장",
    description:
      "서비스 성장 단계에서는 더 높은 RPS의 Pro 플랜으로 단순하게 확장해 비용과 성능을 함께 관리합니다.",
  },
];

const PRICE_SUMMARY = [
  {
    title: "Starter",
    subtitle: "빠른 검증 / PoC 시작",
    price: "10,000원부터",
    rps: "1 ~ 3.5 RPS",
    tone: "border-white/8 bg-background/25",
    points: [
      "STT, TTS처럼 낮은 진입 비용으로 시작",
      "초기 연동과 사내 검증에 적합",
    ],
  },
  {
    title: "Pro",
    subtitle: "운영 확장 / 실서비스 대응",
    price: "30,000원부터",
    rps: "최대 3배 확장",
    tone: "border-accent/28 bg-accent/7 shadow-[0_0_48px_rgba(232,136,138,0.08)]",
    points: [
      "Starter 대비 더 높은 RPS 운영",
      "성장 단계에서도 단순한 비용 구조 유지",
    ],
  },
];

const FINAL_CTA_POINTS = [
  "Playground에서 바로 성능 확인",
  "Starter로 부담 없이 시작",
  "필요 시 Pro로 단순 확장",
];

const API_BELT = [...APIS, ...APIS];

export default function Home() {
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(
    null,
  );
  const comingSoonTimerRef = useRef<number | null>(null);
  const underCarouselRef = useRef<HTMLDivElement | null>(null);
  const underPausedRef = useRef(false);
  const underResumeTimerRef = useRef<number | null>(null);

  function showComingSoon(message: string) {
    setComingSoonMessage(message);
    if (comingSoonTimerRef.current) {
      window.clearTimeout(comingSoonTimerRef.current);
    }
    comingSoonTimerRef.current = window.setTimeout(() => {
      setComingSoonMessage(null);
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (comingSoonTimerRef.current) {
        window.clearTimeout(comingSoonTimerRef.current);
      }
      if (underResumeTimerRef.current) {
        window.clearTimeout(underResumeTimerRef.current);
      }
    };
  }, []);

  function pauseUnderCarousel(ms = 1200) {
    underPausedRef.current = true;
    if (underResumeTimerRef.current) {
      window.clearTimeout(underResumeTimerRef.current);
    }
    underResumeTimerRef.current = window.setTimeout(() => {
      underPausedRef.current = false;
    }, ms);
  }

  // 가로로 자동 이동(우->좌 느낌) + 사용자가 조작하면 잠시 멈춤
  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (media?.matches) return;

    let raf = 0;
    let last = performance.now();
    const speedPxPerSec = 60;

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const el = underCarouselRef.current;
      if (!el) return;

      if (underPausedRef.current) {
        last = now;
        return;
      }

      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      if (maxScrollLeft <= 0) return;

      const dt = now - last;
      last = now;

      el.scrollLeft += (speedPxPerSec * dt) / 1000;
      if (el.scrollLeft >= maxScrollLeft - 1) {
        // 처음으로 되돌려 자연스러운 루프
        el.scrollLeft = 0;
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-grid-pattern">
      {comingSoonMessage ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px] px-4">
          <div className="w-[min(520px,90%)] rounded-2xl border border-accent/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(232, 136, 138,0.18)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                +
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Coming Soon
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {comingSoonMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-wood/15 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0"
          >
            <span className="font-mono text-lg font-bold tracking-tight text-accent text-omakase-neon">
              AI API
            </span>
            <span className="font-mono text-lg font-medium text-wood">
              오마카세
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/plans"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-foreground/85 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
            >
              플랜
            </Link>
            <NavAuthButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-accent text-omakase-neon">
            오늘의 API 코스
          </p>
          <h1 className="mb-4 text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl">
            <span className="text-omakase-gradient">AI API 오마카세</span>
          </h1>
          <p className="mx-auto mb-4 max-w-3xl text-xl font-semibold text-foreground md:text-3xl">
            기업용 AI API를 빠르고 예측 가능하게 도입하세요
          </p>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-foreground/72 md:text-lg">
            여러 벤더를 비교하고 따로 붙일 필요 없이, 검증된 AI API를 한 곳에서
            바로 테스트하고 운영하세요. 월정액 중심의 비용 구조와 자체 GPU
            인프라로 도입 속도와 운영 효율을 함께 잡을 수 있습니다.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-sm text-foreground/52 md:text-base">
            복잡한 비용 계산보다, 시작과 운영이 쉬운 구조를 지향합니다.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/api-test"
              className="group flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-medium text-background glow-accent transition-all hover:opacity-90"
            >
              무료 체험
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-8 py-4 font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-white/5 hover:text-accent"
            >
              플랜 보기
            </Link>
          </div>
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
            {HERO_BADGES.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-full border border-accent/20 bg-accent/6 px-3 py-1.5 text-[11px] font-mono text-accent/95"
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 text-left md:grid-cols-3">
            <div className="rounded-2xl border border-accent/20 bg-accent/6 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                과금 구조
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                월정액 중심 과금
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/62">
                토큰량에 따라 매번 계산하지 않아도 되는 비용 구조로 예산 계획이
                훨씬 명확해집니다.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-surface/45 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                인프라
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                자체 GPU 인프라 운영
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/62">
                인프라 효율을 직접 관리해 가격 경쟁력과 안정적인 운영 기반을
                함께 제공합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-surface/45 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                빠른 시작
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                테스트 후 바로 도입
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/62">
                Playground에서 성능을 먼저 확인한 뒤, 필요한 API만 빠르게
                서비스에 연결할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Proof */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-[11px] tracking-[0.16em] text-accent">
              교점 약 {TARGET_BREAK_EVEN_X.toFixed(1)}M 토큰 이후
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              가격 근거
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              교점 이후 고객이 오마카세의 핵심 타겟입니다
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              GPT-4o API와 자사 LLM Starter 월비용 19만원을 같은 축에서 비교하면,
              어느 구간부터 월정액 모델을 먼저 봐야 하는지 바로 이해할 수 있습니다.
            </p>
          </div>
          <div className="mt-12 space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-accent/18 bg-[radial-gradient(circle_at_top,rgba(232,136,138,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 shadow-[0_0_90px_rgba(232,136,138,0.08)] md:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                타겟 사용자 그래프
              </p>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground">
                    많이 쓸수록 19만원 월정액이 더 유리합니다
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/65">
                    x축은 월간 사용량(백만 토큰), y축은 비용입니다. 교점 이후부터는
                    GPT-4o보다 AI API 오마카세의 비용 우위가 더 분명해집니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-accent/24 bg-background/20 px-4 py-3 text-right shadow-[0_0_35px_rgba(232,136,138,0.10)]">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                    자사 LLM Starter
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    190,000원
                  </p>
                </div>
              </div>
              <div className="mt-8 overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 md:p-8">
                <svg
                  viewBox="0 0 960 520"
                  className="h-auto w-full"
                  role="img"
                  aria-label="월간 사용량 대비 비용 비교 그래프"
                >
                  <defs>
                    <linearGradient id="targetZone" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="rgba(232,136,138,0)" />
                      <stop offset="100%" stopColor="rgba(232,136,138,0.22)" />
                    </linearGradient>
                    <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(232,136,138,0.95)" />
                      <stop offset="55%" stopColor="rgba(232,136,138,0.35)" />
                      <stop offset="100%" stopColor="rgba(232,136,138,0)" />
                    </radialGradient>
                    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {TARGET_GRAPH_TICKS_Y.map((tick) => (
                    <g key={`y-${tick}`}>
                      <line
                        x1="90"
                        y1={graphY(tick)}
                        x2="870"
                        y2={graphY(tick)}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray={tick === 0 ? "0" : "4 6"}
                      />
                      <text
                        x="78"
                        y={graphY(tick) + 4}
                        textAnchor="end"
                        fill="rgba(255,255,255,0.48)"
                        fontSize="12"
                        fontFamily="monospace"
                      >
                        {formatGraphWonTick(tick)}
                      </text>
                    </g>
                  ))}
                  {TARGET_GRAPH_TICKS_X.map((tick) => (
                    <g key={`x-${tick}`}>
                      <line
                        x1={graphX(tick)}
                        y1="72"
                        x2={graphX(tick)}
                        y2="392"
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray={tick === 0 ? "0" : "4 6"}
                      />
                      <text
                        x={graphX(tick)}
                        y="424"
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.48)"
                        fontSize="13"
                        fontFamily="monospace"
                      >
                        {tick === 0 ? "" : tick}
                      </text>
                    </g>
                  ))}
                  <line x1="90" y1="392" x2="870" y2="392" stroke="rgba(255,255,255,0.24)" />
                  <line x1="90" y1="72" x2="90" y2="392" stroke="rgba(255,255,255,0.24)" />
                  <rect
                    x={graphX(TARGET_BREAK_EVEN_X)}
                    y="72"
                    width={870 - graphX(TARGET_BREAK_EVEN_X)}
                    height="320"
                    fill="url(#targetZone)"
                  />
                  <line
                    x1="90"
                    y1={graphY(OMAKASE_LLM_STARTER_PRICE)}
                    x2="870"
                    y2={graphY(OMAKASE_LLM_STARTER_PRICE)}
                    stroke="rgba(232,136,138,0.95)"
                    strokeWidth="3.5"
                  />
                  <line
                    x1="90"
                    y1={graphY(0)}
                    x2="870"
                    y2={graphY(GPT4O_KRW_PER_M_TOKEN * TARGET_GRAPH_MAX_X)}
                    stroke="rgba(255,255,255,0.88)"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx={graphX(TARGET_BREAK_EVEN_X)}
                    cy={graphY(TARGET_BREAK_EVEN_Y)}
                    r="18"
                    fill="rgba(255,164,173,0.16)"
                    className="target-point-neon-halo"
                  />
                  <circle
                    cx={graphX(TARGET_BREAK_EVEN_X)}
                    cy={graphY(TARGET_BREAK_EVEN_Y)}
                    r="8"
                    fill="rgba(232,136,138,1)"
                    className="target-point-core"
                  />
                  <line
                    x1={graphX(TARGET_BREAK_EVEN_X)}
                    y1="72"
                    x2={graphX(TARGET_BREAK_EVEN_X)}
                    y2="392"
                    stroke="rgba(232,136,138,0.45)"
                    strokeDasharray="6 6"
                  />
                  <text
                    x={graphX(TARGET_BREAK_EVEN_X)}
                    y="444"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.52)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    손익분기점 약 {Math.round(TARGET_BREAK_EVEN_X * 100).toLocaleString("ko-KR")}만 토큰
                  </text>
                  <text
                    x="90"
                    y="44"
                    fill="rgba(255,255,255,0.56)"
                    fontSize="13"
                    fontFamily="monospace"
                  >
                    비용
                  </text>
                  <text
                    x="870"
                    y="468"
                    textAnchor="end"
                    fill="rgba(255,255,255,0.56)"
                    fontSize="13"
                    fontFamily="monospace"
                  >
                    월간 사용량 (백만 토큰)
                  </text>
                  <text
                    x={graphX(0) - 18}
                    y={graphY(0) + 18}
                    fill="rgba(255,255,255,0.58)"
                    fontSize="13"
                    fontFamily="monospace"
                  >
                    0
                  </text>
                </svg>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-accent/24 bg-accent/8 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                    손익분기점
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    약 {TARGET_BREAK_EVEN_X.toFixed(1)}M 토큰
                  </p>
                  <p className="mt-1 text-sm text-foreground/65">
                    이 지점을 넘으면 AI API 오마카세를 우선 봐야 합니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-background/18 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                    그래프 해석
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    GPT-4o는 사용량 비례 증가, 오마카세는 월 19만원 고정
                  </p>
                  <p className="mt-1 text-sm text-foreground/55">
                    입력/출력 50:50, GPT-4o 환산 기준으로 교점 이후 구간을 강조했습니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.15fr_1.15fr_1.15fr_0.95fr]">
              {TARGET_CUSTOMERS.map((customer, idx) => (
                <div
                  key={customer.title}
                  className={[
                    "rounded-3xl border p-5",
                    idx === 2
                      ? "border-accent/24 bg-accent/7 shadow-[0_0_40px_rgba(232,136,138,0.08)]"
                      : "border-white/8 bg-surface/45",
                  ].join(" ")}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/85">
                    예상 타겟 고객
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {customer.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/62">
                    {customer.description}
                  </p>
                </div>
              ))}
              <div className="rounded-3xl border border-accent/22 bg-[linear-gradient(180deg,rgba(232,136,138,0.10),rgba(232,136,138,0.05))] p-5 shadow-[0_0_50px_rgba(232,136,138,0.10)]">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                결론
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                교점 이후 구간에서 많이 쓰고, 반복 실험하고, 동시에 많은
                End-user 요청을 처리해야 한다면 AI API 오마카세는 우선 검토
                대상입니다.
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-background/20 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  교점 이전 고객
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/60">
                  다른 선택지도 충분히 가능합니다.
                </p>
              </div>
              <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  교점 이후 고객
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/82">
                  오마카세를 먼저 봐야 하는 구간입니다.
                </p>
              </div>
            </div>
            </div>
          </div>
          <style>{`
            @keyframes targetPointNeonHaloBlink {
              0%, 18%, 22%, 54%, 58%, 100% { opacity: 0.95; }
              20%, 56% { opacity: 0.18; }
              24% { opacity: 0.48; }
            }
            @keyframes targetPointNeonCoreBlink {
              0%, 18%, 22%, 54%, 58%, 100% {
                opacity: 1;
                filter:
                  drop-shadow(0 0 4px rgba(255, 214, 214, 0.95))
                  drop-shadow(0 0 10px rgba(232, 136, 138, 0.95))
                  drop-shadow(0 0 18px rgba(232, 136, 138, 0.72));
              }
              20%, 56% {
                opacity: 0.34;
                filter:
                  drop-shadow(0 0 2px rgba(255, 214, 214, 0.45))
                  drop-shadow(0 0 4px rgba(232, 136, 138, 0.28));
              }
              24% {
                opacity: 0.68;
                filter:
                  drop-shadow(0 0 3px rgba(255, 214, 214, 0.7))
                  drop-shadow(0 0 7px rgba(232, 136, 138, 0.55))
                  drop-shadow(0 0 12px rgba(232, 136, 138, 0.34));
              }
            }
            .target-point-neon-halo {
              animation: targetPointNeonHaloBlink 2.2s steps(1, end) infinite;
            }
            .target-point-core {
              animation: targetPointNeonCoreBlink 2.2s steps(1, end) infinite;
            }
          `}</style>
        </div>
      </section>

      {/* Why Omakase */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            왜 AI API 오마카세여야 할까요?
          </h2>
          <p className="mx-auto mb-14 max-w-3xl text-center text-foreground/70">
            API를 많이 제공하는 것만으로는 충분하지 않습니다. 실제 도입
            단계에서는 비용 예측, 운영 효율, 검증 속도가 더 중요합니다.
          </p>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6 md:grid-cols-3">
              {DIFFERENTIATORS.map((item, idx) => (
                <div
                  key={item.title}
                  className={[
                    "rounded-2xl border p-7",
                    idx === 0
                      ? "border-accent/30 bg-accent/7 shadow-[0_0_48px_rgba(232,136,138,0.08)]"
                      : "border-white/5 bg-surface/50",
                  ].join(" ")}
                >
                  <div className="mb-4 h-1 w-12 rounded-full bg-accent" />
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/62">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/8 bg-surface/45 p-8">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                추천 대상
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                이런 팀에게 더 잘 맞습니다
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                단순한 API 카탈로그가 아니라, 빠른 검증과 운영 가능한 비용
                구조가 필요한 팀이라면 더 큰 가치를 체감할 수 있습니다.
              </p>
              <div className="mt-6 space-y-3">
                {FITS_FOR.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/6 bg-background/25 px-4 py-3"
                  >
                    <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                    <p className="text-sm text-foreground/82">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              비교 포인트
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              그래서 무엇이 더 나은 선택일까요?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              많은 API 제공 업체 중에서 중요한 건 개수가 아니라, 실제 도입과
              운영이 얼마나 단순해지는가입니다. 아래 비교처럼 AI API 오마카세는
              비용과 운영의 복잡도를 줄이는 방향에 더 가깝습니다.
            </p>
          </div>

          <div className="mt-12 hidden overflow-hidden rounded-3xl border border-white/8 bg-surface/45 md:block">
            <div className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-white/6 bg-background/25">
              <div className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                비교 항목
              </div>
              <div className="px-5 py-4 text-sm font-semibold text-foreground/70">
                일반적인 도입 방식
              </div>
              <div className="px-5 py-4 text-sm font-semibold text-accent">
                AI API 오마카세
              </div>
            </div>
            {COMPARISON_ROWS.map((row, idx) => (
              <div
                key={row.label}
                className={[
                  "grid grid-cols-[0.8fr_1fr_1fr]",
                  idx !== COMPARISON_ROWS.length - 1
                    ? "border-b border-white/6"
                    : "",
                ].join(" ")}
              >
                <div className="px-5 py-5 text-sm font-semibold text-foreground">
                  {row.label}
                </div>
                <div className="px-5 py-5 text-sm leading-relaxed text-foreground/55">
                  {row.before}
                </div>
                <div className="bg-accent/5 px-5 py-5 text-sm leading-relaxed text-foreground/88">
                  {row.after}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:hidden">
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.label}
                className="overflow-hidden rounded-3xl border border-white/8 bg-surface/45"
              >
                <div className="border-b border-white/6 bg-background/25 px-5 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                    {row.label}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                    일반적인 도입 방식
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/58">
                    {row.before}
                  </p>
                </div>
                <div className="border-t border-white/6 bg-accent/5 px-5 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                    AI API 오마카세
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/88">
                    {row.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              활용 시나리오
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              이렇게 연결하면 바로 서비스가 됩니다
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              좋은 API는 많지만, 실제 서비스에선 조합이 더 중요합니다. AI API
              오마카세는 필요한 기능을 묶어서 빠르게 검증하고 운영할 수 있게
              해줍니다.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {USE_CASES.map((useCase, idx) => (
              <div
                key={useCase.title}
                className={[
                  "rounded-3xl border p-7",
                  idx === 0
                    ? "border-accent/28 bg-accent/7 shadow-[0_0_48px_rgba(232,136,138,0.08)]"
                    : "border-white/6 bg-surface/45",
                ].join(" ")}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                  {useCase.flow}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {useCase.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {useCase.summary}
                </p>
                <div className="mt-6 rounded-2xl border border-white/6 bg-background/25 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                    기대 효과
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/82">
                    {useCase.outcome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Flow */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              시작 방법
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              도입은 복잡하지 않아야 합니다
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              좋은 랜딩은 기능을 많이 설명하는 것이 아니라, 시작하는 방법을 쉽게
              보이게 해야 합니다. AI API 오마카세는 아래 3단계 흐름으로 이해할
              수 있습니다.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ONBOARDING_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className={[
                  "rounded-3xl border p-7",
                  idx === 1
                    ? "border-accent/28 bg-accent/7 shadow-[0_0_48px_rgba(232,136,138,0.08)]"
                    : "border-white/6 bg-surface/45",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs tracking-[0.24em] text-accent">
                    STEP {item.step}
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-mono text-sm text-accent">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APIs Section */}
      <section id="apis" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            다양한 API, 한 곳에서
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-foreground/70">
            필요한 API를 골라 사용하세요. 계속해서 새로운 API가 추가됩니다.
          </p>
          <div
            ref={underCarouselRef}
            className="api-belt-wrap overflow-x-auto"
            onMouseEnter={() => pauseUnderCarousel()}
            onWheel={() => pauseUnderCarousel()}
            onPointerDown={() => pauseUnderCarousel(2000)}
          >
            <div className="api-belt-track flex w-max gap-6 pr-6">
              {API_BELT.map((api, i) =>
                api.comingSoon ? (
                  api.apiId ? (
                    <button
                      key={`${api.name}-${i}`}
                      type="button"
                      onClick={() =>
                        showComingSoon(
                          "추가 API가 곧 공개됩니다. 조금만 기다려 주세요!",
                        )
                      }
                      className="api-belt-card group w-[250px] shrink-0 rounded-2xl border border-white/5 bg-surface/50 p-6 text-left transition-all hover:border-accent/20 hover:bg-surface"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 font-mono text-xl text-accent transition-colors group-hover:bg-accent/20">
                        {api.icon}
                      </div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        {api.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground/60">
                        {api.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/45 opacity-0 transition-all duration-200 group-hover:opacity-100">
                        <span>곧 공개됩니다</span>
                        <span className="text-accent/70">→</span>
                      </div>
                    </button>
                  ) : (
                    <Link
                      key={`${api.name}-${i}`}
                      href="/api-test"
                      className="api-belt-card group block w-[250px] shrink-0 rounded-2xl border border-white/5 bg-surface/50 p-6 text-left transition-all hover:border-accent/20 hover:bg-surface"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 font-mono text-xl text-accent transition-colors group-hover:bg-accent/20">
                        {api.icon}
                      </div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        {api.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground/60">
                        {api.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/45 opacity-0 transition-all duration-200 group-hover:opacity-100">
                        <span>All 보기</span>
                        <span className="text-accent/70">→</span>
                      </div>
                    </Link>
                  )
                ) : (
                  <Link
                    key={`${api.name}-${i}`}
                    href={`/api-test?task=${api.apiId}`}
                    className="api-belt-card group block w-[250px] shrink-0 rounded-2xl border border-white/5 bg-surface/50 p-6 transition-all hover:border-accent/20 hover:bg-surface"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 font-mono text-xl text-accent transition-colors group-hover:bg-accent/20">
                      {api.icon}
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">
                      {api.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/60">
                      {api.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-foreground/45 opacity-0 transition-all duration-200 group-hover:opacity-100">
                      <span>테스트하러 가기</span>
                      <span className="text-accent">→</span>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Price Summary */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              빠른 가격 안내
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              어떤 플랜으로 시작할지 빠르게 판단하세요
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              API별 세부 가격은 다를 수 있어도 선택 구조는 단순합니다. 가볍게
              검증하려면 Starter, 운영 확장이 필요하면 Pro를 보면 됩니다.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {PRICE_SUMMARY.map((plan) => (
              <div
                key={plan.title}
                className={`rounded-3xl border p-8 ${plan.tone}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                      {plan.title}
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold text-foreground">
                      {plan.price}
                    </h3>
                    <p className="mt-2 text-sm text-foreground/65">
                      {plan.subtitle}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-background/20 px-4 py-3 text-left sm:text-right">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                      RPS
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {plan.rps}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <p className="text-sm leading-relaxed text-foreground/82">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-medium text-background transition-opacity hover:opacity-90"
            >
              전체 플랜 보기
            </Link>
            <Link
              href="/api-test"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-white/5 hover:text-accent"
            >
              먼저 테스트하기
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-foreground/52">
            세부 가격은 API별로 다르지만, 선택 구조는 단순합니다.
          </p>
        </div>
      </section>

      {/* Benefits / Pricing Model */}
      <section id="pricing" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            운영 관점에서 더 단순한 구조
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-foreground/70">
            비용 예측, 인프라 운영, API 확장까지 한 번에 이해할 수 있는 구조를
            지향합니다.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit, idx) => (
              <div
                key={benefit.title}
                className={[
                  "rounded-2xl border bg-surface/50 p-8",
                  idx === 0
                    ? "border-accent/35 bg-accent/8 shadow-[0_0_48px_rgba(232,136,138,0.10)]"
                    : "border-white/5",
                ].join(" ")}
              >
                {idx === 0 ? (
                  <span className="mb-3 inline-flex items-center rounded-full border border-accent/35 bg-accent/12 px-3 py-1 font-mono text-[11px] text-accent">
                    핵심 장점
                  </span>
                ) : null}
                <div className="mb-4 h-1 w-12 rounded-full bg-accent" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-foreground/60">{benefit.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center md:p-12">
            <p className="font-mono text-accent">
              복잡한 계산보다 단순한 운영 기준
            </p>
            <p className="mt-2 text-foreground/80">
              여러 AI API를 따로 붙이는 대신, 한 플랫폼에서 테스트하고 운영
              기준을 더 명확하게 관리하세요.
            </p>
            <Link
              href="/plans"
              className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              플랜 보기
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/5 bg-surface/50 p-12 text-center md:p-16">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
            시작하기
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            이제 직접 확인해볼 차례입니다
          </h2>
          <p className="mb-8 text-foreground/70">
            Playground에서 바로 테스트하고, 맞는 플랜으로 가볍게 시작하세요.
          </p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
            {FINAL_CTA_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center rounded-full border border-white/8 bg-background/25 px-3 py-1.5 text-[11px] font-mono text-foreground/72"
              >
                {point}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/api-test"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-medium text-background transition-opacity hover:opacity-90"
            >
              무료 체험 시작
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-white/5"
            >
              플랜 확인하기
            </Link>
          </div>
          <Link
            href="mailto:contact@gpumodu.dev"
            className="mt-5 inline-flex text-sm text-foreground/52 transition-colors hover:text-accent"
          >
            도입 상담이 필요하면 문의하기
          </Link>
        </div>
      </section>

    </div>
  );
}
