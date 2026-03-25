"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, removeToken } from "@/lib/token";

const API_ENDPOINTS = [
  {
    name: "Embedding",
    method: "POST",
    path: "/api/v1/embedding",
    description: "텍스트를 벡터로 변환합니다.",
  },
  {
    name: "Re-ranking",
    method: "POST",
    path: "/api/v1/rerank",
    description: "검색 결과의 관련도를 재정렬합니다.",
  },
  {
    name: "TTS",
    method: "POST",
    path: "/api/v1/tts",
    description: "텍스트를 음성으로 변환합니다.",
  },
];

export default function DocsPage() {
  const router = useRouter();
  const hasToken = !!getToken();

  return (
    <div className="min-h-screen bg-grid-pattern">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-accent">GPU</span>
            <span className="font-mono text-lg font-medium text-foreground/90">Modu</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              홈
            </Link>
            <Link
              href="/api-test"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              API 체험
            </Link>
            <Link
              href="/plans"
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              플랜
            </Link>
            <span
              aria-disabled="true"
              className="cursor-not-allowed text-sm text-foreground/35"
            >
              API 문서
            </span>
            {hasToken ? (
              <button
                type="button"
                onClick={() => {
                  removeToken();
                  router.push("/");
                  router.refresh();
                }}
                className="text-sm text-foreground/70 transition-colors hover:text-accent"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                시작하기
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            API 문서
          </h1>
          <p className="mt-4 text-foreground/70">
            GPUModu API를 사용하려면 요청 헤더에 발급받은 액세스 토큰을 포함하세요.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-surface/50 p-4 font-mono text-sm">
            <p className="text-foreground/60">Authorization: Bearer {"<your_access_token>"}</p>
          </div>
        </div>

        <section className="space-y-8">
          {API_ENDPOINTS.map((api) => (
            <div
              key={api.name}
              className="rounded-2xl border border-white/5 bg-surface/50 p-6"
            >
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                {api.name}
              </h2>
              <p className="mb-4 text-foreground/60">{api.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-accent/20 px-2 py-1 font-mono text-sm text-accent">
                  {api.method}
                </span>
                <code className="rounded-lg bg-background/50 px-2 py-1 font-mono text-sm text-foreground/80">
                  {api.path}
                </code>
              </div>
            </div>
          ))}
        </section>

        <p className="mt-12 text-center text-sm text-foreground/50">
          추가 API는 지속적으로 확장됩니다.
        </p>
      </main>
    </div>
  );
}
