"use client";

import { Suspense } from "react";
import { SiteNav } from "@/components/SiteNav";
import { LoginForm } from "@/components/LoginForm";

function LoginPageInner() {
  return (
    <div className="platform-shell flex min-h-screen flex-col">
      <SiteNav fixed />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 pt-28 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
            첫 실행
          </p>
          <h2 className="mt-4 max-w-xl text-[48px] font-semibold leading-[1.03] text-[#08090d] md:text-[64px]">
            가장 빠른 첫 실행 흐름으로 돌아가세요.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-black/56">
            로그인 직후 계정 설정이 아니라 첫 실행 화면으로 이동합니다. API key를
            만들고, 코드 스니펫을 복사하고, 플레이그라운드에서 바로 검증하세요.
          </p>
        </section>

        <div className="w-full">
          <div className="platform-card rounded-xl p-6 shadow-[0_24px_100px_rgba(8,9,13,0.10)] md:p-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
