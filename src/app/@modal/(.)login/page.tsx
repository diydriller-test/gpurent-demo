"use client";

import { Suspense, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

function LoginModal() {
  const router = useRouter();

  useLayoutEffect(() => {
    const scrollY = parseInt(sessionStorage.getItem("modalScrollY") ?? "0", 10);
    document.body.style.overflow = "hidden";
    window.scrollTo(0, scrollY);
    return () => {
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  function handleClose() {
    router.back();
  }

  function handleSuccess(nextPath: string) {
    window.location.assign(nextPath);
  }

  function handleForgotPassword() {
    router.replace("/forgot-password");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-2xl md:p-8">
          <LoginForm
            onSuccess={handleSuccess}
            onBack={handleClose}
            onForgotPassword={handleForgotPassword}
          />
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
