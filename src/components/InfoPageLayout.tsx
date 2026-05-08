import type { ReactNode } from "react";
import Link from "next/link";

type InfoRow = {
  label: string;
  value: ReactNode;
};

type InfoSection = {
  title: string;
  rows?: InfoRow[];
  content?: ReactNode;
};

type InfoPageLayoutProps = {
  title: string;
  currentLabel: string;
  sections: InfoSection[];
};

export function InfoPageLayout({
  title,
  currentLabel,
  sections,
}: InfoPageLayoutProps) {
  return (
    <main className="min-h-[calc(100vh-220px)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        {/* 브레드크럼 */}
        <div className="flex justify-end text-sm text-foreground/40">
          <div className="flex items-center gap-2">
            <Link href="/" className="transition-colors hover:text-foreground/70">
              홈
            </Link>
            <span className="text-foreground/25">/</span>
            <span className="font-medium text-foreground/65">{currentLabel}</span>
          </div>
        </div>

        {/* 제목 */}
        <div className="pt-10 md:pt-14">
          <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
        </div>

        {/* 섹션 */}
        <div className="mt-16 space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="border-b border-wood/20 pb-4">
                <h2 className="text-xl font-semibold text-foreground/90">
                  {section.title}
                </h2>
              </div>

              {section.rows?.length ? (
                <div className="mt-6 overflow-hidden border-t-2 border-wood/22">
                  <div className="divide-y divide-wood/8 border-x border-b border-wood/10">
                    {section.rows.map((row) => (
                      <div key={row.label} className="grid md:grid-cols-[180px_1fr]">
                        <div className="bg-surface px-5 py-5 text-sm font-medium text-foreground/60">
                          {row.label}
                        </div>
                        <div className="px-5 py-5 text-sm leading-7 text-foreground/75">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {section.content ? (
                <div className="mt-6 rounded-xl border border-wood/12 bg-surface px-5 py-6 text-sm leading-7 text-foreground/70 md:px-7">
                  {section.content}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
