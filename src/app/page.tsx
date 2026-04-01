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

const PROOF_METRICS = [
  { label: "지원 API", value: "9종", note: "텍스트·임베딩·TTS·STT 등" },
  { label: "Starter 시작", value: "6,000원", note: "API별 월정액 기준" },
  { label: "Pro 확장", value: "최대 3배", note: "Starter 대비 RPS 확장" },
];

const PLAN_PREVIEW = [
  {
    name: "Starter",
    price: "6,000원부터",
    description: "작게 시작하고 빠르게 검증하기 좋은 월정액 플랜",
    points: ["API별 1~3.5 RPS 수준", "PoC/초기 연동에 적합", "비용 예측이 쉬운 구조"],
  },
  {
    name: "Pro",
    price: "18,000원부터",
    description: "운영 환경에서 트래픽을 안정적으로 확장하기 위한 플랜",
    points: ["Starter 대비 최대 3배 RPS", "확장 시에도 단순한 비용 구조", "서비스 운영 단계에 적합"],
  },
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
    summary: "STT + LLM + 요약 API를 조합해 상담 내용을 빠르게 정리하고 응답 품질을 높입니다.",
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
    price: "6,000원부터",
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
    price: "18,000원부터",
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
          <div className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
            {PROOF_METRICS.map((metric, idx) => (
              <div
                key={metric.label}
                className={[
                  "rounded-2xl border px-5 py-4 text-left",
                  idx === 1
                    ? "border-accent/28 bg-accent/6"
                    : "border-white/8 bg-background/18",
                ].join(" ")}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-foreground/58">{metric.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Proof */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              가격 근거
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              말로만 저렴한 게 아니라, 플랜 구조가 명확합니다
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              API별로 Starter와 Pro가 명확하게 나뉘고, RPS 확장 폭도 직관적입니다.
              도입 단계와 운영 단계의 비용 계획을 미리 세우기 쉬운 구조입니다.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-accent/18 bg-accent/5 p-8">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                플랜 비교
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {PLAN_PREVIEW.map((plan, idx) => (
                  <div
                    key={plan.name}
                    className={[
                      "rounded-2xl border p-6",
                      idx === 0
                        ? "border-white/8 bg-background/25"
                        : "border-accent/28 bg-accent/8",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                          {plan.name}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {plan.price}
                        </p>
                      </div>
                      {idx === 1 ? (
                        <span className="rounded-full border border-accent/35 bg-accent/12 px-3 py-1 font-mono text-[11px] text-accent">
                          운영 확장
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-background/25 px-3 py-1 font-mono text-[11px] text-foreground/65">
                          빠른 시작
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-foreground/62">
                      {plan.description}
                    </p>
                    <div className="mt-5 space-y-2.5">
                      {plan.points.map((point) => (
                        <div key={point} className="flex items-start gap-2.5">
                          <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-accent" />
                          <p className="text-sm text-foreground/82">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-surface/45 p-8">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                왜 중요한가
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                잠재 고객이 바로 이해하는 포인트
              </h3>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/6 bg-background/25 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    1. 작은 비용으로 시작할 수 있습니다
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/62">
                    STT, TTS처럼 낮은 진입 비용으로 먼저 검증하고, 성과가 확인되면
                    더 큰 플랜으로 자연스럽게 확장할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-background/25 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    2. 성능과 비용의 균형을 설명하기 쉽습니다
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/62">
                    API별 RPS 기준이 보이기 때문에 내부 의사결정자에게도 도입
                    근거를 명확하게 제시할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-background/25 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    3. 성장 경로가 단순합니다
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/62">
                    Starter에서 Pro로의 확장 폭이 단순해, 트래픽 증가 시에도 플랜
                    변경을 쉽게 이해할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                단순한 API 카탈로그가 아니라, 빠른 검증과 운영 가능한 비용 구조가
                필요한 팀이라면 더 큰 가치를 체감할 수 있습니다.
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
                  idx !== COMPARISON_ROWS.length - 1 ? "border-b border-white/6" : "",
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
              보이게 해야 합니다. AI API 오마카세는 아래 3단계 흐름으로 이해할 수
              있습니다.
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
                    <p className="mt-2 text-sm text-foreground/65">{plan.subtitle}</p>
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
            <p className="font-mono text-accent">복잡한 계산보다 단순한 운영 기준</p>
            <p className="mt-2 text-foreground/80">
              여러 AI API를 따로 붙이는 대신, 한 플랫폼에서 테스트하고 운영 기준을
              더 명확하게 관리하세요.
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

      {/* Footer */}
      <footer className="border-t border-wood/15 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent">AI API</span>
            <span className="font-mono text-wood">오마카세</span>
          </div>
          <p className="text-sm text-foreground/50">
            © {new Date().getFullYear()} AI API 오마카세. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
