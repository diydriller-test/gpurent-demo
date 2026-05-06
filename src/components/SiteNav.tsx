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
    // exact match first, then prefix match
    const exact = NAV_ITEMS.find((i) => i.href === pathname);
    if (exact) return exact.href;
    const prefix = NAV_ITEMS.find((i) => i.href !== "/" && pathname.startsWith(i.href));
    return prefix?.href ?? null;
  }, [pathname]);

  return (
    <nav
      className={[
        fixed ? "fixed top-0 left-0 right-0 z-50" : "",
        "border-b border-wood/15 bg-background/85 backdrop-blur-xl",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-lg font-bold tracking-tight text-accent text-omakase-neon">
            AI API
          </span>
          <span className="font-mono text-lg font-medium text-wood">오마카세</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          <div className="flex items-center gap-5">
            {NAV_ITEMS.map((item) =>
              item.href === activeHref ? (
                <span
                  key={item.href}
                  aria-current="page"
                  className="rounded-lg border border-accent/35 bg-accent/10 px-2.5 py-1.5 text-sm font-medium text-accent"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-foreground/70 transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
          <NavAuthButton />
        </div>

        {/* Mobile */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            className="rounded-lg border border-white/15 bg-white/[0.02] p-2 text-foreground/80 transition-colors hover:border-accent/45 hover:bg-accent/5 hover:text-accent"
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

      {mobileOpen && (
        <div className="md:hidden">
          <div className="border-t border-white/10 bg-background/70 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) =>
                  item.href === activeHref ? (
                    <span
                      key={item.href}
                      aria-current="page"
                      className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-accent"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-foreground/85 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <NavAuthButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

