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
    <main className="min-h-[calc(100vh-220px)] bg-white text-[#1f1f1f]">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        <div className="flex justify-end text-sm text-[#7a7a7a]">
          <div className="flex items-center gap-2">
            <Link href="/" className="transition-colors hover:text-[#222]">
              홈
            </Link>
            <span>/</span>
            <span className="font-medium text-[#222]">{currentLabel}</span>
          </div>
        </div>

        <div className="pt-10 md:pt-14">
          <h1 className="text-center text-4xl font-semibold tracking-tight text-[#151515] md:text-5xl">
            {title}
          </h1>
        </div>

        <div className="mt-16 space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="border-b border-[#2d2d2d] pb-4">
                <h2 className="text-xl font-semibold text-[#222]">{section.title}</h2>
              </div>

              {section.rows?.length ? (
                <div className="mt-6 overflow-hidden border-t-2 border-[#2d2d2d]">
                  <div className="divide-y divide-[#ececec] border-x border-b border-[#ececec]">
                    {section.rows.map((row) => (
                      <div key={row.label} className="grid md:grid-cols-[180px_1fr]">
                        <div className="bg-[#f7f7f7] px-5 py-5 text-sm font-medium text-[#444]">
                          {row.label}
                        </div>
                        <div className="px-5 py-5 text-sm leading-7 text-[#3a3a3a]">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {section.content ? (
                <div className="mt-6 rounded-none border border-[#ececec] bg-white px-5 py-6 text-sm leading-7 text-[#3a3a3a] md:px-7">
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
