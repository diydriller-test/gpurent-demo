"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, removeToken } from "@/lib/token";

export function NavAuthButton() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  function handleLogout() {
    removeToken();
    setIsLoggedIn(false);
    router.refresh();
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-6">
        <Link
          href="/profile"
          className="text-sm text-foreground/70 transition-colors hover:text-accent"
        >
          프로필
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/signup"
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
      시작하기
    </Link>
  );
}
