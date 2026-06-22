"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NavAuthButton } from "@/components/NavAuthButton";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "플랫폼" },
  { href: "/api-test", label: "워크벤치" },
  { href: "/plans", label: "요금제" },
  { href: "/docs", label: "Docs" },
];

export function SiteNav({
  fixed = false,
}: {
  fixed?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(id);
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
        "border-b border-black/[0.06] bg-white/88 backdrop-blur-xl",
      ].join(" ")}
    >
      <div className="flex h-[72px] w-full items-center px-5 md:px-8 lg:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          onClick={() => {
            if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Image src="/icon.png" alt="로고" width={28} height={28} className="rounded-md" />
          <span className="text-[15px] font-semibold leading-none tracking-normal text-[#08090d]">
            AI API Omakase
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-1 rounded-lg border border-black/[0.06] bg-black/[0.025] p-1">
            {NAV_ITEMS.map((item) =>
              item.href === activeHref ? (
                <span
                  key={item.href}
                  aria-current="page"
                  className="rounded-md bg-white px-3 py-1.5 text-[13px] font-medium text-[#08090d] shadow-[0_1px_2px_rgba(8,9,13,0.04)]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-[13px] font-medium text-black/48 transition-colors hover:text-black/78"
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

        <div className="ml-auto flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileOpen}
            className="rounded-lg border border-black/[0.08] bg-white p-2 text-black/55 shadow-[0_1px_2px_rgba(8,9,13,0.04)] transition-colors hover:border-black/20 hover:text-black"
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
          <div className="border-t border-black/[0.06] bg-white/95 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) =>
                  item.href === activeHref ? (
                    <span
                      key={item.href}
                      aria-current="page"
                      className="rounded-lg border border-black/[0.08] bg-black/[0.04] px-4 py-3 text-sm font-medium text-[#08090d]"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg border border-black/[0.06] bg-white px-4 py-3 text-sm font-medium text-black/56 transition-colors hover:border-black/14 hover:text-black"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
              <div className="mt-4 border-t border-black/[0.06] pt-4">
                <NavAuthButton mobile />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
