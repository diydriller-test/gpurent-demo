"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMe, getApiKeys, createApiKey, regenerateApiKey, type User, type ApiKey } from "@/lib/api";
import { getToken } from "@/lib/token";
import {
  PlatformButton,
  PlatformCard,
  PlatformPageHeader,
  PlatformShell,
} from "@/components/platform/PlatformShell";

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
    <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
      <p className="mb-2 text-sm font-medium text-accent">{message}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/[0.06] bg-background px-3 py-2">
          <code className="break-all font-mono text-sm text-foreground">
            {displayKey}
          </code>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="shrink-0 rounded p-1.5 text-black/42 transition-colors hover:bg-black/[0.04] hover:text-black/78"
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
          className="shrink-0 rounded-lg bg-[#08090d] px-4 py-2 text-sm font-medium text-white hover:bg-black"
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-foreground/90 break-all">
            {displayKey}
          </p>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="shrink-0 rounded p-1.5 text-black/42 transition-colors hover:bg-black/[0.04] hover:text-black/78"
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
          className="shrink-0 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      )}
    </div>
  );
}

function FirstRunCodeBlock({
  apiKey,
  hasKey,
}: {
  apiKey?: string;
  hasKey: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const keyLine = apiKey
    ? `export AI_OMAKASE_API_KEY="${apiKey}"`
    : `export AI_OMAKASE_API_KEY="<your_api_key>"`;
  const code = `${keyLine}

curl -X POST "$AI_OMAKASE_BASE_URL/api/chat" \\
  -H "Authorization: Bearer $AI_OMAKASE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "Write a concise launch plan for an AI support assistant.",
    "temperature": 0.1
  }'`;

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-[#0b0c10] text-white shadow-[0_18px_70px_rgba(8,9,13,0.10)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-normal text-white/44">
          {hasKey ? "실행 준비 완료" : "1분 예제"}
        </p>
        <button
          type="button"
          onClick={copyCode}
          aria-label="첫 API 호출 코드 복사"
          className="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[11px] text-white/68 transition-colors hover:border-white/24 hover:text-white"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-white/82 md:text-[13px]">
        {code}
      </pre>
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
      setCreateError(err instanceof Error ? err.message : "API key 생성에 실패했습니다.");
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
      setCreateError(err instanceof Error ? err.message : "API key 재생성에 실패했습니다.");
    } finally {
      setIsRegenerating(false);
    }
  }

  const primaryApiKey = newlyCreatedKey?.api_key ?? apiKeys[0]?.api_key;
  const hasApiKey = Boolean(primaryApiKey);

  if (isLoading) {
    return (
      <PlatformShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </PlatformShell>
    );
  }

  if (error || !user) {
    return (
      <PlatformShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="platform-card max-w-md rounded-xl p-8 text-center">
            <p className="text-red-400">{error ?? "프로필을 불러올 수 없습니다."}</p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-lg bg-[#08090d] px-6 py-2 font-medium text-white hover:bg-black"
            >
              홈으로
            </Link>
          </div>
        </div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      {regenerateConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="regenerate-api-key-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="닫기"
            onClick={() => setRegenerateConfirmOpen(false)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <h2
              id="regenerate-api-key-modal-title"
              className="text-lg font-semibold text-foreground"
            >
              API key를 재생성할까요?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">
              재생성하면 <span className="text-foreground/90">기존 API key는 즉시 사용할 수 없게</span> 됩니다. 연결된 클라이언트는 새 API key로
              교체해야 합니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setRegenerateConfirmOpen(false)}
                className="rounded-lg border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-black/[0.04]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void executeRegenerateApiKey()}
                className="rounded-lg bg-[#08090d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                재생성
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl pb-16">
        <PlatformPageHeader
          eyebrow="시작"
          title="첫 API를 실행해보세요."
          description="계정 설정을 오래 훑지 않아도 됩니다. API key를 만들고, 1분 예제를 복사하거나 플레이그라운드에서 바로 결과를 확인하세요."
          action={
            <div className="flex flex-wrap gap-2">
              <PlatformButton href="/api-test?api=llm">플레이그라운드 사용해보기</PlatformButton>
              <PlatformButton href="/docs" variant="secondary">
                API docs 보기
              </PlatformButton>
            </div>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <PlatformCard className="flex flex-col justify-between gap-8 p-6 md:p-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                첫 실행
              </p>
              <h2 className="mt-4 max-w-lg text-[30px] font-semibold leading-tight text-[#08090d] md:text-[40px]">
                설정보다 먼저, 동작하는 결과를 확인하세요.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-black/56">
                신규 사용자는 이 화면에서 계정, API key, 실행 예제를 한 번에 확인합니다.
                복잡한 설정은 첫 결과를 본 뒤로 미뤄도 됩니다.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                {
                  label: "01",
                  title: "계정 준비 완료",
                  body: `${user.username} 계정으로 로그인되어 있습니다.`,
                  done: true,
                },
                {
                  label: "02",
                  title: "API key",
                  body: hasApiKey
                    ? "호출에 사용할 API key가 준비되었습니다."
                    : "API key 발급 버튼을 누르면 바로 첫 호출 코드에 연결됩니다.",
                  done: hasApiKey,
                },
                {
                  label: "03",
                  title: "첫 실행",
                  body: "플레이그라운드에서 실행하거나 아래 cURL을 복사해 터미널에서 테스트합니다.",
                  done: false,
                },
              ].map((step) => (
                <div
                  key={step.label}
                  className="grid grid-cols-[44px_1fr_auto] items-start gap-4 border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0"
                >
                  <span className="font-mono text-[12px] text-accent">
                    {step.label}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#08090d]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-black/52">
                      {step.body}
                    </p>
                  </div>
                  <span
                    className={[
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      step.done ? "bg-accent" : "bg-black/14",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </PlatformCard>

          <PlatformCard className="p-6 md:p-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                  시작 지점
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#08090d]">
                  바로 시작하기
                </h2>
                <p className="mt-2 text-sm leading-6 text-black/52">
                  API key가 없으면 먼저 생성하고, 준비되어 있으면 바로 실행으로 넘어갑니다.
                </p>
              </div>
              {!hasApiKey ? (
                <button
                  type="button"
                  onClick={handleCreateApiKey}
                  disabled={isCreating}
                  className="rounded-lg bg-[#08090d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "발급 중..." : "API key 발급"}
                </button>
              ) : (
                <PlatformButton href="/api-test?api=llm">플레이그라운드 사용해보기</PlatformButton>
              )}
            </div>

            {createError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {createError}
              </div>
            )}

            {newlyCreatedKey ? (
              <NewlyCreatedKeyBox
                apiKey={newlyCreatedKey.api_key}
                message="API key가 발급되었습니다. 지금 복사한 뒤 아래 예제를 실행해보세요."
                onDismiss={() => setNewlyCreatedKey(null)}
              />
            ) : null}

            <FirstRunCodeBlock apiKey={primaryApiKey} hasKey={hasApiKey} />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/api-test?api=llm"
                className="rounded-xl border border-black/[0.06] bg-background p-4 transition-colors hover:bg-black/[0.025]"
              >
                <p className="text-sm font-semibold text-[#08090d]">
                  플레이그라운드 사용해보기
                </p>
                <p className="mt-1 text-sm leading-6 text-black/52">
                  원하는 API를 선택하고 Playground에서 결과를 확인합니다.
                </p>
              </Link>
              <Link
                href="/docs#quickstart"
                className="rounded-xl border border-black/[0.06] bg-background p-4 transition-colors hover:bg-black/[0.025]"
              >
                <p className="text-sm font-semibold text-[#08090d]">
                  예제 더 보기
                </p>
                <p className="mt-1 text-sm leading-6 text-black/52">
                  TypeScript, Python 예제로 바로 연결합니다.
                </p>
              </Link>
            </div>
          </PlatformCard>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <PlatformCard>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                  API key
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  API keys
                </h2>
              </div>
              {apiKeys.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setRegenerateConfirmOpen(true)}
                  disabled={isRegenerating}
                  className="rounded-lg border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegenerating ? "재생성 중..." : "키 재생성"}
                </button>
              ) : null}
            </div>

            {apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <ApiKeyItem key={apiKey.id} apiKey={apiKey} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-black/[0.12] bg-background p-5">
                <p className="text-sm font-medium text-[#08090d]">
                  아직 API key가 없습니다.
                </p>
                <p className="mt-2 text-sm leading-6 text-black/52">
                  위의 API key 발급 버튼을 눌러 첫 실행 코드에 사용할 키를 발급하세요.
                  계정 상태에 따라 플랜 선택이 필요하면 같은 자리에서 안내됩니다.
                </p>
              </div>
            )}
          </PlatformCard>

          <PlatformCard>
            <div className="mb-5">
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                계정
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                작업 공간
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground/50">사용자명</p>
                <p className="mt-1 text-lg font-medium text-foreground">
                  {user.username}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground/50">이메일</p>
                <p className="mt-1 break-all text-lg font-medium text-foreground">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground/50">가입일</p>
                <p className="mt-1 text-lg font-medium text-foreground">
                  {new Date(user.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
          </PlatformCard>
        </div>

        <PlatformCard className="mt-6">
          <div className="mb-5">
            <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
              사용 현황
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              사용 중인 API
            </h2>
          </div>
          {(user.api_plans?.length ?? 0) > 0 ? (
            <ul className="space-y-4">
              {[...(user.api_plans ?? [])]
                .sort((a, b) => a.api_name.localeCompare(b.api_name, "ko"))
                .map((ap) => (
                  <li
                    key={`${ap.api_id}-${ap.plan_id}`}
                    className="rounded-xl border border-black/[0.06] bg-background px-4 py-4"
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
        </PlatformCard>
      </main>
    </PlatformShell>
  );
}
