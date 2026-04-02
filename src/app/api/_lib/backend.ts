const DEFAULT_BACKEND_BASE_URL = "http://gpurent.kogrobo.com:53001";

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

export function pickAuthHeader(req: Request): string | null {
  return req.headers.get("authorization");
}

