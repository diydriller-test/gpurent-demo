import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI API 오마카세 | 필요한 AI API를 테스트하고 선택하세요",
  description:
    "필요한 API만 골라 쓰는 AI API 오마카세. 임베딩, 리랭킹, TTS 등 다양한 API를 RPS 기반으로 이용하세요.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
        {modal}
        <SiteFooter />
      </body>
    </html>
  );
}
