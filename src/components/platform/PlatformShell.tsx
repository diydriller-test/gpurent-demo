"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";

const PLATFORM_NAV = [
  {
    href: "/api-test",
    label: "워크벤치",
    eyebrow: "Run",
  },
  {
    href: "/plans",
    label: "요금제",
    eyebrow: "Scale",
  },
  {
    href: "/docs",
    label: "Reference",
    eyebrow: "Build",
  },
  {
    href: "/profile",
    label: "계정",
    eyebrow: "Keys",
  },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformShell({
  children,
  sidebar,
  hideSidebar = false,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
  hideSidebar?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="platform-shell min-h-screen text-foreground">
      <SiteNav fixed />
      <div className="mx-auto flex max-w-[1500px] gap-0 px-4 pt-[72px] md:px-6 lg:px-8">
        {!hideSidebar ? (
        <aside className="hidden w-[228px] shrink-0 border-r border-black/[0.06] py-6 pr-5 lg:block">
          <div className="sticky top-[96px]">
            <div className="mb-5 px-2">
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                platform
              </p>
              <p className="mt-2 text-[13px] leading-5 text-black/50">
                API를 탐색하고, 테스트하고, 운영합니다.
              </p>
            </div>

            <nav aria-label="Platform navigation" className="space-y-1">
              {PLATFORM_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group grid grid-cols-[1fr_auto] items-center rounded-lg px-2.5 py-2.5 transition-colors",
                      active
                        ? "bg-black/[0.045] text-[#08090d]"
                        : "text-black/52 hover:bg-black/[0.035] hover:text-black/78",
                    ].join(" ")}
                  >
                    <span className="text-[14px] font-medium">
                      {item.label}
                    </span>
                    <span
                      className={[
                        "font-mono text-[10px] uppercase tracking-normal",
                        active ? "text-accent" : "text-black/28",
                      ].join(" ")}
                    >
                      {item.eyebrow}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {sidebar ? (
              <div className="mt-6 border-t border-black/[0.06] pt-6">
                {sidebar}
              </div>
            ) : null}
          </div>
        </aside>
        ) : null}

        <div
          className={[
            "min-w-0 flex-1 py-6",
            hideSidebar ? "" : "lg:pl-8",
          ].join(" ")}
        >
          {!hideSidebar ? (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {PLATFORM_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "shrink-0 rounded-lg border px-3 py-2 text-[13px] font-medium",
                    active
                      ? "border-black/[0.12] bg-white text-[#08090d]"
                      : "border-black/[0.06] bg-white/70 text-black/52",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export function PlatformPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-black/[0.06] pb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-3 font-mono text-[11px] uppercase tracking-normal text-black/36">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-[34px] font-semibold leading-[1.06] tracking-normal text-[#08090d] md:text-[46px] lg:text-[52px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-black/56">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function PlatformCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["platform-card rounded-xl p-5 md:p-6", className].join(" ")}>
      {children}
    </section>
  );
}

export function PlatformButton({
  children,
  href,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
}) {
  const classes = [
    "inline-flex h-10 items-center justify-center rounded-lg px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" ? "platform-button-primary" : "platform-button-secondary",
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
