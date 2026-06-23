"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { login } from "@/lib/api";
import { setToken, setUserId } from "@/lib/token";

interface LoginFormProps {
  onSuccess?: (nextPath: string) => void;
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

  const recoveryMailto = `mailto:help@kogrobo.com?subject=${encodeURIComponent(
    "[AI API 오마카세] 아이디·비밀번호 찾기 문의",
  )}&body=${encodeURIComponent(
    "가입 이메일:\n가입 사용자명(알고 계신 경우):\n문의 내용:\n",
  )}`;

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
      const { access_token, user_id } = await login({ email, password });
      setToken(access_token);
      setUserId(user_id);
      const nextPath = redirectPath ?? "/profile?firstRun=1";
      if (onSuccess) {
        onSuccess(nextPath);
      } else {
        router.push(nextPath);
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

      <div className="mb-8 mt-4">
        <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
          첫 실행
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight text-[#08090d]">
          첫 실행 흐름으로 돌아가기
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/56">
          로그인 후 API key, 실행 코드, 플레이그라운드가 한 화면에서 이어집니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-medium text-black/70"
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
            className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-sm font-medium text-black/70"
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
            className="w-full rounded-lg border border-black/[0.08] bg-white px-4 py-3 text-foreground placeholder:text-black/32 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/[0.04] disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#08090d] py-3 font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "작업 공간을 여는 중..." : "첫 실행으로 계속하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-black/52">
        계정이 없으신가요?{" "}
        <Link
          href={redirectPath ? `/signup?redirect=${encodeURIComponent(redirectPath)}` : "/signup"}
          scroll={false}
          onClick={() => sessionStorage.setItem("modalScrollY", String(window.scrollY))}
          className="font-medium text-accent hover:underline"
        >
          회원가입
        </Link>
      </p>

      <p className="mt-3 text-center text-xs leading-5 text-black/44">
        아이디 또는 비밀번호를 잊으셨다면{" "}
        <a
          href={recoveryMailto}
          className="font-medium text-accent hover:underline"
        >
          help@kogrobo.com
        </a>
        으로 문의해 주세요. 운영팀이 본인 확인 후 안내해 드립니다.
      </p>
    </div>
  );
}
