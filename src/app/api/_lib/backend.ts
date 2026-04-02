const DEFAULT_BACKEND_BASE_URL = "http://gpurent.kogrobo.com:53001";

const MAX_BACKEND_REDIRECTS = 12;

function stripBodyRelatedHeaders(h: Headers): void {
  h.delete("content-length");
  h.delete("content-type");
}

/**
 * Next 서버 → 내부 백엔드(auth, apis, plans 등) 베이스 URL.
 * 브라우저는 NEXT_PUBLIC_* 없이 /api/* 로만 호출하고, 라우트에서 이 URL로 프록시합니다.
 */
export function getBackendBaseUrl(): string {
  const base =
    process.env.INTERNAL_API_URL?.trim() ||
    DEFAULT_BACKEND_BASE_URL;
  return base.replace(/\/$/, "");
}

/**
 * 백엔드가 30x + Location(예: http://gpurent.../auth/login)을 주면,
 * Node 기본 fetch는 그대로 두면 핸들러가 3xx를 브라우저에 넘길 수 있고 HTTPS 페이지에서 mixed content 로 이어집니다.
 * 서버에서만 리다이렉트를 따라 최종 응답을 받습니다.
 */
export async function fetchBackend(
  pathWithQuery: string,
  init: RequestInit,
): Promise<Response> {
  const base = getBackendBaseUrl();
  const p = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  let url = `${base}${p}`;

  let method = String(init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers as HeadersInit | undefined);
  let body: BodyInit | undefined | null = init.body;
  const cache = init.cache ?? "no-store";
  const signal = init.signal;

  for (let hop = 0; hop < MAX_BACKEND_REDIRECTS; hop++) {
    const res = await fetch(url, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : body,
      cache,
      signal,
      redirect: "manual",
    });

    if (res.status < 300 || res.status >= 400) {
      return res;
    }

    const loc = res.headers.get("location");
    if (!loc) {
      return res;
    }

    url = new URL(loc, url).href;

    if (res.status === 303) {
      method = "GET";
      body = undefined;
      stripBodyRelatedHeaders(headers);
    } else if (res.status === 302 || res.status === 301) {
      if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
        method = "GET";
        body = undefined;
        stripBodyRelatedHeaders(headers);
      }
    }
  }

  return new Response(
    JSON.stringify({ detail: "upstream redirect loop" }),
    {
      status: 502,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function pickAuthHeader(req: Request): string | null {
  return req.headers.get("authorization");
}

