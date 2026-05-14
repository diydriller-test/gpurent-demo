"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { signup } from "@/lib/api";

interface SignupFormProps {
  onSuccess?: (nextPath: string) => void;
  onBack?: () => void;
}

export function SignupForm({ onSuccess, onBack }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    const raw = searchParams.get("redirect");
    if (!raw) return null;
    if (!raw.startsWith("/") || raw.startsWith("//")) return null;
    if (raw === "/signup") return null;
    return raw;
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!email || !username || !password) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await signup({ email, username, password });
      const nextRedirect = redirectPath ?? "/profile?firstRun=1";
      const nextPath = `/login?redirect=${encodeURIComponent(nextRedirect)}&firstRun=1`;
      if (onSuccess) {
        onSuccess(nextPath);
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
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
          첫 실행
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight text-[#08090d]">
          몇 분 안에 첫 실행까지 이어집니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/56">
          계정을 만든 뒤 바로 로그인하고, API key와 플레이그라운드 실행 화면으로
          이어집니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
          <label
            htmlFor="signup-username"
            className="mb-2 block text-sm font-medium text-black/70"
          >
            사용자명
          </label>
          <input
            id="signup-username"
            type="text"
            name="username"
            placeholder="username"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
          />
          </div>

          <div>
          <label
            htmlFor="signup-email"
            className="mb-2 block text-sm font-medium text-black/70"
          >
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
          />
          </div>
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-2 block text-sm font-medium text-black/70"
          >
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            name="password"
            placeholder="8자 이상"
            required
            minLength={8}
            disabled={isLoading}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="signup-confirmPassword"
            className="mb-2 block text-sm font-medium text-black/70"
          >
            비밀번호 확인
          </label>
          <input
            id="signup-confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="비밀번호를 다시 입력하세요"
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
          {isLoading ? "작업 공간을 준비하는 중..." : "바로 시작하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-black/52">
        이미 계정이 있으신가요?{" "}
        <Link
          href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login"}
          scroll={false}
          onClick={() => sessionStorage.setItem("modalScrollY", String(window.scrollY))}
          className="font-medium text-accent hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
