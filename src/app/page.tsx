"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { getApis } from "@/lib/api";

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
    name: "Reranker",
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
    description: "임베딩·리랭킹·TTS 같은 걸 한곳에서 골라 쓰면 돼요.",
  },
];

const HANZI = ["一","二","三","四","五","六","七","八","九","十"];

const HIDDEN_TASKS = new Set(["Ad Copy","Text Summary","Sentiment Analysis","NER","Text-to-SQL"]);

const TASK_DISPLAY: Record<string, { icon: string; name: string; sub: string; task: string }> = {
  "Text Generation": { icon: "✦", name: "Text",        sub: "대화 · 요약 · 질문 답변",   task: "text" },
  "Embedding":       { icon: "◇", name: "Embedding",   sub: "문장 벡터화 · RAG 검색",    task: "embedding" },
  "Reranker":        { icon: "⇅", name: "Reranker",    sub: "검색 결과 순위 재정렬",      task: "reranker" },
  "TTS":             { icon: "♪", name: "TTS",         sub: "텍스트 → 음성 합성",        task: "tts" },
  "STT":             { icon: "◉", name: "STT",         sub: "음성 → 텍스트 변환",        task: "stt" },
  "Voice Clone":     { icon: "⊕", name: "Voice Clone", sub: "음성 복제 · 커스텀 보이스", task: "voice-clone" },
  "Vision":          { icon: "⊞", name: "Image2Text",  sub: "이미지 → 텍스트 변환",      task: "image2text" },
};

const DEFAULT_COURSE_MENU = [
  { num: "一", icon: "✦", name: "Text",        sub: "대화 · 요약 · 질문 답변",   task: "text",        span: false },
  { num: "二", icon: "◇", name: "Embedding",   sub: "문장 벡터화 · RAG 검색",    task: "embedding",   span: false },
  { num: "三", icon: "⇅", name: "Reranker",    sub: "검색 결과 순위 재정렬",      task: "reranker",    span: false },
  { num: "四", icon: "♪", name: "TTS",         sub: "텍스트 → 음성 합성",        task: "tts",         span: false },
  { num: "五", icon: "◉", name: "STT",         sub: "음성 → 텍스트 변환",        task: "stt",         span: false },
  { num: "六", icon: "⊕", name: "Voice Clone", sub: "음성 복제 · 커스텀 보이스", task: "voice-clone", span: false },
  { num: "七", icon: "⊞", name: "Image2Text",  sub: "이미지 → 텍스트 변환",      task: "image2text",  span: true },
];

const FEATURES_04 = [
  {
    num: "01",
    title: "API 조합 예시",
    description: "API 하나보다 두세 개를 이어 붙였을 때 더 실용적인 결과를 만들 수 있어요.",
    icon: (
      <>
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="1.2" />
        <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2.5" />
        <line x1="10" y1="20" x2="30" y2="20" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2.5" />
      </>
    ),
  },
  {
    num: "02",
    title: "빠른 연결",
    description: "직접 써본 후, API 키 하나로 바로 연결할 수 있어요.",
    icon: (
      <>
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.2" />
        <polyline points="22,12 17,21 22,21 18,29" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    num: "03",
    title: "비용 관리",
    description: "월정액 기반. 토큰 계산 없이 매달 고정 비용으로 운영해요.",
    icon: (
      <>
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.2" />
        <rect x="12" y="23" width="4" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="18" y="19" width="4" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="24" y="15" width="4" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      </>
    ),
  },
  {
    num: "04",
    title: "확장 가능한 운영",
    description: "사용자 늘어도 플랜만 올리면 끝. 구조 바꿀 필요 없어요.",
    icon: (
      <>
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.2" />
        <path d="M24 13h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 13l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 27h-4v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 27l6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
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
      "프롬프트랑 파이프라인을 계속 바꿔야 하는데, 매번 청구서가 흔들리면 스트레스예요. 그럴 땐 고정 비용이 나아요.",
  },
  {
    title: "동시에 사용자 많이 붙는 서비스",
    description:
      "요청이 한꺼번에 몰릴수록, 그래프에서 교점 넘어가면 '이번 달 얼마 나올지' 설명하기 쉬워져요.",
  },
];

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
      "토큰 쓸 때마다 청구가 달라지는 것보다, 월정액으로 '대략 이 정도'만 맞추면 돼요.",
  },
  {
    title: "붙이기 빨라요",
    description:
      "텍스트·임베딩·리랭킹·TTS·STT를 한 화면에서 써보고, 필요한 것만 골라 연결하면 돼요.",
  },
  {
    title: "벤더 여러 개 안 써도 돼요",
    description:
      "GPU를 우리 쪽에서 돌려서 가격을 맞추고, 여러 회사 계정 따로 관리하는 부담도 줄어요.",
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
    after: "Starter → Pro로, 플랜만 보면 됨",
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
      "말(STT) → 글 정리(LLM)로 이어 붙이면, 상담 내용을 빨리 정리하고 답도 맞춰 쓰기 쉬워요.",
    flow: "STT -> Text",
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
    title: "문서·이미지 자동 처리",
    summary:
      "스캔 문서나 이미지에서 글을 뽑아(Vision OCR), LLM으로 분류·정리하면 사람이 직접 읽던 걸 자동화할 수 있어요.",
    flow: "Vision -> Text",
    outcome: "수동으로 처리하던 문서를 자동으로 분류하고 정리",
  },
];

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "직접 써보고 조합 정하기",
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
      "트래픽이 붙으면 Pro로 올리면, 비용이랑 성능을 같이 맞추기 쉬워요.",
  },
];

