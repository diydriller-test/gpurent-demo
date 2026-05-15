/**
 * 사용자 행동 수집 (Next 프록시 → 내부 백엔드).
 *
 * 브라우저 → POST `/api/behavior`
 * Next → POST `{INTERNAL_API_URL}{INTERNAL_ANALYTICS_PATH||/analytics/behavior}`
 *
 * --- 브라우저 요청 바디 (JSON) ---
 * {
 *   "events": [
 *     {
 *       "type": "page_view" | "element_click" | "custom",
 *       "name": string,
 *       "occurred_at": string (ISO-8601),
 *       "properties": object (선택)
 *     }
 *   ],
 *   "user_id": number | null  (선택, 로그인 시 클라이언트가 저장한 id)
 * }
 * (구 클라이언트가 보낸 이벤트 type "click"은 "element_click"으로 정규화됩니다.)
 *
 * page_view 시 properties:
 * - path (string): pathname + search (예: "/api-test?task=stt&view=detail")
 * - pathname (string): 경로만 (예: "/api-test")
 * - search (string, 선택): "?" 포함 쿼리 (예: "?task=stt&view=detail")
 * - title (string, 선택)
 *
 * element_click 시 properties에 오는 필드 예시:
 * - type (string): input이면 input.type, 그 외 태그명 소문자 (예: "div", "button", "a")
 * - text (string, 선택): 표시용 텍스트(비밀번호·일반 text 입력 값 본문은 제외)
 * - href (string, 선택): http(s) 링크의 pathname+search
 * - data_behavior, id, className, role, page_path 등 (선택)
 *
 * 헤더: `Authorization: Bearer <token>` (로그인 시, 선택)
 *
 * --- 백엔드로 전달되는 바디 (JSON) ---
 * {
 *   "events": [ ... 위와 동일 ... ],
 *   "client_ip": string | null,
 *   "user_id": number | null  (클라이언트가 보낸 경우만 포함)
 * }
 * 헤더: 브라우저와 동일하게 `Authorization` 전달 (선택)
 *
 * 익명 사용자는 `user_id` 없이 `client_ip`로 보조 식별, 로그인 시 `user_id` + (선택) Bearer.
 */
import { NextResponse } from "next/server";

import { getClientIp } from "../_lib/client-ip";
import { fetchBackend, pickAuthHeader } from "../_lib/backend";

/** 내부 백엔드 수집 경로 (없으면 202로 무시 가능) */
function analyticsPath(): string {
  const raw =
    process.env.INTERNAL_ANALYTICS_PATH?.trim() || "/analytics/behavior";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

type IncomingEvent = {
  type?: unknown;
  name?: unknown;
  occurred_at?: unknown;
  properties?: unknown;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseEvents(raw: unknown): IncomingEvent[] | null {
  if (!raw || typeof raw !== "object") return null;
  const events = (raw as { events?: unknown }).events;
  if (!Array.isArray(events) || events.length === 0) return null;
  if (events.length > 100) return null;
  return events as IncomingEvent[];
}

function parseUserId(raw: unknown): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return undefined;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventsIn = parseEvents(json);
  if (!eventsIn) {
    return NextResponse.json(
      { error: "events 배열이 필요합니다. (1~100개)" },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(req);
  const auth = pickAuthHeader(req);
  const bodyUserId =
    typeof json === "object" && json !== null && "user_id" in json
      ? parseUserId((json as { user_id: unknown }).user_id)
      : undefined;

  const events = eventsIn.map((e) => {
    const raw = e.type;
    const type =
      raw === "page_view" ||
      raw === "element_click" ||
      raw === "custom"
        ? raw
        : raw === "click"
          ? "element_click"
          : "custom";
    const name =
      typeof e.name === "string" && e.name.trim() ? e.name.trim() : "unknown";
    const occurred_at =
      typeof e.occurred_at === "string" && e.occurred_at
        ? e.occurred_at
        : new Date().toISOString();
    const properties = isPlainObject(e.properties) ? e.properties : undefined;
    return { type, name, occurred_at, ...(properties ? { properties } : {}) };
  });

  const payload = {
    events,
    client_ip: clientIp,
    ...(bodyUserId !== undefined ? { user_id: bodyUserId } : {}),
  };

  try {
    const upstream = await fetchBackend(analyticsPath(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (upstream.ok) {
      return new NextResponse(null, { status: 204 });
    }

    /* 백엔드에 엔드포인트가 아직 없어도 데모 앱은 동작하도록 202 */
    if (upstream.status === 404 || upstream.status === 405) {
      return NextResponse.json(
        { ok: true, forwarded: false, reason: "upstream_not_configured" },
        { status: 202 },
      );
    }

    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: "upstream_error", detail: text.slice(0, 500) },
      { status: 502 },
    );
  } catch (err) {
    console.error("behavior ingest:", err);
    return NextResponse.json(
      { ok: true, forwarded: false, reason: "upstream_unreachable" },
      { status: 202 },
    );
  }
}
