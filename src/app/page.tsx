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
    description: "매달 고정 요금으로 이용하는 예측 가능한 비용 관리",
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
          <Link href="/" className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
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
          <h1 className="mb-6 text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl">
            <span className="text-omakase-gradient">AI API 오마카세</span>
          </h1>
          <p className="mx-auto mb-3 max-w-2xl text-base font-medium text-wood md:text-lg">
            셰프가 고른 API 코스를 한 상차림에 — 검증된 인프라로 안정적으로
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-foreground/70">
            임베딩, 리랭킹, TTS 등 필요한 API만 골라 쓰세요.
            <br className="hidden sm:block" />
            토큰 과금이 아닌{" "}
            <strong className="text-foreground">트래픽 기반</strong>으로 예측
            가능한 비용으로 운영하세요.
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

      {/* Benefits / Pricing Model */}
      <section id="pricing" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
            단순하고 예측 가능한 과금
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-foreground/70">
            이제 토큰 스트레스는 그만. 토큰량 측정 없이 최대 RPS만 제한하는
            구조로 비용을 명확히 파악할 수 있습니다.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-white/5 bg-surface/50 p-8"
              >
                <div className="mb-4 h-1 w-12 rounded-full bg-accent" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-foreground/60">{benefit.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center md:p-12">
            <p className="font-mono text-accent">RPS = Requests Per Second</p>
            <p className="mt-2 text-foreground/80">
              사용량에 맞는 RPS 플랜을 선택해 예상 비용을 쉽게 계산하세요.
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
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="mb-8 text-foreground/70">
            API 키를 발급받고, 몇 분 안에 통합을 완료하세요.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-medium text-background transition-opacity hover:opacity-90"
            >
              회원가입
            </Link>
            <Link
              href="mailto:contact@gpumodu.dev"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-white/5"
            >
              문의하기
            </Link>
          </div>
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