const PRICE_SUMMARY = [
  {
    title: "Starter",
    subtitle: "일단 써보기·PoC",
    price: "10,000원부터",
    rps: "초당 1 ~ 3.5건",
    tone: "border-wood/16 bg-background",
    points: ["STT·TTS 같은 것도 부담 없이 시작", "사내에서 연동만 먼저 볼 때"],
  },
  {
    title: "Pro",
    subtitle: "운영·실서비스",
    price: "30,000원부터",
    rps: "최대 3배 확장",
    tone: "border-accent/25 bg-accent/6 shadow-[0_8px_48px_rgba(122,27,22,0.09)]",
    points: [
      "Starter보다 RPS 여유롭게",
      "사용자 늘어도 비용 구조는 그대로 단순하게",
    ],
  },
];

const FINAL_CTA_POINTS = [
  "가입 없이 바로 체험",
  "Starter로 가볍게 시작",
  "불리면 Pro로 올리기",
];

const LANDING_SECTION_LINKS: Array<{ href: string; label: string }> = [
  { href: "#pricing-proof", label: "가격 근거" },
  { href: "#why-omakase", label: "왜 쓰나요" },
  { href: "#compare", label: "비교" },
  { href: "#use-cases", label: "시나리오" },
  { href: "#apis", label: "API" },
  { href: "#plan-summary", label: "플랜" },
];

const API_BELT = [...APIS, ...APIS];

const DASHBOARD_API_ROWS = [
  { name: "Text (Qwen)", ms: "182ms" },
  { name: "Embedding", ms: "43ms" },
  { name: "TTS", ms: "320ms" },
];

type CourseItem = { num: string; icon: string; name: string; sub: string; task: string; span: boolean };

