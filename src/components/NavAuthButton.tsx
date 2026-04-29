"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, removeToken } from "@/lib/token";

export function NavAuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loginHref = pathname
    ? `/login?redirect=${encodeURIComponent(pathname)}`
    : "/login";

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!getToken());
  }, []);

  function handleLogout() {
    removeToken();
    setIsLoggedIn(false);
    router.refresh();
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={loginHref}
          className="rounded-lg border border-white/25 bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground/95 transition-colors hover:border-accent/45 hover:bg-accent/5 hover:text-accent"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          회원가입
        </Link>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="rounded-lg border border-white/20 bg-white/[0.02] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/45 hover:bg-accent/5 hover:text-accent"
        >
          프로필
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-200"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={loginHref}
        className="rounded-lg border border-white/25 bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground/95 transition-colors hover:border-accent/45 hover:bg-accent/5 hover:text-accent"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        회원가입
      </Link>
    </div>
  );
}
