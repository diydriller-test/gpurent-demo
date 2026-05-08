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
      <div className="flex items-center gap-5">
        <Link
          href={loginHref}
          className="text-[15px] font-normal text-white/55 transition-colors hover:text-white/85"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-xl bg-[#C8A96E] px-5 py-2 text-[15px] font-semibold text-[#1A0A00] transition-all hover:bg-[#D4B87A]"
        >
          지금 시작하기
        </Link>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-5">
        <Link
          href="/profile"
          className="text-[15px] font-normal text-white/55 transition-colors hover:text-white/85"
        >
          프로필
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/12 bg-transparent px-4 py-1.5 text-sm font-medium text-white/45 transition-colors hover:border-red-400/30 hover:text-red-300/80"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <Link
        href={loginHref}
        className="text-[15px] font-normal text-white/55 transition-colors hover:text-white/85"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="rounded-xl bg-[#C8A96E] px-5 py-2 text-[15px] font-semibold text-[#1A0A00] transition-all hover:bg-[#D4B87A]"
      >
        지금 시작하기
      </Link>
    </div>
  );
}
