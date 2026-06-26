"use client";

import { useLayoutEffect } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

type AuthResetPasswordModalProps = {
  onClose: () => void;
  onLogin?: () => void;
  onForgotPassword?: () => void;
  onResetSuccess?: () => void;
  /** 사이트 내 모달 전환 시 스크롤 위치 복원 */
  preserveScroll?: boolean;
};

export function AuthResetPasswordModal({
  onClose,
  onLogin,
  onForgotPassword,
  onResetSuccess,
  preserveScroll = false,
}: AuthResetPasswordModalProps) {
  useLayoutEffect(() => {
    const scrollY = preserveScroll
      ? parseInt(sessionStorage.getItem("modalScrollY") ?? "0", 10)
      : 0;
    document.body.style.overflow = "hidden";
    if (preserveScroll) {
      window.scrollTo(0, scrollY);
    }
    return () => {
      document.body.style.overflow = "";
      if (preserveScroll) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [preserveScroll]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto">
        <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-2xl md:p-8">
          <ResetPasswordForm
            onBack={onClose}
            onLogin={onLogin}
            onForgotPassword={onForgotPassword}
            onResetSuccess={onResetSuccess}
          />
        </div>
      </div>
    </div>
  );
}
