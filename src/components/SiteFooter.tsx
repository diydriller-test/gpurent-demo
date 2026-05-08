import Link from "next/link";

const FOOTER_NAV = [
  { label: "회사소개", href: "/company" },
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "이용안내", href: "/guide" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-wood/12 bg-surface px-6 py-8 md:py-9">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-[13px] text-foreground/45">
          {FOOTER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/75"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div>
            <h3 className="text-[1.85rem] font-semibold tracking-tight text-foreground/80">
              AI API 오마카세
            </h3>
            <div className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-foreground/45 md:text-sm">
              <p className="font-semibold text-foreground/60">서비스 기본정보</p>
              <p>
                <span className="font-medium text-foreground/55">상호명</span>{" "}
                주식회사 코그로보
                <span className="mx-2 text-foreground/20">|</span>
                <span className="font-medium text-foreground/55">대표자</span>{" "}
                정항덕
              </p>
              <p>
                <span className="font-medium text-foreground/55">사업장 주소</span>{" "}
                08547 서울특별시 금천구 남부순환로 1384 영남빌딩 4층 402호
              </p>
              <p>
                <span className="font-medium text-foreground/55">사업자 등록번호</span>{" "}
                3998801800
              </p>
              <p>
                <span className="font-medium text-foreground/55">통신판매업 신고번호</span>{" "}
                2023-서울금천-1423
                <span className="mx-2 text-foreground/20">|</span>
                <span className="font-medium text-foreground/55">개인정보보호책임자</span>{" "}
                정항덕
              </p>
            </div>
          </div>

          <div className="pt-[2.85rem]">
            <p className="font-semibold text-foreground/60">고객센터 정보</p>
            <div className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-foreground/45 md:text-sm">
              <p>
                <span className="font-medium text-foreground/55">상담 / 주문 이메일</span>
                <br />
                <a
                  href="mailto:help@kogrobo.com"
                  className="text-foreground/45 transition-colors hover:text-accent"
                >
                  help@kogrobo.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[13px] text-foreground/30 md:text-sm">
          Copyright © {new Date().getFullYear()} AI API 오마카세. All Rights
          Reserved.
        </p>
      </div>
    </footer>
  );
}