export default function Home() {
  const [courseMenu, setCourseMenu] = useState<CourseItem[]>(DEFAULT_COURSE_MENU);
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

  useEffect(() => {
    getApis().then((apis) => {
      const items: CourseItem[] = apis
        .filter((api) => {
          const tk = api.task_key ?? "";
          return !HIDDEN_TASKS.has(tk);
        })
        .map((api, idx) => {
          const tk = api.task_key ?? "";
          const display = TASK_DISPLAY[tk];
          if (!display) return null;
          const isLast = idx === apis.filter((a) => {
            const t = a.task_key ?? "";
            return !HIDDEN_TASKS.has(t) && TASK_DISPLAY[t];
          }).length - 1;
          return {
            num: HANZI[idx] ?? String(idx + 1),
            icon: display.icon,
            name: display.name,
            sub: display.sub,
            task: display.task,
            span: isLast,
          };
        })
        .filter((x): x is CourseItem => x !== null);
      if (items.length > 0) setCourseMenu(items);
    }).catch(() => {});
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
        el.scrollLeft = 0;
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen">
      {comingSoonMessage ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/10 backdrop-blur-[2px] px-4">
          <div className="w-[min(520px,90%)] rounded-2xl border border-wood/22 bg-background p-4 shadow-[0_8px_48px_rgba(0,0,0,0.12)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-wood/22 bg-wood/8 text-wood">
                +
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Coming Soon
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {comingSoonMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <SiteNav fixed />

      {/* ── Hero ── */}
      <section className="relative flex flex-col overflow-hidden px-10 xl:px-16 pt-[60px]" style={{ height: "calc(100vh - 250px)" }}>
        {/* 일월오봉 — 달 (좌상단) */}
        <svg aria-hidden="true" style={{ position: "absolute", top: "-6%", left: "-40px", width: "320px", height: "320px", zIndex: 0 }} viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
          <circle cx="160" cy="160" r="154" fill="#F0EBE0" opacity="0.72" />
          <circle cx="160" cy="160" r="130" fill="none" stroke="rgba(220,210,190,0.40)" strokeWidth="1.2" />
          <circle cx="160" cy="160" r="104" fill="none" stroke="rgba(220,210,190,0.18)" strokeWidth="0.8" />
        </svg>
        {/* 일월오봉 — 해 (우상단) */}
        <svg aria-hidden="true" style={{ position: "absolute", top: "-5%", right: "-55px", width: "380px", height: "380px", zIndex: 0 }} viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg">
          <circle cx="210" cy="210" r="202" fill="#7A1B16" opacity="0.88" />
          <circle cx="210" cy="210" r="170" fill="none" stroke="rgba(255,200,180,0.16)" strokeWidth="1.4" />
          <circle cx="210" cy="210" r="136" fill="none" stroke="rgba(255,200,180,0.08)" strokeWidth="1" />
        </svg>
        {/* 일월오봉 — 오봉 산맥 */}
        <svg aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: "68%", zIndex: 0 }} viewBox="0 0 1440 480" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* 원경 산 — 가장 연하게 */}
          <path d="M0,480 L0,320 Q180,200 360,260 Q540,180 720,200 Q900,180 1080,260 Q1260,200 1440,300 L1440,480 Z" fill="rgba(80,60,30,0.045)" />
          {/* 5봉 메인 봉우리 */}
          <path d="M0,480 L0,380 Q120,300 240,340 Q360,260 480,290 Q570,220 660,240 Q720,200 780,220 Q870,200 960,240 Q1050,260 1140,300 Q1260,260 1380,320 L1440,340 L1440,480 Z" fill="rgba(70,52,22,0.068)" />
          {/* 중경 능선 */}
          <path d="M0,480 L0,420 Q200,370 400,390 Q600,350 720,360 Q840,350 1040,385 Q1240,365 1440,400 L1440,480 Z" fill="rgba(60,44,18,0.085)" />
          {/* 전경 물결 */}
          <path d="M0,480 L0,455 Q180,438 360,448 Q540,434 720,444 Q900,432 1080,446 Q1260,434 1440,450 L1440,480 Z" fill="rgba(50,36,14,0.055)" />
        </svg>
        <div className="mx-auto flex w-full max-w-full flex-1 flex-col">
          <div className="relative z-10 flex flex-1 items-center gap-12">

            {/* Left: Text Content */}
            <div className="text-left">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.30em] text-accent">
                구독 하나로 완성하는 AI 인프라
              </p>
              <h1 className="mb-4 font-serif text-[2.2rem] leading-[1.35] tracking-[0.025em] text-foreground md:text-[3.2rem]" style={{ fontWeight: 900 }}>
                당신의 AI 스택,
                <br />
                <span className="text-accent">오마카세처럼</span> 큐레이션
              </h1>
              <p className="mb-6 max-w-2xl text-sm leading-[1.8] tracking-[0.012em] text-foreground/72 md:text-[0.95rem]">
                최신 AI 모델 API의 MCP 통합을 한 곳에서 구독하고,
                연결부터 비용 관리까지 전 과정을 자동화하세요.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/api-test"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all hover:bg-accent-bright"
                >
                  무료 체험하기
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-wood/35 px-7 text-sm font-medium text-foreground/60 transition-colors hover:border-wood/60 hover:text-foreground"
                >
                  플랜 보기
                </Link>
              </div>

              {/* Badge strip */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "월정액으로 비용 잡기",
                  "자체 GPU로 돌림",
                  "가입 없이 바로 테스트",
                  `${courseMenu.length}종 AI API 한곳에`,
                ].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full border border-wood/16 bg-wood/5 px-3 py-1 font-mono text-[10px] text-foreground/50"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: 오마카세 코스 메뉴판 (wide) */}
            <div className="hidden shrink-0 lg:block">
              <div className="relative w-[640px] rounded-2xl border border-wood/20 bg-[#FAF7F2] px-7 py-5 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
                {/* 상단 헤더 */}
                <div className="mb-5 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-wood/50">오늘의 코스</p>
                  <div className="h-px flex-1 mx-4 bg-wood/15" />
                  <p className="font-serif text-[11px] text-wood/40">API OMAKASE</p>
                </div>

                {/* API 그리드 — 2열 × 6행 */}
                <div className="grid grid-cols-2 gap-0 divide-y divide-wood/10 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-wood/10">
                  {courseMenu.map((course) => (
                    <Link key={course.name} href={`/api-test?task=${course.task}`} className={`flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-wood/5${course.span ? " col-span-2" : ""}`}>
                      <span className="mt-0.5 w-6 shrink-0 font-serif text-[11px] text-wood/35">{course.num}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-wood/50">{course.icon}</span>
                          <p className="font-mono text-[12px] font-semibold tracking-wider text-foreground/80">{course.name}</p>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-foreground/40">{course.sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 하단 */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-wood/15" />
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="rgba(160,120,48,0.25)" strokeWidth="1"/>
                    <circle cx="9" cy="9" r="4" fill="rgba(160,120,48,0.12)"/>
                  </svg>
                  <div className="h-px flex-1 bg-wood/15" />
                </div>
                <p className="mt-2 text-center font-mono text-[9px] tracking-[0.25em] text-wood/35">처리량 기반 월정액</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 히어로 아래 전체 흰색 배경 */}
      <div className="bg-white">

      {/* ── 01–04 Feature Cards ── */}
      <div className="grid grid-cols-2 border-t border-wood/10 px-16 md:grid-cols-4 md:divide-x md:divide-wood/20">
        {FEATURES_04.map((feature) => (
          <div
            key={feature.num}
            className="group flex flex-col items-center px-5 py-10 text-center"
          >
            <span className="mb-3 self-start font-mono text-xs tracking-[0.22em] text-wood/60">
              {feature.num}
            </span>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-wood/30">
              <svg
                width="32"
                height="32"
                viewBox="0 0 40 40"
                className="text-wood transition-colors group-hover:text-accent"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {feature.icon}
              </svg>
            </div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-[12px] leading-relaxed text-foreground/52">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* ── Pricing Proof ── */}
      <section
        id="pricing-proof"
        className="border-t border-wood/8 px-16 py-16 md:py-12"
      >
        <div className="mx-auto max-w-full">
          <details
            className="group rounded-[28px] border border-wood/12 bg-surface/50 p-5 md:p-8"
          >
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-accent">
                    가격 근거
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
                    일정 사용량부터는 월정액이 더 경제적이에요
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/60 md:text-base">
                    GPT-4o처럼 토큰 과금이랑, 오마카세 LLM(Qwen 3.6) API Starter
                    월 19만 원을 같은 그래프에 올려놓으면, 어디부터 월정액이
                    경제적인지 한눈에 보여요.
                  </p>
                </div>
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-wood/14 bg-background/60 text-foreground/45 transition-transform group-open:rotate-180 sm:self-center"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </div>
            </summary>
            <div className="mt-10 space-y-6">
              <div className="overflow-hidden rounded-[32px] border border-wood/16 bg-background p-8 shadow-[0_4px_40px_rgba(0,0,0,0.04)] md:p-10">
                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">
                      사용량이 일정 수준을 넘으면 월정액이 더 유리해요
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/58">
                      X축은 월에 쓴 토큰(백만 단위), Y축은 월 비용이에요. 교차점
                      이후부터는 사용량이 커질수록 우리 쪽 절감폭이 커져요
                    </p>
                  </div>
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-right shadow-[0_4px_24px_rgba(122,27,22,0.06)]">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/80">
                      오마카세 LLM(Qwen 3.6) Starter
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      190,000원
                    </p>
                  </div>
                </div>
                <div className="mt-8 overflow-hidden rounded-[30px] border border-wood/12 bg-surface/40 p-6 md:p-8">
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
                        <stop offset="0%" stopColor="rgba(122,27,22,0)" />
                        <stop offset="100%" stopColor="rgba(122,27,22,0.14)" />
                      </linearGradient>
                    </defs>
                    {TARGET_GRAPH_TICKS_Y.map((tick) => (
                      <g key={`y-${tick}`}>
                        <line
                          x1="90"
                          y1={graphY(tick)}
                          x2="870"
                          y2={graphY(tick)}
                          stroke="rgba(28,16,8,0.07)"
                          strokeDasharray={tick === 0 ? "0" : "4 6"}
                        />
                        <text
                          x="78"
                          y={graphY(tick) + 4}
                          textAnchor="end"
                          fill="rgba(28,16,8,0.38)"
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
                          stroke="rgba(28,16,8,0.05)"
                          strokeDasharray={tick === 0 ? "0" : "4 6"}
                        />
                        <text
                          x={graphX(tick)}
                          y="424"
                          textAnchor="middle"
                          fill="rgba(28,16,8,0.38)"
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
                      stroke="rgba(28,16,8,0.18)"
                    />
                    <line
                      x1="90"
                      y1="72"
                      x2="90"
                      y2="392"
                      stroke="rgba(28,16,8,0.18)"
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
                      stroke="rgba(122,27,22,0.92)"
                      strokeWidth="3.5"
                    />
                    <line
                      x1="90"
                      y1={graphY(0)}
                      x2="870"
                      y2={graphY(GPT4O_KRW_PER_M_TOKEN * TARGET_GRAPH_MAX_X)}
                      stroke="rgba(28,16,8,0.65)"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx={graphX(TARGET_BREAK_EVEN_X)}
                      cy={graphY(TARGET_BREAK_EVEN_Y)}
                      r="18"
                      fill="rgba(122,27,22,0.12)"
                    />
                    <circle
                      cx={graphX(TARGET_BREAK_EVEN_X)}
                      cy={graphY(TARGET_BREAK_EVEN_Y)}
                      r="8"
                      fill="rgba(122,27,22,0.92)"
                    />
                    <line
                      x1={graphX(TARGET_BREAK_EVEN_X)}
                      y1="72"
                      x2={graphX(TARGET_BREAK_EVEN_X)}
                      y2="392"
                      stroke="rgba(122,27,22,0.38)"
                      strokeDasharray="6 6"
                    />
                    <text
                      x={graphX(TARGET_BREAK_EVEN_X)}
                      y="444"
                      textAnchor="middle"
                      fill="rgba(28,16,8,0.40)"
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
                      fill="rgba(28,16,8,0.42)"
                      fontSize="13"
                      fontFamily="monospace"
                    >
                      비용
                    </text>
                    <text
                      x="870"
                      y="468"
                      textAnchor="end"
                      fill="rgba(28,16,8,0.42)"
                      fontSize="13"
                      fontFamily="monospace"
                    >
                      월간 사용량 (백만 토큰)
                    </text>
                    <text
                      x={graphX(0) - 18}
                      y={graphY(0) + 18}
                      fill="rgba(28,16,8,0.42)"
                      fontSize="13"
                      fontFamily="monospace"
                    >
                      0
                    </text>
                  </svg>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                      손익분기점
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      약 {TARGET_BREAK_EVEN_X.toFixed(1)}M 토큰
                    </p>
                    <p className="mt-1 text-sm text-foreground/55">
                      여기 넘기면 우리 쪽을 쓰는 게 더 유리해요.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-wood/14 bg-surface px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                      그래프 해석
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      GPT-4o는 사용량 비례 증가, 오마카세는 월 19만원 고정
                    </p>
                    <p className="mt-1 text-sm text-foreground/50">
                      입력·출력 반반 가정하고 GPT-4o 요금을 환산한 거예요.
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
                        ? "border-accent/20 bg-accent/5 shadow-[0_4px_32px_rgba(122,27,22,0.06)]"
                        : "border-wood/12 bg-background",
                    ].join(" ")}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/75">
                      예상 타겟 고객
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">
                      {customer.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/55">
                      {customer.description}
                    </p>
                  </div>
                ))}
                <div className="rounded-3xl border border-accent/18 bg-accent/5 p-5 shadow-[0_4px_36px_rgba(122,27,22,0.07)]">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                    결론
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    쓰는 양 많고, 실험도 자주 하고, 사용자 요청도 동시에 몰리면
                    우리 쪽이 더 유리해요.
                  </p>
                  <div className="mt-4 rounded-2xl border border-wood/12 bg-background px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      교점 이전 고객
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/52">
                      적게 쓰면 다른 게 더 싸게 나올 수도 있어요.
                    </p>
                  </div>
                  <div className="mt-3 rounded-2xl border border-accent/22 bg-accent/8 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      교점 이후 고객
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/75">
                      이럴 때 우리 플랜이 더 유리해요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* ── Why Omakase ── */}
      <section id="why-omakase" className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-full">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            왜 AI API 오마카세인가요?
          </h2>
          <p className="mx-auto mb-14 max-w-3xl text-center text-foreground/58">
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
                      ? "border-accent/20 bg-accent/5 shadow-[0_4px_32px_rgba(122,27,22,0.06)]"
                      : "border-wood/10 bg-background",
                  ].join(" ")}
                >
                  <div className="mb-4 h-1 w-12 rounded-full bg-accent" />
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/55">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-wood/12 bg-background p-8">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                추천 대상
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                이런 팀이 편해요
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/58">
                목록만 길게 뽑아준 게 아니라, 빨리 써보고 월에 고정으로 나갈
                금액만 맞추면 되는 팀이면 체감이 커요.
              </p>
              <div className="mt-6 space-y-3">
                {FITS_FOR.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-wood/10 bg-surface px-4 py-3"
                  >
                    <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                    <p className="text-sm text-foreground/72">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section
        id="compare"
        className="border-t border-wood/8 px-16 py-16 md:py-12"
      >
        <div className="mx-auto max-w-full">
          <details
            className="group rounded-[28px] border border-wood/12 bg-surface/50 p-5 md:p-8"
          >
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
                    비교 포인트
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
                    그래서 뭐가 달라져요?
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/60 md:text-base">
                    API 몇 개 있냐보다, 붙이고 돌리는 게 얼마나 귀찮지 않냐가
                    중요하죠. 아래는 비용이랑 운영이 덜 복잡해지는 쪽으로만
                    짚어본 거예요.
                  </p>
                </div>
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-wood/14 bg-background/60 text-foreground/45 transition-transform group-open:rotate-180 sm:self-center"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </div>
            </summary>

            <div className="mt-10 hidden overflow-hidden rounded-3xl border border-wood/12 bg-background md:block">
              <div className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-wood/8 bg-surface">
                <div className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/38">
                  비교 항목
                </div>
                <div className="px-5 py-4 text-sm font-semibold text-foreground/58">
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
                      ? "border-b border-wood/8"
                      : "",
                  ].join(" ")}
                >
                  <div className="px-5 py-5 text-sm font-semibold text-foreground">
                    {row.label}
                  </div>
                  <div className="px-5 py-5 text-sm leading-relaxed text-foreground/48">
                    {row.before}
                  </div>
                  <div className="bg-accent/5 px-5 py-5 text-sm leading-relaxed text-foreground/80">
                    {row.after}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-4 md:hidden">
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="overflow-hidden rounded-3xl border border-wood/12 bg-background"
                >
                  <div className="border-b border-wood/8 bg-surface px-5 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                      {row.label}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/38">
                      일반적인 도입 방식
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/50">
                      {row.before}
                    </p>
                  </div>
                  <div className="border-t border-wood/8 bg-accent/5 px-5 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                      AI API 오마카세
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                      {row.after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-full">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              활용 시나리오
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              이렇게만 이어 붙여도 돼요
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/58">
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
                    ? "border-accent/20 bg-accent/5 shadow-[0_4px_32px_rgba(122,27,22,0.06)]"
                    : "border-wood/10 bg-background",
                ].join(" ")}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                  {useCase.flow}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {useCase.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/58">
                  {useCase.summary}
                </p>
                <div className="mt-6 rounded-2xl border border-wood/10 bg-surface p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/38">
                    기대 효과
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                    {useCase.outcome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Onboarding Flow ── */}
      <section className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-full">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              시작 방법
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              시작하는 건 단순하게
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/58">
              기능 설명만 길게 읽게 하기보다, 어떻게 시작하면 되는지가 먼저
              보여야 하죠. 흐름은 이 세 단계로 보면 돼요.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ONBOARDING_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className={[
                  "rounded-3xl border p-7",
                  idx === 1
                    ? "border-accent/20 bg-accent/5 shadow-[0_4px_32px_rgba(122,27,22,0.06)]"
                    : "border-wood/10 bg-background",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs tracking-[0.24em] text-accent">
                    STEP {item.step}
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/22 bg-accent/8 font-mono text-sm text-accent">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/58">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APIs Section ── */}
      <section id="apis" className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-full">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            쓸 만한 API, 한곳에
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-foreground/58">
            필요한 것만 골라 쓰면 되고, 앞으로도 하나씩 더 붙일 예정이에요.
          </p>
          <div
            ref={underCarouselRef}
            className="api-belt-wrap overflow-x-auto"
            onMouseEnter={() => pauseUnderCarousel()}
            onWheel={() => pauseUnderCarousel()}
            onPointerDown={() => pauseUnderCarousel(2000)}
          >
            <div className="api-belt-track flex w-max gap-5 pr-6">
              {API_BELT.map((api, i) =>
                api.comingSoon ? (
                  api.apiId ? (
                    <button
                      key={`${api.name}-${i}`}
                      type="button"
                      onClick={() =>
                        showComingSoon(
                          "추가 API가 곧 공개돼요. 조금만 기다려 주세요!",
                        )
                      }
                      className="api-belt-card group w-[250px] shrink-0 rounded-2xl border border-wood/12 bg-background p-6 text-left transition-all"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-wood/16 bg-wood/6 font-mono text-xl text-wood transition-colors group-hover:border-accent/22 group-hover:bg-accent/6 group-hover:text-accent">
                        {api.icon}
                      </div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        {api.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground/52">
                        {api.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/38 opacity-0 transition-all duration-200 group-hover:opacity-100">
                        <span>곧 공개됩니다</span>
                        <span className="text-accent/70">→</span>
                      </div>
                    </button>
                  ) : (
                    <Link
                      key={`${api.name}-${i}`}
                      href="/api-test"
                      className="api-belt-card group block w-[250px] shrink-0 rounded-2xl border border-wood/12 bg-background p-6 text-left transition-all"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-wood/16 bg-wood/6 font-mono text-xl text-wood transition-colors group-hover:border-accent/22 group-hover:bg-accent/6 group-hover:text-accent">
                        {api.icon}
                      </div>
                      <h3 className="mb-2 font-semibold text-foreground">
                        {api.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground/52">
                        {api.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/38 opacity-0 transition-all duration-200 group-hover:opacity-100">
                        <span>All 보기</span>
                        <span className="text-accent/70">→</span>
                      </div>
                    </Link>
                  )
                ) : (
                  <Link
                    key={`${api.name}-${i}`}
                    href={`/api-test?task=${api.apiId}`}
                    className="api-belt-card group block w-[250px] shrink-0 rounded-2xl border border-wood/12 bg-background p-6 transition-all"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-wood/16 bg-wood/6 font-mono text-xl text-wood transition-colors group-hover:border-accent/22 group-hover:bg-accent/6 group-hover:text-accent">
                      {api.icon}
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">
                      {api.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/52">
                      {api.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-foreground/38 opacity-0 transition-all duration-200 group-hover:opacity-100">
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

      {/* ── Price Summary ── */}
      <section id="plan-summary" className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-full">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              빠른 가격 안내
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              플랜은 뭐 먼저 보면 돼요?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/58">
              API마다 금액은 다르지만, 고르는 구조는 단순해요. 일단 써보려면
              Starter, 사람 붙으면 Pro 쪽을 보면 돼요.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-wood/12 bg-background px-6 py-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent/80">
                  초당 처리량이란?
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  1초 동안 몇 개의 요청을 처리할 수 있는지 나타내요.
                </p>
              </div>
              <div className="rounded-2xl border border-wood/14 bg-surface px-4 py-3 text-sm leading-relaxed text-foreground/65 md:max-w-sm">
                처리량이 높을수록, 요청이 한꺼번에 몰려도 덜 버벅이는 쪽이에요.
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/52">
              사내에서만 돌릴 땐 낮아도 되는데, 실제 사용자 붙으면 처리량 높은
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
                    <p className="mt-2 text-sm text-foreground/58">
                      {plan.subtitle}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-wood/12 bg-background px-4 py-3 text-left sm:text-right">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/38">
                      초당 처리량
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
                      <p className="text-sm leading-relaxed text-foreground/72">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-foreground/35">
            * 가격은 API 종류마다 달라요. 위 금액은 최저가 기준이에요.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:bg-accent-bright"
            >
              전체 플랜 보기
            </Link>
            <Link
              href="/api-test"
              className="inline-flex items-center gap-2 rounded-full border border-wood/30 px-7 py-3.5 text-sm font-medium text-foreground/60 transition-colors hover:border-wood/55 hover:text-foreground"
            >
              먼저 테스트하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="pricing" className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-full">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            운영할 때 덜 머리 아픈 쪽으로
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-foreground/58">
            비용·서버·API 늘리는 것까지 한 번에 이해하기 쉽게 만들어뒀어요.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit, idx) => (
              <div
                key={benefit.title}
                className={[
                  "rounded-2xl border p-8",
                  idx === 0
                    ? "border-accent/20 bg-accent/5 shadow-[0_4px_32px_rgba(122,27,22,0.06)]"
                    : "border-wood/10 bg-background",
                ].join(" ")}
              >
                {idx === 0 ? (
                  <span className="mb-3 inline-flex items-center rounded-full border border-accent/22 bg-accent/8 px-3 py-1 font-mono text-[11px] text-accent">
                    핵심 장점
                  </span>
                ) : null}
                <div className="mb-4 h-1 w-12 rounded-full bg-accent" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-foreground/55">{benefit.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-wood/14 bg-surface p-8 text-center md:p-12">
            <p className="font-mono text-sm text-foreground/55">
              계산기보다 운영 기준이 먼저
            </p>
            <p className="mt-2 text-foreground/70">
              API마다 따로 붙이지 말고, 한곳에서 써보고 기준만 맞춰 가면 돼요.
            </p>
            <Link
              href="/plans"
              className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:bg-accent-bright"
            >
              플랜 보기
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="border-t border-wood/8 px-16 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-wood/14 bg-surface p-12 text-center md:p-16">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
            시작하기
          </p>
          <h2 className="mb-4 mt-3 text-3xl font-bold text-foreground md:text-4xl">
            한번 써보면 감 와요
          </h2>
          <p className="mb-8 text-foreground/58">
            먼저 직접 써보고, 맞으면 그때 플랜 고르면 돼요.
          </p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
            {FINAL_CTA_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center rounded-full border border-wood/14 bg-background px-3 py-1.5 font-mono text-[11px] text-foreground/55"
              >
                {point}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/api-test"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-white transition-opacity hover:bg-accent-bright"
            >
              무료 체험하기
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-full border border-wood/30 px-8 py-4 text-sm font-medium text-foreground/60 transition-colors hover:border-wood/55 hover:text-foreground"
            >
              플랜 보기
            </Link>
          </div>
          <Link
            href="mailto:help@kogrobo.com"
            className="mt-5 inline-flex text-sm text-foreground/40 transition-colors hover:text-accent"
          >
            도입이 애매하면 메일로 물어보기
          </Link>
        </div>
      </section>

      </div>{/* /bg-white */}
    </div>
  );
}
