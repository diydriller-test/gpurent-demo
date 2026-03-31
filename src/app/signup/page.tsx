"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-wood/15 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-tight text-accent text-omakase-neon">
              AI API
            </span>
            <span className="font-mono text-lg font-medium text-wood">오마카세</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-foreground/70 transition-colors hover:text-accent"
          >
            홈으로
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/5 bg-surface/80 p-8 shadow-xl backdrop-blur-sm">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-xs text-foreground/60 transition-colors hover:text-accent"
            >
              <span>←</span>
              <span>뒤로가기</span>
            </button>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">회원가입</h1>
              <p className="mt-2 text-sm text-foreground/60">
                무료로 시작하고 API 키를 발급받으세요
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
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-foreground/80"
                >
                  사용자명
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="username"
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-foreground/80"
                >
                  이메일
                </label>
                <input
                  id="email"
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
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-foreground/80"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="8자 이상"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-foreground/80"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="비밀번호를 다시 입력하세요"
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
                {isLoading ? "처리 중..." : "회원가입"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-foreground/60">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-medium text-accent hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
