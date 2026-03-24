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
    name: "More APIs",
    description: "추가 API는 지속적으로 확장됩니다",
    icon: "+",
    comingSoon: true,
  },
];

const BENEFITS = [
  {
    title: "트래픽픽 기반 과금",
    description: "토큰량이 아닌 최대 RPS만 제한. 예측 가능한 비용 관리",
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-grid-pattern">
      {comingSoonMessage ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px] px-4">
          <div className="w-[min(520px,90%)] rounded-2xl border border-[#10b981]/30 bg-background/70 p-4 shadow-[0_0_60px_rgba(16,185,129,0.18)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]">
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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-accent">GPU</span>
            <span className="font-mono text-lg font-medium text-foreground/90">
              Modu
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/plans"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
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
          <p className="mb-4 font-mono text-sm text-accent">
            GPU 기반 AI API 플랫폼
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            고성능 AI API를
            <br />
            <span className="text-accent">저렴하게</span> 이용하세요
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-foreground/70">
            자체 GPU로 구축한 임베딩, 리랭킹, TTS 등 다양한 API.
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
          <div className="api-belt-wrap overflow-hidden">
            <div className="api-belt-track flex w-max gap-6 pr-6">
              {API_BELT.map((api, i) => (
                api.comingSoon ? (
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
                )
              ))}
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
            토큰량 측정 없이, 최대 RPS만 제한하는 구조로 비용을 명확히 파악할 수
            있습니다.
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
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent">GPU</span>
            <span className="font-mono text-foreground/70">Modu</span>
          </div>
          <p className="text-sm text-foreground/50">
            © {new Date().getFullYear()} GPUModu. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
