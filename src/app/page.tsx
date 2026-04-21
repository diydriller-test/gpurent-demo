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
    description: "대화·요약·질문 답변 같은 텍스트 작업을 쓰는 API",
    icon: "✦",
    apiId: "llm",
  },
  {
    name: "STT",
    description: "말한 걸 글로 바꿔줘요. 음성 → 텍스트",
    icon: "◉",
    apiId: "stt",
  },
  {
    name: "Embedding",
    description: "문장을 숫자 벡터로 바꿔서 검색·RAG에 쓰기 좋은 임베딩",
    icon: "◇",
    apiId: "embedding",
  },
  {
    name: "Re-ranking",
    description: "검색 결과 순서를 다시 매겨서, 진짜로 맞는 것부터 보여줘요",
    icon: "⇅",
    apiId: "reranker",
  },
  {
    name: "TTS",
    description: "글을 읽어주는 음성 합성. 글 → 말",
    icon: "♪",
    apiId: "tts",
  },
  {
    name: "더 많은 API 확인하러 가기",
    description: "목록에서 전부 보고, 필요한 쪽만 골라보면 돼요",
    icon: "+",
    comingSoon: true,
  },
];

const BENEFITS = [
  {
    title: "월정액제",
    description:
      "쓰는 양이 조금 들쭉날쭉해도, 매달 비용은 같은 기준으로 잡을 수 있어요.",
  },
  {
    title: "자체 GPU 인프라",
    description:
      "우리가 GPU를 직접 돌려서, 토큰 과금만 쓸 때보다 부담이 덜해요.",
  },
  {
    title: "확장 가능한 API",
    description: "임베딩·리랭킹·TTS 같은 걸 한곳에서 골라 쓰면 됩니다.",
  },
];

const HERO_BADGES = [
  "월정액으로 비용 잡기",
  "자체 GPU로 돌림",
  "Playground에서 바로 써보기",
  "텍스트·임베딩·TTS 한곳에",
];

const OMAKASE_LLM_STARTER_PRICE = 190000;
const USD_TO_KRW = 1530;
const GPT4O_INPUT_USD_PER_M = 5;
const GPT4O_OUTPUT_USD_PER_M = 15;
const GPT4O_BLEND_USD_PER_M =
  (GPT4O_INPUT_USD_PER_M + GPT4O_OUTPUT_USD_PER_M) / 2;
const GPT4O_KRW_PER_M_TOKEN = GPT4O_BLEND_USD_PER_M * USD_TO_KRW;
const TARGET_BREAK_EVEN_X = OMAKASE_LLM_STARTER_PRICE / GPT4O_KRW_PER_M_TOKEN;
const TARGET_BREAK_EVEN_Y = OMAKASE_LLM_STARTER_PRICE;
const TARGET_GRAPH_MAX_X = 70;
const TARGET_GRAPH_MAX_Y = 1100000;
const TARGET_GRAPH_TICKS_X = [0, 10, 20, 30, 40, 50, 60, 70];
const TARGET_GRAPH_TICKS_Y = [
  0, 100000, 190000, 300000, 500000, 700000, 1000000,
];
const TARGET_GRAPH_LEFT = 90;
const TARGET_GRAPH_RIGHT = 870;
const TARGET_GRAPH_TOP = 72;
const TARGET_GRAPH_BOTTOM = 392;

const TARGET_CUSTOMERS = [
  {
    title: "문서 쪼개기·전처리 많이 하는 개발자",
    description:
      "같은 문서를 계속 돌리면 토큰 과금이 아깝죠. 이런 팀은 월정액이 더 편할 때가 많아요.",
  },
  {
    title: "PoC를 자주 돌리는 팀",
    description:
      "프롬프트랑 파이프라인을 계속 바꿔야 하는데, 매번 청구서가 흔들리면 스트레스예요. 그럴 땐 고정 비용이 낫습니다.",
  },
  {
    title: "동시에 사용자 많이 붙는 서비스",
    description:
      "요청이 한꺼번에 몰릴수록, 그래프에서 교점 넘어가면 ‘이번 달 얼마 나올지’ 설명하기 쉬워져요.",
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
    title: "비용이 덜 흔들려요",
    description:
      "토큰 쓸 때마다 청구가 달라지는 것보다, 월정액으로 ‘대략 이 정도’만 맞추면 됩니다.",
  },
  {
    title: "붙이기 빨라요",
    description:
      "텍스트·임베딩·리랭킹·TTS·STT를 한 화면에서 써보고, 필요한 것만 골라 연결하면 돼요.",
  },
  {
    title: "벤더 여러 개 안 써도 돼요",
    description:
      "GPU를 우리 쪽에서 돌려서 가격을 맞추고, 여러 회사 계정 따로 관리하는 부담도 줄입니다.",
  },
];

