"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { forgotPassword } from "@/lib/api";

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "비밀번호 재설정 요청에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onBack ?? (() => router.back())}
        className="inline-flex items-center gap-1 text-xs text-foreground/60 transition-colors hover:text-accent"
      >
        <span>←</span>
        <span>뒤로가기</span>
      </button>

      <div className="mb-8 mt-4">
        <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
          비밀번호 찾기
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight text-[#08090d]">
          비밀번호를 재설정하세요
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/56">
          가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      {isSubmitted ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일함을
            확인해주세요.
          </div>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-[#08090d] py-3 text-center font-medium text-white transition-colors hover:bg-black"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="forgot-email"
              className="mb-2 block text-sm font-medium text-black/70"
            >
              이메일
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#08090d] py-3 font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "전송 중..." : "재설정 링크 보내기"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-black/52">
        비밀번호가 기억나셨나요?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
