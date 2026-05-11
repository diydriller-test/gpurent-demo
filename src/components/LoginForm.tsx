"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { login } from "@/lib/api";
import { setToken } from "@/lib/token";

interface LoginFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function LoginForm({ onSuccess, onBack }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    const raw = searchParams.get("redirect");
    if (!raw) return null;
    if (!raw.startsWith("/") || raw.startsWith("//")) return null;
    if (raw === "/login") return null;
    return raw;
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const { access_token } = await login({ email, password });
      setToken(access_token);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectPath ?? "/api-test");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
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

      <div className="mb-8 mt-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">로그인</h1>
        <p className="mt-2 text-sm text-foreground/60">
          AI API 오마카세를 사용하려면 로그인하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-medium text-foreground/80"
          >
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-sm font-medium text-foreground/80"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            disabled={isLoading}
            className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-accent py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "처리 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/60">
        계정이 없으신가요?{" "}
        <Link
          href={redirectPath ? `/signup?redirect=${encodeURIComponent(redirectPath)}` : "/signup"}
          className="font-medium text-accent hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
