import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI API 오마카세 | 셰프 추천 코스처럼 고르는 AI API",
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
      <head>
        {/* 나눔명조 — 한국어 명조 완전 지원 (next/font는 latin만 지원하여 직접 로드) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        {modal}
        <SiteFooter />
      </body>
    </html>
  );
}
