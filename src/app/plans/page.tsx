"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  getApis,
  getPlans,
  getMe,
  updatePlan,
  type Api,
  type Plan,
  type User,
} from "@/lib/api";
import { getToken } from "@/lib/token";
import {
  PlatformPageHeader,
  PlatformShell,
} from "@/components/platform/PlatformShell";
import {
  chapterQueryToPlanTask,
  DEMO_APIS_FALLBACK,
  DEMO_PLANS_THREE_TIERS,
  getApiTask,
  getPlanCardDisplay,
  getPlanTaskDisplayName,
  getPlanTaskSublabel,
  MODU_NLP_SURFACE_TASKS,
  PLAN_TASK_KEYS,
  type PlanTask,
} from "./planCatalog";
import { IconLayers, IconUser, PlanTaskIcon } from "./TaskFilterIcons";

function formatPrice(priceMonthly: string): string {
  const num = parseFloat(priceMonthly);
  if (isNaN(num) || num === 0) return "준비중";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(num);
}

function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterParam = searchParams.get("chapter");
  const autoParam = searchParams.get("auto") === "1";

  /** 플레이그라운드 `?chapter=&auto=1` 필터 적용 여부 */
  const chapterLinkFilterAppliedRef = useRef<string | null>(null);
  /** 해당 챕터 API 선택(플랜 화면) 1회만 */
  const playgroundAutoSelectDoneRef = useRef(false);

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
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  /** 백엔드 /apis 실패 시 데모 목록을 쓰는 중 */
  const [usingDemoApis, setUsingDemoApis] = useState(false);
  const [calculatorRequests, setCalculatorRequests] = useState(250_000);

  const [filterTasks, setFilterTasks] = useState<Record<PlanTask, boolean>>(
    () => {
      const o = {} as Record<PlanTask, boolean>;
      PLAN_TASK_KEYS.forEach((k) => {
        o[k] = true;
      });
      return o;
    },
  );
  const [sidebarMode, setSidebarMode] = useState<"all" | "my">("all");

  const visibleTaskKeys = useMemo(() => {
    const visible = PLAN_TASK_KEYS;
    if (apis.length === 0) return visible;
    const orderFor = (task: PlanTask): number => {
      const api = apis.find((a) => getApiTask(a) === task);
      return api?.sort_order ?? Number.MAX_SAFE_INTEGER;
    };
    return [...visible].sort((a, b) => orderFor(a) - orderFor(b));
  }, [apis]);

  const allTasksFilterOn = useMemo(
    () => visibleTaskKeys.every((k) => filterTasks[k]),
    [filterTasks, visibleTaskKeys],
  );

  const isAllTasksActive = sidebarMode === "all" && allTasksFilterOn;

  const comingSoonPlanIds = useMemo(() => {
    if (usingDemoApis) return new Set<number>();
    const ids = new Set<number>();
    plans.forEach((p) => {
      const price = parseFloat(p.price_monthly);
      if (!Number.isNaN(price) && price === 0) ids.add(p.id);
    });
    return ids;
  }, [plans, usingDemoApis]);

  const isPendingPlanComingSoon =
    !usingDemoApis && !!pendingPlanId && comingSoonPlanIds.has(pendingPlanId);

  const filteredApis = useMemo(() => {
    const filtered = apis
      .filter((api) => api.is_active !== false)
      .filter((api) => {
      if (sidebarMode === "my") {
        return !!user?.api_plans?.some((p) => p.api_id === api.id);
      }
      if (!chapterParam) return true;
      const task = getApiTask(api);
      if (allTasksFilterOn) return true;
      if (!task) return false;
      return filterTasks[task];
    });
    return [...filtered].sort((a, b) => {
      const d =
        (a.sort_order ?? Number.MAX_SAFE_INTEGER) -
        (b.sort_order ?? Number.MAX_SAFE_INTEGER);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name, "ko");
    });
  }, [apis, filterTasks, allTasksFilterOn, sidebarMode, user, chapterParam]);

  useEffect(() => {
    if (!chapterParam) {
      chapterLinkFilterAppliedRef.current = null;
      playgroundAutoSelectDoneRef.current = false;
    }
  }, [chapterParam]);

  useEffect(() => {
    if (!chapterParam || isLoading) return;
    const task = chapterQueryToPlanTask(chapterParam);
    if (!task) return;

    if (chapterLinkFilterAppliedRef.current !== chapterParam) {
      setSidebarMode("all");
      setFilterTasks((prev) => {
        const next = { ...prev } as Record<PlanTask, boolean>;
        PLAN_TASK_KEYS.forEach((k) => {
          next[k] = k === task;
        });
        return next;
      });
      chapterLinkFilterAppliedRef.current = chapterParam;
    }

    if (autoParam && !playgroundAutoSelectDoneRef.current) {
      const match = apis.find((api) => getApiTask(api) === task);
      if (match) {
        setSelectedApi(match);
        playgroundAutoSelectDoneRef.current = true;
      }
    }
  }, [chapterParam, autoParam, apis, isLoading]);

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
    let cancelled = false;
    setIsLoading(true);
    getApis()
      .then((data) => {
        if (cancelled) return;
        if (data.length === 0) {
          setApis(DEMO_APIS_FALLBACK);
          setUsingDemoApis(true);
          setError(null);
          return;
        }
        const hasT2m = data.some((a) => getApiTask(a) === "Text-to-Music");
        const withT2m: Api[] = hasT2m
          ? data
          : [
              ...data,
              {
                id: -1,
                name: "Text-to-Music API",
                slug: "t2m",
                company_id: 1,
                company_name: "코그로보",
                task_key: "Text-to-Music",
                task_label: "Text-to-Music",
                card_sublabel: "ACE-Step XL • T2M",
                model_display: "ACE-Step",
                tags: ["#T2M", "#Music", "#Audio"],
                is_active: true,
                sort_order: 999,
              },
            ];
        setApis(withT2m);
        setUsingDemoApis(false);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setApis(DEMO_APIS_FALLBACK);
        setUsingDemoApis(true);
        setError(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!selectedApi) {
      setPlans([]);
      return;
    }
    if (usingDemoApis) {
      setPlansLoading(false);
      setError(null);
      setPlans(DEMO_PLANS_THREE_TIERS);
      return;
    }
    setPlansLoading(true);
    setError(null);
    getPlans(selectedApi.id)
      .then(async (selectedPlans) => {
        if (selectedPlans.length > 0) {
          setPlans(selectedPlans);
          return;
        }

        // Voice Clone / Vision(OCR)은 비어 있을 때 기존 API 플랜을 재사용
        const selectedTask = getApiTask(selectedApi);
        const fallbackTask: PlanTask | null =
          selectedTask === "Voice Clone"
            ? "TTS"
            : selectedTask === "Vision"
              ? "Text Generation"
              : null;

        if (!fallbackTask) {
          setPlans(selectedPlans);
          return;
        }

        const fallbackApi = apis.find(
          (api) =>
            api.id !== selectedApi.id && getApiTask(api) === fallbackTask,
        );

        if (!fallbackApi) {
          setPlans(selectedPlans);
          return;
        }

        const fallbackPlans = await getPlans(fallbackApi.id);
        setPlans(fallbackPlans.length > 0 ? fallbackPlans : selectedPlans);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "플랜을 불러올 수 없습니다.",
        ),
      )
      .finally(() => setPlansLoading(false));
  }, [selectedApi, usingDemoApis, apis]);

  function handleSelectApi(api: Api) {
    setSelectedApi(api);
    setPendingPlanId(null);
    window.scrollTo(0, 0);
    window.history.pushState({ plansDetail: true }, "", window.location.href);
  }

  function handleBack() {
    setSelectedApi(null);
    setPlans([]);
    setError(null);
    setPendingPlanId(null);
  }

  useEffect(() => {
    function handlePopState() {
      if (!selectedApi) return;
      setSelectedApi(null);
      setPlans([]);
      setError(null);
      setPendingPlanId(null);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedApi]);

  function handlePickPlan(planId: number) {
    setPlanActionError(null);
    if (!usingDemoApis && comingSoonPlanIds.has(planId)) return;
    setPendingPlanId(planId);
  }

  function handleRegisterPlan() {
    if (!selectedApi) return;
    if (!pendingPlanId) {
      setPlanActionError("먼저 플랜을 선택해주세요.");
      return;
    }
    if (!usingDemoApis && comingSoonPlanIds.has(pendingPlanId)) {
      setPlanActionError("준비중인 플랜입니다. 다른 플랜을 선택해주세요.");
      return;
    }
    if (usingDemoApis) {
      setPlanActionError(
        "데모 화면입니다. 실제 구독·플랜 변경은 서버의 내부 API(INTERNAL_API_URL) 연결 후 가능합니다.",
      );
      return;
    }
    setPlanActionError(null);
    setConfirmModalOpen(true);
  }

  async function handleConfirmRegister() {
    if (!selectedApi || !pendingPlanId) return;
    setConfirmModalOpen(false);
    setUpdatingPlanId(pendingPlanId);
    try {
      await updatePlan(selectedApi.id, pendingPlanId, selectedApi.slug);
      await fetchUser();
      setPendingPlanId(null);
      setSuccessModalOpen(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#e8888a", "#f5c6c7", "#ffffff", "#ffd700"],
      });
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
  const calculator = useMemo(() => {
    const paidPlans = plans
      .map((plan) => ({
        plan,
        price: parseFloat(plan.price_monthly),
      }))
      .filter(({ price }) => Number.isFinite(price) && price > 0)
      .sort((a, b) => a.price - b.price);
    const recommended = paidPlans.find(
      ({ plan }) => calculatorRequests / 2_592_000 <= plan.max_rps,
    ) ?? paidPlans[paidPlans.length - 1] ?? null;
    const recommendedPrice = recommended?.price ?? 0;
    const singleModelBaseline = Math.round(recommendedPrice * 1.42);
    const savings =
      recommendedPrice > 0
        ? Math.max(0, singleModelBaseline - recommendedPrice)
        : 0;

    return {
      recommended,
      recommendedPrice,
      singleModelBaseline,
      savings,
      blendedLatency: recommended ? "평균 처리량 기준 추천" : "요청량 기준 계산",
    };
  }, [plans, calculatorRequests]);

  return (
    <PlatformShell hideSidebar>
      <main className="pb-16 md:pb-24">
        {selectedApi ? (
          <>
            <PlatformPageHeader
              eyebrow="요금"
              title={`${(() => { const t = getApiTask(selectedApi); return t ? getPlanTaskDisplayName(t) : selectedApi.name; })()} 요금제`}
              description="선택한 API의 월 요금, 초당 요청 수(RPS), 사용 한도를 비교하고 필요한 플랜을 고르세요."
            />

            <button
              type="button"
              onClick={handleBack}
              className="mb-8 flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              API 목록으로
            </button>
          </>
        ) : (
          <PlatformPageHeader
            eyebrow="요금"
            title="API별 사용량에 맞춰 고르는 요금"
            description={
              <>
                필요한 API를 선택하고, 예상 트래픽에 맞춰{" "}
                <span className="text-accent">RPS와 월 요청 한도</span>를
                확인하세요. 테스트 후 운영 규모에 맞는 플랜을 고르는 구조입니다.
              </>
            }
            action={
              <Link
                href="/api-test?api=llm"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-black/[0.08] bg-white px-4 text-[13px] font-semibold text-black/72 transition-colors hover:border-black/20 hover:text-black"
              >
                워크벤치 열기
              </Link>
            }
          />
        )}

        {!selectedApi ? (
          <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-[0_18px_70px_rgba(8,9,13,0.05)]">
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                API 비용 모델
              </p>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight text-foreground">
                어떤 API를 얼마나 쓸지 기준으로 비용을 예측합니다.
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["API별 플랜", "기능별 월 요금과 RPS 확인"],
                  ["크레딧 구조", "요청량 기준으로 사용량 파악"],
                  ["운영 한도", "트래픽 증가에 맞춰 단계 선택"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-black/[0.06] bg-background px-4 py-3">
                    <p className="font-mono text-[10px] uppercase text-black/36">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-5 text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-black/[0.08] bg-foreground p-6 text-white shadow-[0_18px_70px_rgba(8,9,13,0.12)]">
              <p className="font-mono text-[11px] uppercase tracking-normal text-white/42">
                플랜 선택 기준
              </p>
              <p className="mt-4 text-4xl font-semibold tracking-normal">
                RPS
              </p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                워크벤치에서 API를 테스트한 뒤, 실제 월 요청량과 필요한 RPS에
                맞춰 플랜을 선택하세요.
              </p>
            </div>
          </section>
        ) : null}

        {(isLoggedIn || isAuthChecking) && selectedApi && (
          <div className="mb-8 rounded-xl border border-black/[0.06] bg-white px-6 py-4">
            <p className="text-sm text-foreground/80">
              현재 플랜:{" "}
              <span className="font-medium text-accent">
                {userLoading
                  ? "확인 중..."
                  : (() => {
                      const ap = user?.api_plans?.find((p) => p.api_id === selectedApi.id);
                      return ap ? `${ap.plan_name} (초당 최대 ${ap.max_rps}회 요청)` : "없음";
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

        {selectedApi ? (
          <section className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-[0_18px_70px_rgba(8,9,13,0.05)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                    요금 계산기
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground">
                    필요한 처리량을 미리 계산해보세요.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-black/56">
                    월 요청량을 넣으면 평균 RPS 기준으로 필요한 요금제를 추정합니다.
                    실제 과금 로직은 변경하지 않고, 의사결정용 UI로만 제공됩니다.
                  </p>
                </div>
                <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase text-accent/70">
                    추천 플랜
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {calculator.recommended?.plan.name ?? "플랜 선택"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">
                    월 요청량
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {calculatorRequests.toLocaleString("ko-KR")}
                  </p>
                </div>
                <input
                  type="range"
                  min={50_000}
                  max={2_000_000}
                  step={50_000}
                  value={calculatorRequests}
                  onChange={(event) =>
                    setCalculatorRequests(Number(event.target.value))
                  }
                  className="mt-3 w-full accent-accent"
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-black/[0.06] bg-background px-4 py-3">
                  <p className="font-mono text-[10px] uppercase text-black/36">
                    예상 월 비용
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {calculator.recommended
                      ? formatPrice(String(calculator.recommendedPrice))
                      : "계산 대기"}
                  </p>
                </div>
                <div className="rounded-xl border border-black/[0.06] bg-background px-4 py-3">
                  <p className="font-mono text-[10px] uppercase text-black/36">
                    상위 플랜 기준
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {calculator.recommended
                      ? formatPrice(String(calculator.singleModelBaseline))
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase text-accent/70">
                    예상 차액
                  </p>
                  <p className="mt-2 text-lg font-semibold text-accent">
                    {calculator.recommended
                      ? formatPrice(String(calculator.savings))
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-[0_18px_70px_rgba(8,9,13,0.05)]">
              <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">
                크레딧을 쓰는 이유
              </p>
              <div className="mt-4 space-y-4">
                {[
                  ["API별 선택", "필요한 기능만 골라 플랜을 선택"],
                  ["크레딧 풀", "요청량과 플랜 기준으로 사용량 확인"],
                  ["엔터프라이즈 운영 준비", "RPS/IP 한도로 운영 한도 예측"],
                ].map(([label, body]) => (
                  <div key={label} className="border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0">
                    <p className="text-sm font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-black/56">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!selectedApi ? (
          isLoading ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
              <div className="h-64 w-full animate-pulse rounded-xl border border-black/[0.06] bg-white lg:w-[240px]" />
              <div className="grid min-h-[200px] flex-1 grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-xl border border-black/[0.06] bg-white"
                  />
                ))}
              </div>
            </div>
          ) : filteredApis.length === 0 ? (
            <div className="rounded-xl border border-black/[0.08] bg-background px-6 py-12 text-center">
              <p className="text-foreground/70">
                {sidebarMode === "my"
                  ? "구독 중인 API가 없습니다. 로그인 후 플랜을 구매하면 여기에 표시됩니다."
                  : "선택한 필터에 해당하는 API가 없습니다."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSidebarMode("all");
                  setFilterTasks((prev) => {
                    const next = { ...prev };
                    PLAN_TASK_KEYS.forEach((k) => {
                      next[k] = true;
                    });
                    return next;
                  });
                }}
                className="mt-4 rounded-xl border border-accent/45 bg-transparent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              >
                전체 보기
              </button>
            </div>
          ) : (
            <div className="relative">
              <aside className="hidden">
                <div className="platform-panel rounded-xl p-3">
                  <p className="font-mono text-[11px] uppercase tracking-normal text-black/36">필터</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    기능
                  </h2>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarMode("all");
                          setFilterTasks((prev) => {
                            const next = { ...prev };
                            PLAN_TASK_KEYS.forEach((k) => {
                              next[k] = true;
                            });
                            return next;
                          });
                        }}
                        className={[
                          "inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                          "border-black/[0.08] bg-white hover:border-black/[0.16] hover:bg-background",
                          isAllTasksActive
                            ? "border-accent/35 bg-accent/5"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-md border",
                            isAllTasksActive
                              ? "border-accent/30 bg-accent/10 text-accent"
                              : "border-black/[0.08] bg-background text-foreground/70",
                          ].join(" ")}
                        >
                          <IconLayers className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          전체
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isLoggedIn && !isAuthChecking) {
                            sessionStorage.setItem("modalScrollY", String(window.scrollY));
                            router.push("/login?redirect=%2Fplans", { scroll: false });
                            return;
                          }
                          setSidebarMode("my");
                        }}
                        className={[
                          "inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                          "border-black/[0.08] bg-white hover:border-black/[0.16] hover:bg-background",
                          sidebarMode === "my"
                            ? "border-accent/35 bg-accent/5"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-md border",
                            sidebarMode === "my"
                              ? "border-accent/30 bg-accent/10 text-accent"
                              : "border-black/[0.08] bg-background text-foreground/70",
                          ].join(" ")}
                        >
                          <IconUser className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          내 API
                        </span>
                      </button>

                      {visibleTaskKeys.map((t) => {
                        const isActive =
                          sidebarMode === "all" &&
                          filterTasks[t] &&
                          !allTasksFilterOn;
                        const label =
                          t === "Text Generation"
                            ? "LLM"
                            : t === "Reranker"
                              ? "Reranking"
                              : t === "Voice Clone"
                                ? "Voice Clone"
                                : t === "Vision"
                                  ? "Image-to-Text"
                                  : t;

                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setSidebarMode("all");
                              setFilterTasks((prev) => {
                                const next = { ...prev };
                                PLAN_TASK_KEYS.forEach((k) => {
                                  next[k] = k === t;
                                });
                                return next;
                              });
                            }}
                            className={[
                            "inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                              "border-black/[0.08] bg-white hover:border-black/[0.16] hover:bg-background",
                              isActive
                                ? "border-accent/35 bg-accent/5"
                                : "",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-md border",
                                isActive
                                  ? "border-accent/30 bg-accent/10 text-accent"
                                  : "border-black/[0.08] bg-background text-foreground/70",
                              ].join(" ")}
                            >
                              <PlanTaskIcon task={t} />
                            </span>
                            <span className="font-mono text-[11px] text-foreground/80">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </aside>

              <section className="min-w-0">
                <div className="platform-panel rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-foreground/60">
                        API별 요금제
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-foreground">
                        등급·트래픽 한도 선택
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/55">
                        카드를 눌러 해당 API의 월 요금·초당 요청 수(RPS) 플랜을 확인하세요.
                      </p>
                    </div>
                    <span className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-1 font-mono text-xs text-accent">
                      {filteredApis.length} APIs
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredApis.map((api) => {
                      const task = getApiTask(api);
                      const fallbackDisplay = getPlanCardDisplay(api);
                      const useModuNlpSublabel =
                        task !== null &&
                        MODU_NLP_SURFACE_TASKS.includes(task);
                      const display = {
                        ...fallbackDisplay,
                        task,
                        sublabel:
                          useModuNlpSublabel && task
                            ? getPlanTaskSublabel(task)
                            : (api.card_sublabel ?? fallbackDisplay.sublabel),
                        modelDisplay: api.model_display ?? fallbackDisplay.modelDisplay,
                        tags: api.tags && api.tags.length > 0 ? api.tags : fallbackDisplay.tags,
                      };
                      const currentPlan = user?.api_plans?.find(
                        (p) => p.api_id === api.id,
                      );
                      return (
                        <button
                          key={api.id}
                          type="button"
                          onClick={() => handleSelectApi(api)}
                          className={[
                            "group relative rounded-xl border bg-white p-4 text-left transition-all",
                            "border-black/[0.06] hover:border-black/[0.16] hover:bg-background",
                          ].join(" ")}
                        >
                          <p className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                            {display.task ? getPlanTaskDisplayName(display.task) : api.name}
                          </p>
                          <p className="mt-2 text-[11px] text-foreground/45">
                            트래픽 기반 · 등급별 과금
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {display.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg border border-accent/25 bg-accent/5 px-2 py-1 text-[11px] font-mono text-accent"
                              >
                                {tag.startsWith("#") ? tag.slice(1) : tag}
                              </span>
                            ))}
                          </div>

                          {currentPlan ? (
                            <p className="mt-3 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent">
                              현재: {currentPlan.plan_name} (초당 최대 {currentPlan.max_rps}회)
                            </p>
                          ) : null}

                          <div className="mt-4 flex items-center justify-start gap-2">
                            <span className="text-xs text-foreground/50">
                              플랜 보기
                            </span>
                            <span className="text-accent transition-transform group-hover:translate-x-0.5">
                              →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )
        ) : (
          /* 플랜 목록 */
          plansLoading ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[420px] animate-pulse rounded-xl border border-black/[0.06] bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => {
                  if (selectedApi) {
                    setPlansLoading(true);
                    setError(null);
                    getPlans(selectedApi.id)
                      .then(setPlans)
                      .catch((err) =>
                        setError(
                          err instanceof Error
                            ? err.message
                            : "플랜을 불러올 수 없습니다.",
                        ),
                      )
                      .finally(() => setPlansLoading(false));
                  }
                }}
                className="mt-4 rounded-xl bg-accent px-6 py-2 font-medium text-background hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const currentApiPlan = user?.api_plans?.find((p) => p.api_id === selectedApi.id);
                const isCurrentPlan = currentApiPlan?.plan_id === plan.id;
                const isPendingPlan = pendingPlanId === plan.id;
                const isUpdating = updatingPlanId === plan.id;
                const isComingSoon =
                  !usingDemoApis && (parseFloat(plan.price_monthly) === 0);
                const numericPrice = parseFloat(plan.price_monthly);
                const impliedMonthlyCapacity = Math.round(plan.max_rps * 2_592_000);
                const costPerTenK =
                  Number.isFinite(numericPrice) && numericPrice > 0
                    ? Math.round(numericPrice / Math.max(1, impliedMonthlyCapacity / 10_000))
                    : 0;

                return (
                  <div
                    key={plan.id}
                    className={`group relative flex flex-col rounded-xl border border-black/[0.08] bg-white p-6 transition-all duration-300 hover:border-black/[0.16] hover:shadow-[0_18px_70px_rgba(8,9,13,0.055)] ${isCurrentPlan ? "ring-2 ring-accent/20" : ""} ${isPendingPlan ? "ring-2 ring-emerald-400/40" : ""}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-accent/10 border border-accent/35 px-4 py-1 text-xs font-medium text-accent">
                          현재 플랜
                        </span>
                      </div>
                    )}
                    {!isCurrentPlan && isPendingPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-4 py-1 text-xs font-medium text-emerald-700">
                          선택됨
                        </span>
                      </div>
                    )}

                    <div className="mb-5">
                      <p className="font-mono text-[10px] uppercase tracking-normal text-black/36">
                        플랜 등급
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">{plan.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-foreground/56">{plan.description}</p>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold text-foreground">
                        {formatPrice(plan.price_monthly)}
                      </span>
                      <span className="text-foreground/60">{plan.period}</span>
                      </div>
                      <p className="mt-2 font-mono text-[11px] text-black/42">
                        {costPerTenK > 0
                          ? `~${costPerTenK.toLocaleString("ko-KR")}원 / 10k requests`
                          : "크레딧 요금 준비 중"}
                      </p>
                    </div>

                    <div className="mb-5 grid gap-3 rounded-xl border border-black/[0.06] bg-background px-4 py-3">
                      <div>
                        <p className="font-mono text-sm text-foreground">
                          {plan.max_rps} RPS 요금
                        </p>
                        <p className="mt-1 text-xs text-foreground/50">
                          월 약 {impliedMonthlyCapacity.toLocaleString("ko-KR")} requests
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm text-foreground">
                          {plan.max_ip_count ?? "—"} IP allowance
                        </p>
                        <p className="mt-1 text-xs text-foreground/50">
                          팀, 서비스, production gateway access
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                        <p className="font-mono text-[10px] uppercase text-accent/70">
                          API 선택
                        </p>
                        <p className="mt-1 text-xs font-medium text-foreground">
                          사용자 선택
                        </p>
                      </div>
                      <div className="rounded-lg border border-black/[0.06] bg-background px-3 py-2">
                        <p className="font-mono text-[10px] uppercase text-black/36">
                          latency
                        </p>
                        <p className="mt-1 text-xs font-medium text-foreground">
                          API별 기준
                        </p>
                      </div>
                    </div>

                    <ul className="mb-6 flex-1 space-y-3">
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
                        onClick={() => handlePickPlan(plan.id)}
                        disabled={
                          usingDemoApis
                            ? false
                            : isComingSoon || isCurrentPlan || isUpdating || isAuthChecking
                        }
                        className={`block w-full rounded-xl py-3 text-center font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          usingDemoApis
                            ? "border border-dashed border-amber-500/35 bg-amber-500/10 text-foreground/90 hover:bg-amber-500/15"
                            : isCurrentPlan
                              ? "border border-black/[0.08] bg-white text-foreground/50"
                            : "border border-black/[0.08] text-foreground hover:border-accent/35 hover:bg-accent/5"
                        }`}
                      >
                        {usingDemoApis
                          ? "데모 — 실제 선택은 연결 후"
                          : isComingSoon
                            ? "준비중"
                          : isCurrentPlan
                            ? "선택됨"
                            : isPendingPlan
                              ? "선택 완료"
                            : isUpdating
                              ? "처리 중..."
                              : isAuthChecking
                                ? "확인 중..."
                                : "선택"}
                      </button>
                    ) : usingDemoApis ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPlanActionError(
                            "데모입니다. 가입·결제는 백엔드 연결 후 진행할 수 있어요.",
                          )
                        }
                        className="block w-full rounded-xl border border-dashed border-black/[0.16] py-3 text-center font-medium text-foreground/80 transition-all hover:border-accent/40 hover:bg-accent/10"
                      >
                        데모 — 실제 신청은 연결 후
                      </button>
                    ) : isComingSoon ? (
                      <button
                        type="button"
                        disabled
                        className="block w-full rounded-xl border border-black/[0.08] py-3 text-center font-medium text-foreground/50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        준비중
                      </button>
                    ) : (
                      <Link
                        href="/signup"
                        className="block w-full rounded-xl border border-black/[0.08] py-3 text-center font-medium text-foreground transition-all hover:border-accent/35 hover:bg-accent/5"
                      >
                        이 플랜으로 시작
                      </Link>
                    )}
                  </div>
                );
              })}
              </div>
              {isLoggedIn && (
                <div className="mt-8 flex justify-center">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleRegisterPlan}
                      disabled={!pendingPlanId || !!updatingPlanId || isPendingPlanComingSoon}
                      className="rounded-xl bg-accent px-8 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingPlanId ? "등록 중..." : "등록하기"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanActionError(
                          "결제하기 기능은 준비 중입니다. 곧 제공될 예정입니다.",
                        )
                      }
                      disabled={isPendingPlanComingSoon}
                      className="rounded-xl border border-dashed border-accent/50 bg-accent/10 px-8 py-3 font-medium text-accent transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      결제하기<br /> 
                      (준비 중)
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {!isLoading && !error && !selectedApi && !isLoggedIn && !isAuthChecking && (
          <p className="mt-12 text-center text-sm text-foreground/50">
            플랜 등록을 하려면{" "}
            <Link href="/login?redirect=%2Fplans" className="text-accent hover:underline">
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

      {/* 등록 확인 모달 */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">플랜을 등록하시겠습니까?</h2>
            <p className="mt-2 text-sm text-foreground/65">
              선택한 플랜으로 등록됩니다. 관리자 승인 후 이용하실 수 있습니다.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 rounded-xl border border-black/[0.08] bg-white py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-black/[0.035]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmRegister}
                className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 완료 모달 */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-black/[0.08] bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-3xl">
              🎉
            </div>
            <h2 className="text-lg font-semibold text-foreground">등록이 완료되었습니다!</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">
              플랜 등록 신청이 접수되었습니다.<br />
              관리자 승인 후 이용하실 수 있으며,<br />
              <span className="font-medium text-accent">빠른 시일 내에 승인</span>해드리겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setSuccessModalOpen(false)}
              className="mt-6 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </PlatformShell>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <PlatformShell hideSidebar>
          <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-foreground/60">로딩 중…</p>
          </div>
        </PlatformShell>
      }
    >
      <PlansPageContent />
    </Suspense>
  );
}