const FITS_FOR = [
  "PoC를 빨리 돌려봐야 하는 팀",
  "토큰 말고 월에 고정으로 나가면 좋은 팀",
  "AI 기능 여러 개를 한 번에 붙여야 하는 팀",
];

const COMPARISON_ROWS = [
  {
    label: "비용 구조",
    before: "토큰·사용량 따라 월마다 청구가 들쭉날쭉",
    after: "월정액 중심이라, 대략 예산은 미리 잡기 쉬움",
  },
  {
    label: "도입 방식",
    before: "기능마다 벤더 다르게 비교하고 따로 붙이기",
    after: "한곳에서 써보고, 필요한 API만 골라 연결",
  },
  {
    label: "확장 경로",
    before: "플랜마다 기준이 달라서, 나중에 늘리기 애매함",
    after: "Starter → Pro로, RPS만 보면 됨",
  },
  {
    label: "운영 관리",
    before: "API마다 공급·과금 구조가 달라서 관리가 번거로움",
    after: "GPU·가격을 한 번에 이해할 수 있는 구조",
  },
];

const USE_CASES = [
  {
    title: "고객 응대 자동화",
    summary:
      "말(STT) → 글 정리(LLM) → 요약까지 이어 붙이면, 상담 내용을 빨리 정리하고 답도 맞춰 쓰기 쉬워요.",
    flow: "STT -> Text -> Summary",
    outcome: "상담 기록 덜 손으로 쓰고, 응답도 빨라서 CS가 덜 바쁨",
  },
  {
    title: "검색이 더 맞게 나오게",
    summary:
      "임베딩으로 비슷한 문서 찾고, 리랭커로 순서 다시 매기면 RAG 검색이 훨씬 낫게 느껴져요.",
    flow: "Embedding -> Reranker",
    outcome: "RAG 품질 올리고, 필요한 쪽만 빨리 찾음",
  },
  {
    title: "콘텐츠·리뷰 운영",
    summary:
      "카피 쓰고, 감정 보고, 이름·날짜 같은 것만 뽑는 것까지 한 흐름으로 묶을 수 있어요.",
    flow: "Copywrite -> Sentiment -> NER",
    outcome: "글 쓰는 시간 줄고, 리뷰는 자동으로 돌려보기",
  },
];

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Playground에서 먼저 써보기",
    description:
      "텍스트·임베딩·TTS·STT를 직접 써보고, 우리 서비스에 맞는 조합을 정하면 돼요.",
  },
  {
    step: "02",
    title: "Starter로 작게 시작",
    description:
      "진입비 부담 적은 월정액으로 시작해서, 실제로 쓰는 흐름만 먼저 확인해요.",
  },
  {
    step: "03",
    title: "사람 늘면 Pro로",
    description:
      "트래픽이 붙으면 RPS 높은 Pro로 올리면, 비용이랑 성능을 같이 맞추기 쉬워요.",
  },
];

const PRICE_SUMMARY = [
  {
    title: "Starter",
    subtitle: "일단 써보기·PoC",
    price: "10,000원부터",
    rps: "1 ~ 3.5 RPS",
    tone: "border-white/8 bg-background/25",
    points: ["STT·TTS 같은 것도 부담 없이 시작", "사내에서 연동만 먼저 볼 때"],
  },
  {
    title: "Pro",
    subtitle: "운영·실서비스",
    price: "30,000원부터",
    rps: "최대 3배 확장",
    tone: "border-accent/28 bg-accent/7 shadow-[0_0_48px_rgba(232,136,138,0.08)]",
    points: [
      "Starter보다 RPS 여유롭게",
      "사용자 늘어도 비용 구조는 그대로 단순하게",
    ],
  },
];

const FINAL_CTA_POINTS = [
  "Playground에서 바로 써보기",
  "Starter로 가볍게 시작",
  "불리면 Pro로 올리기",
];

