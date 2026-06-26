"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { resetPassword } from "@/lib/api";

interface ResetPasswordFormProps {
  onBack?: () => void;
}

export function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("유효하지 않은 재설정 링크입니다.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!password) {
      setError("새 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ token, password });
      router.push("/login?reset=1");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "비밀번호 재설정에 실패했습니다.",
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
          비밀번호 재설정
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight text-[#08090d]">
          새 비밀번호를 설정하세요
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/56">
          안전한 새 비밀번호를 입력한 뒤 저장해주세요.
        </p>
      </div>

      {!token ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            재설정 토큰이 없거나 유효하지 않습니다. 이메일의 링크를 다시
            확인해주세요.
          </div>
          <Link
            href="/forgot-password"
            className="block w-full rounded-lg bg-[#08090d] py-3 text-center font-medium text-white transition-colors hover:bg-black"
          >
            비밀번호 찾기
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
              htmlFor="reset-password"
              className="mb-2 block text-sm font-medium text-black/70"
            >
              새 비밀번호
            </label>
            <input
              id="reset-password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="reset-confirm-password"
              className="mb-2 block text-sm font-medium text-black/70"
            >
              새 비밀번호 확인
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
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
            {isLoading ? "저장 중..." : "비밀번호 변경"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-black/52">
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
