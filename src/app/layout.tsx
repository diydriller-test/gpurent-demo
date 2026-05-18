import type { Metadata } from "next";
import { BehaviorTracker } from "@/components/BehaviorTracker";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI API 오마카세 | 필요한 AI API를 테스트하고 선택하세요",
  description: "AI API 오마카세로 AI 에이전트 개발을 손쉽게",
  keywords: ["AI API", "Agent", "MCP", "A2A"],
  authors: [{ name: "주식회사 코그로보" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    title: "AI API 오마카세",
    description: "AI API 오마카세로 AI 에이전트 개발을 손쉽게",
    url: "https://aiapi.kogrobo.com/",
    images: [{ url: "https://aiapi.kogrobo.com/og.png" }],
  },
  other: {
    Yeti: "index, follow",
    Daumoa: "index, follow",
    Zumbot: "index, follow",
  },
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
        <BehaviorTracker />
        {children}
        {modal}
        <SiteFooter />
      </body>
    </html>
  );
}
