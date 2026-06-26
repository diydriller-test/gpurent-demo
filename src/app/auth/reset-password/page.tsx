"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthResetPasswordModal } from "@/components/AuthResetPasswordModal";

/** 이메일 링크(`/auth/reset-password?token=...`) 직접 접속 시 모달 UI 표시 */
function AuthResetPasswordPageInner() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem("modalScrollY", "0");
  }, []);

  function handleClose() {
    router.push("/");
  }

  function handleLogin() {
    router.push("/login");
  }

  function handleForgotPassword() {
    router.push("/forgot-password");
  }

  function handleResetSuccess() {
    sessionStorage.setItem("modalScrollY", "0");
    router.push("/login?reset=1", { scroll: false });
  }

  return (
    <div className="platform-shell min-h-screen">
      <AuthResetPasswordModal
        onClose={handleClose}
        onLogin={handleLogin}
        onForgotPassword={handleForgotPassword}
        onResetSuccess={handleResetSuccess}
      />
    </div>
  );
}

export default function AuthResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AuthResetPasswordPageInner />
    </Suspense>
  );
}
