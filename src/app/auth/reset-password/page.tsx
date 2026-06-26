"use client";

import { Suspense } from "react";
import { SiteNav } from "@/components/SiteNav";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

function ResetPasswordPageInner() {
  return (
    <div className="platform-shell flex min-h-screen flex-col">
      <SiteNav fixed />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 pt-28 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
            계정 복구
          </p>
          <h2 className="mt-4 max-w-xl text-[48px] font-semibold leading-[1.03] text-[#08090d] md:text-[64px]">
            새 비밀번호를 설정하세요.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-black/56">
            이메일로 받은 재설정 링크를 통해 접속하셨습니다. 새 비밀번호를
            입력하고 저장하면 로그인 화면으로 이동합니다.
          </p>
        </section>

        <div className="w-full">
          <div className="platform-card rounded-xl p-6 shadow-[0_24px_100px_rgba(8,9,13,0.10)] md:p-8">
            <ResetPasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AuthResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
