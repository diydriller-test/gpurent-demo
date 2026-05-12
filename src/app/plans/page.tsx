"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SiteNav } from "@/components/SiteNav";
import {
  chapterQueryToPlanTask,
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
  /** 해당 챕터 API 자동 선택(플랜 화면) 1회만 */
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
  /** 백엔드 /apis 실패 시 데모 목록을 쓰는 중 */
  const [usingDemoApis, setUsingDemoApis] = useState(false);

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

  const visibleTaskKeys = useMemo(
    () =>
      PLAN_TASK_KEYS.filter(
        (t) =>
          !(
            t === "Ad Copy" ||
            t === "Text Summary" ||
            t === "Sentiment Analysis" ||
            t === "NER" ||
            t === "Text-to-SQL"
          ),
      ),
    [],
  );

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
  }, [apis, filterTasks, allTasksFilterOn, sidebarMode, user]);

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
        setApis([]);
        setUsingDemoApis(false);
        setError("API 목록을 불러올 수 없습니다.");
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
              ? "Ad Copy"
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

  async function handleRegisterPlan() {
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
    setUpdatingPlanId(pendingPlanId);
    try {
      await updatePlan(selectedApi.id, pendingPlanId, selectedApi.slug);
      await fetchUser();
      setPendingPlanId(null);
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
      <SiteNav fixed />

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16 md:pb-24">
        {selectedApi ? (
          <>
            <div className="mb-16 text-center">
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {selectedApi.name} 플랜 선택
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
                사용량에 맞는 등급을 선택하세요. 트래픽에 따라 API 사용량이
                제한됩니다.
              </p>
            </div>

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
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              API별 요금제
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              토큰이 아닌 <span className="text-accent">트래픽 기준</span>으로
              등급을 선택합니다. API를 누르면 월 요금·초당 요청 수(RPS) 한도를 확인할 수
              있어요.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/50">
              먼저 써보시려면{" "}
              <Link
                href="/api-test"
                className="text-accent underline decoration-accent/40 underline-offset-2 hover:opacity-90"
              >
                API 체험
              </Link>
              에서 먼저 써보신 후, 여기서 API별로 플랜을 선택하세요.
            </p>
          </div>
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

        {!selectedApi ? (
          isLoading ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
              <div className="h-64 w-full animate-pulse rounded-2xl border border-white/5 bg-surface/40 lg:w-[240px]" />
              <div className="grid min-h-[200px] flex-1 grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-2xl border border-white/5 bg-surface/50"
                  />
                ))}
              </div>
            </div>
          ) : filteredApis.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-background/20 px-6 py-12 text-center">
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
                전체 보기 (All)
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col gap-6 lg:flex-row lg:gap-6">
              <aside className="w-full lg:w-[240px] lg:flex-shrink-0">
                <div className="rounded-2xl border border-white/5 bg-surface/40 p-3 backdrop-blur-xl">
                  <p className="font-mono text-xs text-foreground/60">Tasks</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    API 유형 필터
                  </h2>
                  <div className="mt-4 rounded-xl border border-white/5 bg-background/20 p-3">
                    <div className="flex flex-wrap gap-2">
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
                          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                          "border-white/10 bg-background/30 hover:border-accent/30 hover:bg-accent/10",
                          isAllTasksActive
                            ? "border-accent/50 bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.12)]"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                            isAllTasksActive
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-white/10 bg-background/20 text-foreground/70",
                          ].join(" ")}
                        >
                          <IconLayers className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          All
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
                          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                          "border-white/10 bg-background/30 hover:border-accent/30 hover:bg-accent/10",
                          sidebarMode === "my"
                            ? "border-accent/50 bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.12)]"
                            : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                            sidebarMode === "my"
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-white/10 bg-background/20 text-foreground/70",
                          ].join(" ")}
                        >
                          <IconUser className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          My
                        </span>
                      </button>

                      {visibleTaskKeys.map((t) => {
                        const isActive =
                          sidebarMode === "all" &&
                          filterTasks[t] &&
                          !allTasksFilterOn;
                        const label =
                          t === "Text Generation"
                            ? "Text"
                            : t === "Voice Clone"
                                        ? "클론"
                                        : t === "Vision"
                                          ? "Vision"
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
                              "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                              "border-white/10 bg-background/30 hover:border-accent/30 hover:bg-accent/10",
                              isActive
                                ? "border-accent/50 bg-accent/10 shadow-[0_0_40px_rgba(232, 136, 138,0.12)]"
                                : "",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                isActive
                                  ? "border-accent/40 bg-accent/10 text-accent"
                                  : "border-white/10 bg-background/20 text-foreground/70",
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

              <section className="min-w-0 flex-1">
                <div className="rounded-2xl border border-white/5 bg-surface/35 p-4 backdrop-blur-xl">
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

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                            "group relative rounded-2xl border bg-background/20 p-4 text-left transition-all",
                            "border-white/5 hover:-translate-y-0.5 hover:border-accent/45 hover:bg-background/30",
                            "hover:shadow-[0_0_60px_rgba(232, 136, 138,0.12)]",
                          ].join(" ")}
                        >
                          <p className="font-mono text-[11px] text-foreground/50">
                            {display.sublabel}
                          </p>
                          <p className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                            {display.task ? getPlanTaskDisplayName(display.task) : api.name}
                          </p>
                          <p className="mt-1 text-[11px] text-foreground/40">
                            {api.company_name || "코그로보"}
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
                  className="h-[420px] animate-pulse rounded-2xl border border-white/5 bg-surface/50"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
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
              <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => {
                const currentApiPlan = user?.api_plans?.find((p) => p.api_id === selectedApi.id);
                const isCurrentPlan = currentApiPlan?.plan_id === plan.id;
                const isPendingPlan = pendingPlanId === plan.id;
                const isUpdating = updatingPlanId === plan.id;
                const isComingSoon =
                  !usingDemoApis && (parseFloat(plan.price_monthly) === 0);

                return (
                  <div
                    key={plan.id}
                    className={`group relative flex flex-col rounded-2xl border border-white/5 bg-surface/80 p-8 transition-all duration-300 hover:border-white/10 hover:bg-surface ${isCurrentPlan ? "ring-2 ring-accent/30" : ""} ${isPendingPlan ? "ring-2 ring-emerald-400/50" : ""}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-accent/20 border border-accent/50 px-4 py-1 text-xs font-medium text-accent">
                          현재 플랜
                        </span>
                      </div>
                    )}
                    {!isCurrentPlan && isPendingPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full border border-emerald-400/50 bg-emerald-400/15 px-4 py-1 text-xs font-medium text-emerald-300">
                          선택됨
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

                    <div className="mb-6 grid gap-3 rounded-xl bg-background/30 px-4 py-3">
                      <div>
                        <p className="font-mono text-sm text-accent">
                          초당 최대 {plan.max_rps}회 요청
                        </p>
                        <p className="mt-1 text-xs text-foreground/50">
                          RPS(Requests Per Second) {plan.max_rps}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm text-accent">
                          최대 IP {plan.max_ip_count ?? "—"}개
                        </p>
                        <p className="mt-1 text-xs text-foreground/50">
                          동시에 사용할 수 있는 IP 개수
                        </p>
                      </div>
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
                              ? "border border-white/10 bg-surface text-foreground/50"
                              : "border border-white/10 text-foreground hover:border-accent/50 hover:bg-accent/10"
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
                        className="block w-full rounded-xl border border-dashed border-white/20 py-3 text-center font-medium text-foreground/80 transition-all hover:border-accent/40 hover:bg-accent/10"
                      >
                        데모 — 실제 신청은 연결 후
                      </button>
                    ) : isComingSoon ? (
                      <button
                        type="button"
                        disabled
                        className="block w-full rounded-xl border border-white/10 py-3 text-center font-medium text-foreground/50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        준비중
                      </button>
                    ) : (
                      <Link
                        href="/signup"
                        className="block w-full rounded-xl border border-white/10 py-3 text-center font-medium text-foreground transition-all hover:border-accent/50 hover:bg-accent/10"
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
                      (Coming Soon)
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
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-grid-pattern">
          <p className="text-sm text-foreground/60">로딩 중…</p>
        </div>
      }
    >
      <PlansPageContent />
    </Suspense>
  );
}
