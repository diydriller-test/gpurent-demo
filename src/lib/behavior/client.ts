import type { BehaviorEvent } from "./types";
import { getToken, getUserId } from "@/lib/token";

const FLUSH_MS = 1_200;
const MAX_BATCH = 40;

const queue: BehaviorEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushBehaviorQueue();
  }, FLUSH_MS);
}

function buildPayload(events: BehaviorEvent[]) {
  const uid = getUserId();
  return {
    events,
    ...(typeof uid === "number" && Number.isFinite(uid) ? { user_id: uid } : {}),
  };
}

/**
 * 큐에 쌓인 이벤트를 `/api/behavior`로 전송합니다.
 */
export async function flushBehaviorQueue(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  const token = getToken();
  const body = JSON.stringify(buildPayload(batch));

  try {
    await fetch("/api/behavior", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    /* 수집 실패는 UX에 영향 없음 */
  }
}

function enqueue(event: BehaviorEvent): void {
  queue.push(event);
  if (queue.length >= MAX_BATCH) {
    if (flushTimer != null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    void flushBehaviorQueue();
    return;
  }
  scheduleFlush();
}

const lastPageSent = { path: "", at: 0 };

/**
 * SPA 라우트 변경 시 페이지 뷰 (StrictMode 중복 완화).
 * @param pathname - 경로만 (예: `/api-test`)
 * @param searchRaw - 쿼리 문자열 (`task=stt&view=detail`, `?` 없이)
 */
export function enqueuePageView(pathname: string, searchRaw = ""): void {
  const pathnameNorm = pathname || "/";
  const searchTrimmed = searchRaw.trim().replace(/^\?/, "");
  const search = searchTrimmed ? `?${searchTrimmed}` : "";
  const path = `${pathnameNorm}${search}`;
  const now = Date.now();
  if (lastPageSent.path === path && now - lastPageSent.at < 400) return;
  lastPageSent.path = path;
  lastPageSent.at = now;

  let title: string | undefined;
  if (typeof document !== "undefined") {
    title = document.title || undefined;
  }

  enqueue({
    type: "page_view",
    name: "page_view",
    occurred_at: new Date().toISOString(),
    properties: {
      path,
      pathname: pathnameNorm,
      ...(search ? { search } : {}),
      ...(title ? { title } : {}),
    },
  });
}

/**
 * 임의 커스텀 이벤트 (예: `trackBehavior("checkout_start", { step: 1 })`).
 */
export function trackBehavior(
  name: string,
  properties?: Record<string, unknown>,
): void {
  const n = name.trim();
  if (!n) return;
  enqueue({
    type: "custom",
    name: n,
    occurred_at: new Date().toISOString(),
    ...(properties && Object.keys(properties).length > 0
      ? { properties }
      : {}),
  });
}

/** 표시용 텍스트(비밀번호·일반 text 입력 값은 제외). */
function elementVisibleText(el: Element): string | undefined {
  if (el instanceof HTMLInputElement) {
    if (el.type === "password") return undefined;
    if (el.type === "submit" || el.type === "button" || el.type === "reset") {
      const v = (el.value || el.getAttribute("aria-label") || "").trim();
      return v.slice(0, 200) || undefined;
    }
    const ph = el.getAttribute("placeholder")?.trim();
    const aria = el.getAttribute("aria-label")?.trim();
    const hint = (aria || ph || "").slice(0, 200);
    return hint || undefined;
  }
  if (el instanceof HTMLSelectElement) {
    const opt = el.options[el.selectedIndex];
    const t = (opt?.text || el.value || "").trim();
    return t.slice(0, 200) || undefined;
  }
  const t = el.textContent?.trim().replace(/\s+/g, " ");
  return t?.slice(0, 200) || undefined;
}

/** `input`은 `type` 속성, 그 외는 태그명 소문자. */
function elementDomType(el: Element): string {
  if (el instanceof HTMLInputElement) {
    return (el.type || "text").toLowerCase();
  }
  return el.tagName.toLowerCase();
}

function safeHref(anchor: HTMLAnchorElement): string | undefined {
  if (!anchor.href) return undefined;
  try {
    const u = new URL(
      anchor.href,
      typeof location !== "undefined" ? location.href : undefined,
    );
    if (u.protocol === "http:" || u.protocol === "https:") {
      return `${u.pathname}${u.search}` || u.href;
    }
  } catch {
    /* noop */
  }
  return undefined;
}

function classAttr(el: Element): string | undefined {
  const c = el.getAttribute("class");
  return c ? c.slice(0, 120) : undefined;
}

/**
 * 실제 클릭된 DOM 타깃 (텍스트 노드면 부모 요소).
 * `html`/`body`, 비밀번호 필드 안, `[data-behavior-ignore]` 하위는 제외.
 */
function resolveClickTarget(ev: MouseEvent): Element | null {
  const n = ev.target;
  if (!n || !(n instanceof Node)) return null;
  const el: Element | null = n instanceof Element ? n : n.parentElement;
  if (!el) return null;
  if (el.closest("[data-behavior-ignore]")) return null;
  if (el.closest('input[type="password"]')) return null;
  if (el === document.documentElement || el === document.body) return null;
  return el;
}

/**
 * document 캡처 단계에서 **클릭된 요소** 기준으로 수집 (전역 한 번 적용).
 * 이전의 버튼/링크 한정 `closest` 방식과 달리, div·span 등 임의 요소 클릭도 기록합니다.
 */
export function attachElementClickTracking(): () => void {
  const handler = (ev: MouseEvent) => {
    if (!ev.isTrusted) return;
    const el = resolveClickTarget(ev);
    if (!el) return;

    const behaviorSource = el.closest("[data-behavior]");
    const dataBehavior = behaviorSource
      ?.getAttribute("data-behavior")
      ?.trim();
    const name = dataBehavior || "ui.element_click";

    const id = el.id || undefined;
    const cls = classAttr(el);
    const role = el.getAttribute("role") || undefined;
    const path =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : undefined;

    const text = elementVisibleText(el);
    let href: string | undefined;
    if (el instanceof HTMLAnchorElement) {
      href = safeHref(el);
    } else {
      const link = el.closest("a[href]");
      if (link instanceof HTMLAnchorElement) href = safeHref(link);
    }
    const type = elementDomType(el);

    enqueue({
      type: "element_click",
      name,
      occurred_at: new Date().toISOString(),
      properties: {
        type,
        ...(dataBehavior ? { data_behavior: dataBehavior } : {}),
        ...(id ? { id } : {}),
        ...(cls ? { className: cls } : {}),
        ...(role ? { role } : {}),
        ...(href ? { href } : {}),
        ...(text ? { text } : {}),
        ...(path ? { page_path: path } : {}),
      },
    });
  };

  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
}
