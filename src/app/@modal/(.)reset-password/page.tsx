"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { AuthResetPasswordModal } from "@/components/AuthResetPasswordModal";

function ResetPasswordModal() {
  const router = useRouter();

  function handleClose() {
    router.back();
  }

  function handleLogin() {
    sessionStorage.setItem("modalScrollY", String(window.scrollY));
    router.push("/login", { scroll: false });
  }

  function handleForgotPassword() {
    sessionStorage.setItem("modalScrollY", String(window.scrollY));
    router.push("/forgot-password", { scroll: false });
  }

  function handleResetSuccess() {
    sessionStorage.setItem("modalScrollY", "0");
    router.push("/login?reset=1", { scroll: false });
  }

  return (
    <AuthResetPasswordModal
      preserveScroll
      onClose={handleClose}
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
      onResetSuccess={handleResetSuccess}
    />
  );
}

export default function ResetPasswordModalPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordModal />
    </Suspense>
  );
}
