"use client";

import { Suspense } from "react";
import { SiteNav } from "@/components/SiteNav";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

function ForgotPasswordPageInner() {
  return (
    <div className="platform-shell flex min-h-screen flex-col">
      <SiteNav fixed />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 pt-28 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
            계정 복구
          </p>
          <h2 className="mt-4 max-w-xl text-[48px] font-semibold leading-[1.03] text-[#08090d] md:text-[64px]">
            비밀번호를 잊으셨나요?
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-black/56">
            가입 이메일로 재설정 링크를 보내드립니다. 링크를 통해 새 비밀번호를
            설정한 뒤 다시 로그인하세요.
          </p>
        </section>

        <div className="w-full">
          <div className="platform-card rounded-xl p-6 shadow-[0_24px_100px_rgba(8,9,13,0.10)] md:p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}
