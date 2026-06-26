"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

/** 이메일 링크 등 직접 접속 시 폼 표시. 사이트 내 이동은 @modal 인터셉트가 처리. */
function ResetPasswordDirect() {
  return (
    <div className="platform-shell flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-6 shadow-2xl md:p-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordDirect />
    </Suspense>
  );
}
