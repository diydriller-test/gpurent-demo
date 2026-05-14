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
    const id = window.setTimeout(() => {
      setMounted(true);
      setIsLoggedIn(!!getToken());
    }, 0);
    return () => window.clearTimeout(id);
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
            className="flex-1 rounded-lg border border-black/[0.08] bg-white py-3 text-center text-sm font-medium text-black/58 transition-colors hover:border-black/18 hover:text-black"
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => handleAuthNav("/signup")}
            className="flex-1 rounded-lg bg-[#08090d] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
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
          className="flex-1 rounded-lg border border-black/[0.08] bg-white py-3 text-center text-sm font-medium text-black/58 transition-colors hover:border-black/18 hover:text-black"
        >
          프로필
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 rounded-lg border border-black/[0.08] bg-white py-3 text-center text-sm font-medium text-black/42 transition-colors hover:border-red-400/30 hover:text-red-500"
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
          className="text-[13px] font-medium text-black/48 transition-colors hover:text-black/78"
        >
          프로필
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-[13px] font-medium text-black/44 shadow-[0_1px_2px_rgba(8,9,13,0.04)] transition-colors hover:border-red-400/35 hover:text-red-500"
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
        className="text-[13px] font-medium text-black/48 transition-colors hover:text-black/78"
      >
        로그인
      </button>
      <button
        type="button"
        onClick={() => handleAuthNav("/signup")}
        className="rounded-lg bg-[#08090d] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(8,9,13,0.10)] transition-colors hover:bg-black"
      >
        회원가입
      </button>
    </div>
  );
}
