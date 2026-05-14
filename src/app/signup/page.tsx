"use client";

import { Suspense } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SignupForm } from "@/components/SignupForm";

function SignupPageInner() {
  return (
    <div className="platform-shell flex min-h-screen flex-col">
      <SiteNav fixed />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 pt-28 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
            시작하기
          </p>
          <h2 className="mt-4 max-w-xl text-[48px] font-semibold leading-[1.03] text-[#08090d] md:text-[64px]">
            첫 API 호출은 여기서 시작됩니다.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-black/56">
            가입, 로그인, API key, 플레이그라운드 실행까지 한 흐름으로 이어집니다.
            설정 화면을 훑기 전에 먼저 결과를 확인하세요.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-black/58">
            {["계정 만들기", "API key 발급", "플레이그라운드 실행"].map(
              (step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 border-t border-black/[0.06] pt-3 first:border-t-0 first:pt-0"
                >
                  <span className="font-mono text-[12px] text-accent">
                    0{index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ),
            )}
          </div>
        </section>

        <div className="w-full">
          <div className="platform-card rounded-xl p-6 shadow-[0_24px_100px_rgba(8,9,13,0.10)] md:p-8">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}
