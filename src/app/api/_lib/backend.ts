const DEFAULT_BACKEND_BASE_URL = "http://gpurent.kogrobo.com:53001";

export function getBackendBaseUrl(): string {
  const base =
    process.env.INTERNAL_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    DEFAULT_BACKEND_BASE_URL;
  return base.replace(/\/$/, "");
}

export function pickAuthHeader(req: Request): string | null {
  return req.headers.get("authorization");
}