const LANDING_SECTION_LINKS: Array<{ href: string; label: string }> = [
  { href: "#why-omakase", label: "왜 쓰나요" },
  { href: "#pricing-proof", label: "가격 근거" },
  { href: "#compare", label: "비교" },
  { href: "#use-cases", label: "시나리오" },
  { href: "#apis", label: "API" },
  { href: "#plan-summary", label: "플랜" },
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
            어떤 서비스든 AI API, 부담은 줄이고 빠르게 붙이고 싶을 때
          </p>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-foreground/72 md:text-lg">
            벤더 여러 군데 비교하느라 시간 쓰지 말고, 여기서 바로 써보고 붙이면
            돼요. 월정액으로 비용 감 잡기 쉽고, GPU는 우리가 직접 돌려 가격
            부담을 확실히 낮췄어요.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/api-test"
              className="group inline-flex h-14 w-[180px] items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 font-medium text-background glow-accent transition-all hover:opacity-90"
            >
              무료 체험
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/plans"
              className="inline-flex h-14 w-[180px] items-center justify-center gap-2 rounded-xl border border-white/12 px-8 py-4 font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-white/5 hover:text-accent"
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
                월정액으로 감 잡기
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/62">
                매번 토큰 곱해서 계산하지 않아도, 이번 달은 대략 이 정도예요.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-surface/45 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                인프라
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                GPU는 우리가 돌림
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/62">
                서버 비용·가격을 우리가 맞추니까, 견적만 보고 붙이기 편해요.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-surface/45 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                빠른 시작
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                써보고 나서 붙이기
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/62">
                Playground에서 먼저 써보고, 괜찮으면 그 API만 서비스에 연결하면
                됩니다.
              </p>
            </div>
          </div>

          <nav
            id="landing-at-a-glance"
            className="mx-auto mt-12 max-w-4xl rounded-2xl border border-white/10 bg-background/25 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            aria-label="섹션 바로가기"
          >
            <p className="text-center text-[11px] text-foreground/45">
              아래로 쭉 내리기 싫으면, 여기서 점프해요
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {LANDING_SECTION_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 bg-background/30 px-3 py-1.5 text-[12px] text-foreground/78 transition-colors hover:border-accent/35 hover:text-accent"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </section>

      {/* Pricing Proof */}
      <section
        id="pricing-proof"
        className="border-t border-white/5 px-6 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <details
            open
            className="group rounded-[28px] border border-white/8 bg-surface/30 p-5 md:p-8"
          >
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                  <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-[11px] tracking-[0.16em] text-accent">
                    교점 약 {TARGET_BREAK_EVEN_X.toFixed(1)}M 토큰 이후
                  </div>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-accent">
                    가격 근거
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
                    여기 넘어가면 월정액이 더 맞는 구간이에요
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
                    GPT-4o처럼 토큰 과금이랑, 우리 Starter 월 19만 원을 같은
                    그래프에 올려놓으면, 어디부터 월정액이 나은지 한눈에 보여요.
                  </p>
                </div>
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-white/10 bg-background/30 text-foreground/60 transition-transform group-open:rotate-180 sm:self-center"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </div>
            </summary>
            <div className="mt-10 space-y-6">
              <div className="overflow-hidden rounded-[32px] border border-accent/18 bg-[radial-gradient(circle_at_top,rgba(232,136,138,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 shadow-[0_0_90px_rgba(232,136,138,0.08)] md:p-10">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                  타겟 사용자 그래프
                </p>
                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">
                      많이 쓰면 19만 원짜리가 이기는 구간이 나와요
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/65">
                      가로는 월에 쓴 토큰(백만 단위), 세로는 돈이에요. 선이
                      교차한 뒤로는 GPT-4o보다 우리 쪽이 싸게 나오는 구간이
                      생깁니다.
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
                      <linearGradient
                        id="targetZone"
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="rgba(232,136,138,0)" />
                        <stop
                          offset="100%"
                          stopColor="rgba(232,136,138,0.22)"
                        />
                      </linearGradient>
                      <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(232,136,138,0.95)" />
                        <stop offset="55%" stopColor="rgba(232,136,138,0.35)" />
                        <stop offset="100%" stopColor="rgba(232,136,138,0)" />
                      </radialGradient>
                      <filter
                        id="softGlow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
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
                    <line
                      x1="90"
                      y1="392"
                      x2="870"
                      y2="392"
                      stroke="rgba(255,255,255,0.24)"
                    />
                    <line
                      x1="90"
                      y1="72"
                      x2="90"
                      y2="392"
                      stroke="rgba(255,255,255,0.24)"
                    />
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
                      손익분기점 약{" "}
                      {Math.round(TARGET_BREAK_EVEN_X * 100).toLocaleString(
                        "ko-KR",
                      )}
                      만 토큰
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
                      여기 넘기면 우리 쪽을 먼저 비교해볼 만해요.
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
                      입력·출력 반반 가정하고 GPT-4o 요금을 환산한 거예요. 교점
                      넘은 뒤를 색으로 칠해뒀어요.
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
                    쓰는 양 많고, 실험도 자주 하고, 사용자 요청도 동시에
                    몰리면—그럴 땐 우리 쪽을 한 번 넣어볼 만해요.
                  </p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-background/20 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      교점 이전 고객
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/60">
                      적게 쓰면 다른 게 더 싸게 나올 수도 있어요.
                    </p>
                  </div>
                  <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      교점 이후 고객
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/82">
                      이럴 때 우리 견적부터 보면 편해요.
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
          </details>
        </div>
      </section>

      {/* Why Omakase */}
      <section id="why-omakase" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            왜 AI API 오마카세인가요?
          </h2>
          <p className="mx-auto mb-14 max-w-3xl text-center text-foreground/70">
            API 개수만 많다고 끝이 아니에요. 막상 붙일 때는 비용이 얼마 나올지,
            운영이 귀찮지 않은지, 그리고 써보기까지 얼마나 빠른지가 더 중요하죠.
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
                이런 팀이 편해요
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                목록만 길게 뽑아준 게 아니라, 빨리 써보고 월에 고정으로 나갈
                금액만 맞추면 되는 팀이면 체감이 큽니다.
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
      <section
        id="compare"
        className="border-t border-white/5 px-6 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <details className="group rounded-[28px] border border-white/8 bg-surface/30 p-5 md:p-8">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
                    비교 포인트
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
                    그래서 뭐가 달라져요?
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
                    API 몇 개 있냐보다, 붙이고 돌리는 게 얼마나 귀찮지 않냐가
                    중요하죠. 아래는 비용이랑 운영이 덜 복잡해지는 쪽으로만
                    짚어본 거예요.
                  </p>
                </div>
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-white/10 bg-background/30 text-foreground/60 transition-transform group-open:rotate-180 sm:self-center"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </div>
            </summary>

            <div className="mt-10 hidden overflow-hidden rounded-3xl border border-white/8 bg-surface/45 md:block">
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
            <div className="mt-10 grid gap-4 md:hidden">
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
          </details>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              활용 시나리오
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              이렇게만 이어 붙여도 돼요
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              API 하나만 잘 쓰는 것보다, 실제로는 이거랑 저거 묶어서 쓰는 경우가
              많아요. 여기서는 그 조합을 빨리 써보고 운영까지 가져가기 쉽게
              해뒀어요.
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
              시작하는 건 단순하게
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              기능 설명만 길게 읽게 하기보다, 어떻게 시작하면 되는지가 먼저
              보여야 하죠. 흐름은 대충 이 세 단계로 보면 됩니다.
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
            쓸 만한 API, 한곳에
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-foreground/70">
            필요한 것만 골라 쓰면 되고, 앞으로도 하나씩 더 붙일 예정이에요.
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
      <section id="plan-summary" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              빠른 가격 안내
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              플랜은 뭐 먼저 보면 돼요?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              API마다 금액은 다를 수 있는데, 고르는 구조는 단순해요. 일단
              써보려면 Starter, 사람 붙으면 Pro 쪽을 보면 됩니다.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-white/8 bg-background/24 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/90">
                  RPS란?
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  초당 몇 개 요청을 감당하느냐 보는 숫자예요.
                </p>
              </div>
              <div className="rounded-2xl border border-accent/18 bg-accent/8 px-4 py-3 text-sm leading-relaxed text-foreground/78 md:max-w-sm">
                RPS 높을수록, 동시에 몰려도 덜 버벅이는 쪽이에요.
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/60">
              사내에서만 돌릴 땐 낮아도 되는데, 실제 사용자 붙으면 RPS 올린
              플랜이 필요해질 때가 많아요.
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
            금액은 API마다 다를 수 있는데, 고르는 방식은 그대로 단순해요.
          </p>
        </div>
      </section>

      {/* Benefits / Pricing Model */}
      <section id="pricing" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            운영할 때 덜 머리 아픈 쪽으로
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-foreground/70">
            비용·서버·API 늘리는 것까지 한 번에 이해하기 쉽게 만들어뒀어요.
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
            <p className="font-mono text-accent">계산기보다 운영 기준이 먼저</p>
            <p className="mt-2 text-foreground/80">
              API마다 따로 붙이지 말고, 한곳에서 써보고 기준만 맞춰 가면 됩니다.
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
            한번 써보면 감 옵니다
          </h2>
          <p className="mb-8 text-foreground/70">
            Playground에서 먼저 써보고, 맞으면 그때 플랜 고르면 돼요.
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
            href="mailto:help@kogrobo.com"
            className="mt-5 inline-flex text-sm text-foreground/52 transition-colors hover:text-accent"
          >
            도입이 애매하면 메일로 물어보기
          </Link>
        </div>
      </section>
    </div>
  );
}
