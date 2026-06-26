"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { AuthResetPasswordModal } from "@/components/AuthResetPasswordModal";
import { navigateToLoginAfterPasswordReset } from "@/lib/authModalNav";

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
    navigateToLoginAfterPasswordReset(router);
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
