"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

function LoginModal() {
  const router = useRouter();

  function handleClose() {
    router.back();
  }

  function handleSuccess() {
    router.back();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl border border-white/10 bg-surface/90 p-8 shadow-2xl backdrop-blur-sm">
          <LoginForm onSuccess={handleSuccess} onBack={handleClose} />
        </div>
      </div>
    </div>
  );
}

export default function LoginModalPage() {
  return (
    <Suspense fallback={null}>
      <LoginModal />
    </Suspense>
  );
}
