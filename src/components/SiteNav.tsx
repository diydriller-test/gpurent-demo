"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NavAuthButton } from "@/components/NavAuthButton";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈" },
  { href: "/api-test", label: "API 체험" },
  { href: "/plans", label: "플랜" },
  { href: "/docs", label: "API 문서" },
];

export function SiteNav({
  fixed = false,
}: {
  fixed?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeHref = useMemo(() => {
    if (!pathname) return null;
    const exact = NAV_ITEMS.find((i) => i.href === pathname);
    if (exact) return exact.href;
    const prefix = NAV_ITEMS.find(
      (i) => i.href !== "/" && pathname.startsWith(i.href),
    );
    return prefix?.href ?? null;
  }, [pathname]);

  return (
    <nav
      className={[
        fixed ? "fixed top-0 left-0 right-0 z-50" : "",
        "border-b border-white/[0.06] bg-black backdrop-blur-xl",
      ].join(" ")}
    >
      <div className="flex h-[70px] w-full items-center px-4 md:px-10">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-baseline gap-x-1.5">
            <span className="font-serif text-[22px] tracking-wide text-white" style={{fontWeight: 900}}>
              AI API
            </span>
            <span className="font-serif text-[22px] tracking-wide text-white" style={{fontWeight: 900}}>
              오마카세
            </span>
          </div>
        </Link>

        {/* 데스크탑 — 네비 중앙, 인증 우측 */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-9">
            {NAV_ITEMS.map((item) =>
              item.href === activeHref ? (
                <span
                  key={item.href}
                  aria-current="page"
                  className="text-[15px] font-medium text-white/90"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[15px] font-normal text-white/55 transition-colors hover:text-white/85"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
        <div className="hidden shrink-0 md:flex">
          <NavAuthButton />
        </div>

        {/* 모바일 햄버거 */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            className="rounded-lg border border-white/12 bg-white/[0.04] p-2 text-white/55 transition-colors hover:border-white/25 hover:text-white/85"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden">
          <div className="border-t border-white/6 bg-black backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) =>
                  item.href === activeHref ? (
                    <span
                      key={item.href}
                      aria-current="page"
                      className="rounded-xl border border-white/14 bg-white/[0.07] px-4 py-3 text-sm font-medium text-white/88"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-white/7 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/55 transition-colors hover:border-white/18 hover:bg-white/[0.05] hover:text-white/85"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
              <div className="mt-4 border-t border-white/6 pt-4">
                <NavAuthButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
