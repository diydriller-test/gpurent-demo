"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, removeToken } from "@/lib/token";

export function NavAuthButton({ mobile = false }: { mobile?: boolean }) {
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
  }, [pathname]);

  function handleLogout() {
    removeToken();
    setIsLoggedIn(false);
    router.refresh();
  }

  function handleAuthNav(href: string) {
    sessionStorage.setItem("modalScrollY", String(window.scrollY));
    router.push(href, { scroll: false });
  }

  if (mobile) {
    if (!mounted) {
      return (
        <div className="invisible flex gap-2" aria-hidden="true">
          <div className="flex-1 rounded-xl py-3" />
          <div className="flex-1 rounded-xl py-3" />
        </div>
      );
    }

    if (!isLoggedIn) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAuthNav(loginHref)}
            className="flex-1 rounded-xl border border-white/12 py-3 text-center text-sm font-medium text-white/65 transition-colors hover:border-white/25 hover:text-white/85"
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => handleAuthNav("/signup")}
            className="flex-1 rounded-xl bg-[#C8A96E] py-3 text-center text-sm font-semibold text-[#1A0A00] transition-all hover:bg-[#D4B87A]"
          >
            회원가입
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <Link
          href="/profile"
          className="flex-1 rounded-xl border border-white/12 py-3 text-center text-sm font-medium text-white/65 transition-colors hover:border-white/25 hover:text-white/85"
        >
          프로필
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 rounded-xl border border-white/12 py-3 text-center text-sm font-medium text-white/45 transition-colors hover:border-red-400/30 hover:text-red-300/80"
        >
          로그아웃
        </button>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="invisible flex items-center gap-5" aria-hidden="true">
        <span className="text-[15px] font-normal">로그인</span>
        <span className="rounded-xl px-5 py-2 text-[15px] font-semibold">회원가입</span>
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
      <button
        type="button"
        onClick={() => handleAuthNav(loginHref)}
        className="text-[15px] font-normal text-white/55 transition-colors hover:text-white/85"
      >
        로그인
      </button>
      <button
        type="button"
        onClick={() => handleAuthNav("/signup")}
        className="rounded-xl bg-[#C8A96E] px-5 py-2 text-[15px] font-semibold text-[#1A0A00] transition-all hover:bg-[#D4B87A]"
      >
        회원가입
      </button>
    </div>
  );
}
