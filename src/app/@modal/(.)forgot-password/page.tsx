"use client";

import { Suspense, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

function ForgotPasswordModal() {
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

  function handleLogin() {
    sessionStorage.setItem("modalScrollY", String(window.scrollY));
    router.push("/login", { scroll: false });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-2xl md:p-8">
          <ForgotPasswordForm onBack={handleClose} onLogin={handleLogin} />
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordModalPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordModal />
    </Suspense>
  );
}
