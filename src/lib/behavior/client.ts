import type { BehaviorEvent } from "./types";
import { getToken, getUserId } from "@/lib/token";

const FLUSH_MS = 1_200;
const MAX_BATCH = 40;

let queue: BehaviorEvent[] = [];
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
 */
export function enqueuePageView(pathname: string): void {
  const path = pathname || "/";
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

function clickTextSnippet(el: Element): string | undefined {
  if (el instanceof HTMLInputElement) {
    if (el.type === "password") return undefined;
    if (el.type === "submit" || el.type === "button") {
      const v = (el.value || el.getAttribute("aria-label") || "").trim();
      return v.slice(0, 80) || undefined;
    }
    return undefined;
  }
  if (
    el instanceof HTMLButtonElement ||
    el instanceof HTMLAnchorElement ||
    el instanceof HTMLElement
  ) {
    const t = el.textContent?.trim().replace(/\s+/g, " ");
    return t?.slice(0, 80) || undefined;
  }
  return undefined;
}

function safeHref(el: Element): string | undefined {
  if (el instanceof HTMLAnchorElement && el.href) {
    try {
      const u = new URL(el.href, typeof location !== "undefined" ? location.href : undefined);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return `${u.pathname}${u.search}` || u.href;
      }
    } catch {
      /* noop */
    }
  }
  return undefined;
}

/**
 * document 캡처 단계 클릭 위임 (전역 한 번 적용).
 */
export function attachClickTracking(): () => void {
  const handler = (ev: MouseEvent) => {
    if (!ev.isTrusted) return;
    const raw = ev.target;
    if (!(raw instanceof Node)) return;
    const t = raw instanceof Element ? raw : raw.parentElement;
    if (!t) return;

    const el = t.closest(
      'button, [role="button"], input[type="submit"], input[type="button"], a[href], [data-behavior]',
    );
    if (!el) return;

    if (el instanceof HTMLInputElement && el.type === "password") return;

    const dataBehavior = el.getAttribute("data-behavior")?.trim();
    const tag = el.tagName.toLowerCase();
    const id = el.id || undefined;
    const cls = typeof el.className === "string" ? el.className : undefined;
    const path =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : undefined;

    const name = dataBehavior || "ui.click";
    const text_snippet = clickTextSnippet(el);
    const href = safeHref(el);

    enqueue({
      type: "click",
      name,
      occurred_at: new Date().toISOString(),
      properties: {
        ...(dataBehavior ? { data_behavior: dataBehavior } : {}),
        tag,
        ...(id ? { id } : {}),
        ...(cls ? { className: cls.slice(0, 120) } : {}),
        ...(href ? { href } : {}),
        ...(text_snippet ? { text_snippet } : {}),
        ...(path ? { page_path: path } : {}),
      },
    });
  };

  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
}
