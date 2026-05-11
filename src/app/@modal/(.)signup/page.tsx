"use client";

import { Suspense, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";

function SignupModal() {
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

  function handleSuccess() {
    router.back();
    router.refresh();
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
      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="rounded-2xl border border-white/10 bg-surface/90 p-8 shadow-2xl backdrop-blur-sm">
          <SignupForm onSuccess={handleSuccess} onBack={handleClose} />
        </div>
      </div>
    </div>
  );
}

export default function SignupModalPage() {
  return (
    <Suspense fallback={null}>
      <SignupModal />
    </Suspense>
  );
}
