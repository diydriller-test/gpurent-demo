"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMe, getApiKeys, createApiKey, regenerateApiKey, type User, type ApiKey } from "@/lib/api";
import { getToken } from "@/lib/token";
import { SiteNav } from "@/components/SiteNav";

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return key.slice(0, 4) + "•".repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
}

function NewlyCreatedKeyBox({
  apiKey,
  message,
  onDismiss,
}: {
  apiKey: string;
  message: string;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const displayKey = visible ? apiKey : maskKey(apiKey);

  return (
    <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
      <p className="mb-2 text-sm font-medium text-accent">{message}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded bg-background/50 px-3 py-2">
          <code className="break-all font-mono text-sm text-foreground">
            {displayKey}
          </code>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="shrink-0 rounded p-1.5 text-foreground/50 transition-colors hover:bg-white/5 hover:text-foreground/80"
            title={visible ? "숨기기" : "보기"}
            aria-label={visible ? "숨기기" : "보기"}
          >
            {visible ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(apiKey);
            onDismiss();
          }}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          복사 후 닫기
        </button>
      </div>
    </div>
  );
}

function ApiKeyItem({ apiKey }: { apiKey: ApiKey }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  async function handleCopy() {
    if (!apiKey.api_key) return;
    await navigator.clipboard.writeText(apiKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayKey = visible ? apiKey.api_key : maskKey(apiKey.api_key);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-background/30 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-foreground/90 break-all">
            {displayKey}
          </p>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="shrink-0 rounded p-1.5 text-foreground/50 transition-colors hover:bg-white/5 hover:text-foreground/80"
            title={visible ? "숨기기" : "보기"}
            aria-label={visible ? "숨기기" : "보기"}
          >
            {visible ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/50">
          <span>생성일: {new Date(apiKey.created_at).toLocaleDateString("ko-KR")}</span>
          {apiKey.last_used_at && (
            <span>마지막 사용: {new Date(apiKey.last_used_at).toLocaleDateString("ko-KR")}</span>
          )}
          {!apiKey.is_approved && (
            <span className="text-red-400">미승인</span>
          )}
        </div>
      </div>
      {apiKey.api_key && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-accent/20 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ api_key: string; message: string } | null>(null);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!getToken()) {
      router.replace("/login?redirect=%2Fprofile");
      return;
    }

    try {
      const me = await getMe();
      setUser(me);
      try {
        const keys = await getApiKeys();
        setApiKeys(keys);
      } catch {
        setApiKeys([]);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.replace("/login?redirect=%2Fprofile");
      } else {
        setError(err instanceof Error ? err.message : "프로필을 불러올 수 없습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!regenerateConfirmOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setRegenerateConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerateConfirmOpen]);

  async function handleCreateApiKey() {
    setCreateError(null);
    setNewlyCreatedKey(null);
    setIsCreating(true);
    try {
      const result = await createApiKey();
      setNewlyCreatedKey({ api_key: result.api_key, message: result.message });
      await fetchData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "API 키 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  }

  async function executeRegenerateApiKey() {
    setRegenerateConfirmOpen(false);
    setCreateError(null);
    setNewlyCreatedKey(null);
    setIsRegenerating(true);
    try {
      const result = await regenerateApiKey();
      setNewlyCreatedKey({ api_key: result.api_key, message: result.message });
      await fetchData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "API 키 재생성에 실패했습니다.");
    } finally {
      setIsRegenerating(false);
    }
  }

  const hasPlan = (user?.api_plans?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grid-pattern">
        <SiteNav fixed />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-grid-pattern">
        <SiteNav fixed />
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
            <p className="text-red-400">{error ?? "프로필을 불러올 수 없습니다."}</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-accent px-6 py-2 font-medium text-background hover:opacity-90"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-pattern">
      {regenerateConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="regenerate-api-key-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="닫기"
            onClick={() => setRegenerateConfirmOpen(false)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-white/10 bg-surface/95 p-6 shadow-xl backdrop-blur-xl">
            <h2
              id="regenerate-api-key-modal-title"
              className="text-lg font-semibold text-foreground"
            >
              API 키를 재생성할까요?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">
              재생성하면 <span className="text-foreground/90">기존 키는 즉시 사용할 수 없게</span> 됩니다. 연결된 클라이언트는 새 키로
              교체해야 합니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setRegenerateConfirmOpen(false)}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/5"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void executeRegenerateApiKey()}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                재생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <SiteNav />

      {/* Main */}
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-8 text-3xl font-bold text-foreground">프로필</h1>

        <div className="space-y-6 rounded-2xl border border-white/5 bg-surface/80 p-8">
          <div>
            <p className="text-sm text-foreground/50">사용자명</p>
            <p className="mt-1 text-lg font-medium text-foreground">{user.username}</p>
          </div>
          <div>
            <p className="text-sm text-foreground/50">이메일</p>
            <p className="mt-1 text-lg font-medium text-foreground">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-foreground/50">가입일</p>
            <p className="mt-1 text-lg font-medium text-foreground">
              {new Date(user.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/5 bg-surface/80 p-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">API 키</h2>

          {createError && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {createError}
            </div>
          )}

          {newlyCreatedKey ? (
            <NewlyCreatedKeyBox
              apiKey={newlyCreatedKey.api_key}
              message={newlyCreatedKey.message}
              onDismiss={() => setNewlyCreatedKey(null)}
            />
          ) : apiKeys.length > 0 ? (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <ApiKeyItem key={apiKey.id} apiKey={apiKey} />
              ))}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRegenerateConfirmOpen(true)}
                  disabled={isRegenerating}
                  className="rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegenerating ? "재생성 중..." : "키 재생성"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-foreground/60">등록된 API 키가 없습니다.</p>
              {hasPlan ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleCreateApiKey}
                    disabled={isCreating}
                    className="rounded-xl bg-accent px-6 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "생성 중..." : "API 키 생성"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-foreground/50">
                    API 키를 생성하려면 먼저 플랜을 선택해주세요.
                  </p>
                  <Link
                    href="/plans"
                    className="mt-4 inline-block text-sm text-accent hover:underline"
                  >
                    플랜 선택하기 →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-white/5 bg-surface/80 p-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">이용 중인 API</h2>
          {(user.api_plans?.length ?? 0) > 0 ? (
            <ul className="space-y-4">
              {[...(user.api_plans ?? [])]
                .sort((a, b) => a.api_name.localeCompare(b.api_name, "ko"))
                .map((ap) => (
                  <li
                    key={`${ap.api_id}-${ap.plan_id}`}
                    className="rounded-xl border border-white/5 bg-background/20 px-4 py-4"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{ap.api_name}</p>
                        <p className="text-sm text-foreground/50">{ap.company_name}</p>
                      </div>
                      <div className="text-sm text-foreground/70 sm:text-right">
                        <span className="font-medium text-accent">{ap.plan_name}</span>
                        <span className="text-foreground/40"> · </span>
                        <span>최대 {ap.max_rps} RPS</span>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <div>
              <p className="text-foreground/60">아직 구독 중인 API가 없습니다.</p>
              <Link
                href="/plans"
                className="mt-4 inline-block text-sm text-accent hover:underline"
              >
                플랜 선택하기 →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
