"use client";

import { Suspense, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

function LoginModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordJustReset = searchParams.get("reset") === "1";

  useLayoutEffect(() => {
    const scrollY = passwordJustReset
      ? 0
      : parseInt(sessionStorage.getItem("modalScrollY") ?? "0", 10);
    if (passwordJustReset) {
      sessionStorage.setItem("modalScrollY", "0");
    }
    document.body.style.overflow = "hidden";
    window.scrollTo(0, scrollY);
    return () => {
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [passwordJustReset]);

  function handleClose() {
    router.back();
  }

  function handleSuccess(nextPath: string) {
    window.location.assign(nextPath);
  }

  function handleForgotPassword() {
    sessionStorage.setItem("modalScrollY", String(window.scrollY));
    router.push("/forgot-password", { scroll: false });
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
