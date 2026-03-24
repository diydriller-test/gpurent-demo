"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getApis, getPlans, getMe, updatePlan, type Api, type Plan, type User } from "@/lib/api";
import { getToken } from "@/lib/token";

function formatPrice(priceMonthly: string): string {
  const num = parseFloat(priceMonthly);
  if (isNaN(num) || num === 0) return "문의";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function PlansPage() {
  const [apis, setApis] = useState<Api[]>([]);
  const [selectedApi, setSelectedApi] = useState<Api | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planActionError, setPlanActionError] = useState<string | null>(null);
  const [updatingPlanId, setUpdatingPlanId] = useState<number | null>(null);

  const fetchUser = useCallback(async () => {
    if (!getToken()) {
      setUserLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        setUser(null);
      }
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    getApis()
      .then(setApis)
      .catch((err) => setError(err instanceof Error ? err.message : "API 목록을 불러올 수 없습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!selectedApi) {
      setPlans([]);
      return;
    }
    setPlansLoading(true);
    setError(null);
    getPlans(selectedApi.id)
      .then(setPlans)
      .catch((err) => setError(err instanceof Error ? err.message : "플랜을 불러올 수 없습니다."))
      .finally(() => setPlansLoading(false));
  }, [selectedApi]);

  function handleSelectApi(api: Api) {
    setSelectedApi(api);
  }

  function handleBack() {
    setSelectedApi(null);
    setPlans([]);
    setError(null);
  }

  async function handleSelectPlan(planId: number) {
    if (!selectedApi) return;
    setPlanActionError(null);
    setUpdatingPlanId(planId);
    try {
      await updatePlan(selectedApi.id, planId);
      await fetchUser();
    } catch (err) {
      setPlanActionError(
        err instanceof Error ? err.message : "플랜 변경에 실패했습니다."
      );
    } finally {
      setUpdatingPlanId(null);
    }
  }

  const hasToken = typeof window !== "undefined" && !!getToken();
  const isLoggedIn = user !== null;
  const isAuthChecking = hasToken && userLoading;

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
            {isLoggedIn || isAuthChecking ? (
              <>
                <Link
                  href="/docs"
                  className="text-sm text-foreground/70 transition-colors hover:text-accent"
                >
                  API 문서
                </Link>
                <span className="text-sm text-foreground/50">{user?.username ?? "..."}</span>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-foreground/70 transition-colors hover:text-accent"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {selectedApi ? `${selectedApi.name} 플랜 선택` : "API 선택"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
            {selectedApi
              ? "사용량에 맞는 등급을 선택하세요. 트래픽에 따라 API 사용량이 제한됩니다."
              : "플랜을 확인할 API를 선택하세요."}
          </p>
        </div>

        {selectedApi && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-8 flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            API 목록으로
          </button>
        )}

        {(isLoggedIn || isAuthChecking) && selectedApi && (
          <div className="mb-8 rounded-2xl border border-white/5 bg-surface/50 px-6 py-4">
            <p className="text-sm text-foreground/80">
              현재 플랜:{" "}
              <span className="font-medium text-accent">
                {userLoading
                  ? "확인 중..."
                  : (() => {
                      const ap = user?.api_plans?.find((p) => p.api_id === selectedApi.id);
                      return ap ? `${ap.plan_name} (최대 ${ap.max_rps} RPS)` : "없음";
                    })()}
              </span>
            </p>
          </div>
        )}

        {planActionError && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {planActionError}
          </div>
        )}

        {!selectedApi ? (
          /* API 목록 */
          isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-white/5 bg-surface/50"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  getApis()
                    .then(setApis)
                    .catch((err) => setError(err instanceof Error ? err.message : "API 목록을 불러올 수 없습니다."))
                    .finally(() => setIsLoading(false));
                }}
                className="mt-4 rounded-xl bg-accent px-6 py-2 font-medium text-background hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {apis.map((api) => {
                const currentPlan = user?.api_plans?.find((p) => p.api_id === api.id);
                return (
                  <button
                    key={api.id}
                    type="button"
                    onClick={() => handleSelectApi(api)}
                    className="group rounded-2xl border border-white/5 bg-surface/80 p-6 text-left transition-all hover:border-accent/20 hover:bg-surface"
                  >
                    <h2 className="text-xl font-semibold text-foreground">{api.name}</h2>
                    <p className="mt-2 text-sm text-foreground/60">{api.company_name}</p>
                    {currentPlan && (
                      <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
                        현재 플랜: {currentPlan.plan_name} ({currentPlan.max_rps} RPS)
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      플랜 보기
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* 플랜 목록 */
          plansLoading ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[420px] animate-pulse rounded-2xl border border-white/5 bg-surface/50"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => {
                  if (selectedApi) {
                    setPlansLoading(true);
                    setError(null);
                    getPlans(selectedApi.id)
                      .then(setPlans)
                      .catch((err) => setError(err instanceof Error ? err.message : "플랜을 불러올 수 없습니다."))
                      .finally(() => setPlansLoading(false));
                  }
                }}
                className="mt-4 rounded-xl bg-accent px-6 py-2 font-medium text-background hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => {
                const highlighted = plan.sort_order === 2;
                const currentApiPlan = user?.api_plans?.find((p) => p.api_id === selectedApi.id);
                const isCurrentPlan = currentApiPlan?.plan_id === plan.id;
                const isUpdating = updatingPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`group relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                      highlighted
                        ? "border-accent/50 bg-surface shadow-lg shadow-accent/5 glow-accent"
                        : "border-white/5 bg-surface/80 hover:border-white/10 hover:bg-surface"
                    } ${isCurrentPlan ? "ring-2 ring-accent/30" : ""}`}
                  >
                    {highlighted && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-accent px-4 py-1 text-xs font-medium text-background">
                          인기
                        </span>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-accent/20 border border-accent/50 px-4 py-1 text-xs font-medium text-accent">
                          현재 플랜
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                      <p className="mt-2 text-sm text-foreground/60">{plan.description}</p>
                    </div>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPrice(plan.price_monthly)}
                      </span>
                      <span className="text-foreground/60">{plan.period}</span>
                    </div>

                    <div className="mb-6 rounded-xl bg-background/30 px-4 py-3">
                      <p className="font-mono text-sm text-accent">
                        최대 {plan.max_rps} RPS
                      </p>
                      <p className="mt-1 text-xs text-foreground/50">
                        초당 {plan.max_rps}회 요청 가능
                      </p>
                    </div>

                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                          <span className="text-accent">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isLoggedIn || isAuthChecking ? (
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isCurrentPlan || isUpdating || isAuthChecking}
                        className={`block w-full rounded-xl py-3 text-center font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          isCurrentPlan
                            ? "border border-white/10 bg-surface text-foreground/50"
                            : highlighted
                              ? "bg-accent text-background hover:opacity-90"
                              : "border border-white/10 text-foreground hover:border-accent/50 hover:bg-accent/10"
                        }`}
                      >
                        {isCurrentPlan
                          ? "선택됨"
                          : isUpdating
                            ? "처리 중..."
                            : isAuthChecking
                              ? "확인 중..."
                              : "선택"}
                      </button>
                    ) : (
                      <Link
                        href="/signup"
                        className={`block w-full rounded-xl py-3 text-center font-medium transition-all ${
                          highlighted
                            ? "bg-accent text-background hover:opacity-90"
                            : "border border-white/10 text-foreground hover:border-accent/50 hover:bg-accent/10"
                        }`}
                      >
                        이 플랜으로 시작
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {!isLoading && !error && !selectedApi && !isLoggedIn && !isAuthChecking && (
          <p className="mt-12 text-center text-sm text-foreground/50">
            플랜 등록을 하려면{" "}
            <Link href="/login" className="text-accent hover:underline">
              로그인
            </Link>
            {" "}해주세요.
          </p>
        )}

        {!plansLoading && !error && selectedApi && isLoggedIn && (
          <p className="mt-12 text-center text-sm text-foreground/50">
            다른 플랜이 필요하신가요?{" "}
            <Link href="/docs" className="text-accent hover:underline">
              API 문서
            </Link>
            {" "}에서 사용법을 확인하세요.
          </p>
        )}
      </main>
    </div>
  );
}
