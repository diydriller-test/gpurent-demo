import { fetchBackend } from "./backend";

const UPSTREAM_BASE_URL = "http://gpurent.kogrobo.com:11115";

type ApiKeyLike = {
  id?: unknown;
  is_active?: unknown;
  api_key?: unknown;
};

function parseApiKeys(data: unknown): ApiKeyLike[] {
  if (Array.isArray(data)) return data as ApiKeyLike[];
  if (data && typeof data === "object") {
    const obj = data as { keys?: unknown; items?: unknown; id?: unknown };
    if (Array.isArray(obj.keys)) return obj.keys as ApiKeyLike[];
    if (Array.isArray(obj.items)) return obj.items as ApiKeyLike[];

    // 일부 API는 단일 API key 객체를 그대로 반환합니다.
    // 예: { id, api_key, is_active, created_at, ... }
    if (obj.id !== undefined) return [obj as ApiKeyLike];
  }
  return [];
}

async function hasApiKey(authHeader: string): Promise<boolean> {
  try {
    const res = await fetchBackend("/auth/api-keys", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return false;

    const data = (await res.json().catch(() => null)) as unknown;
    const keys = parseApiKeys(data);
    if (keys.length === 0) return false;

    return keys.some((k) => k.is_active !== false);
  } catch {
    return false;
  }
}

export async function resolveUpstreamContext(
  req: Request,
): Promise<{ upstreamBasePath: string; apiKey?: string }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { upstreamBasePath: `${UPSTREAM_BASE_URL}/trial` };
  }

  try {
    const res = await fetchBackend("/auth/api-keys", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return { upstreamBasePath: `${UPSTREAM_BASE_URL}/trial` };
    }

    const data = (await res.json().catch(() => null)) as unknown;
    const keys = parseApiKeys(data);
    const active = keys.find((k) => k.is_active !== false);
    const apiKey =
      active && typeof active.api_key === "string" ? active.api_key : undefined;

    return {
      upstreamBasePath: apiKey ? UPSTREAM_BASE_URL : `${UPSTREAM_BASE_URL}/trial`,
      apiKey,
    };
  } catch {
    return { upstreamBasePath: `${UPSTREAM_BASE_URL}/trial` };
  }
}

export async function resolveUpstreamBasePath(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return `${UPSTREAM_BASE_URL}/trial`;
  }

  const hasUserApiKey = await hasApiKey(authHeader);
  return hasUserApiKey ? UPSTREAM_BASE_URL : `${UPSTREAM_BASE_URL}/trial`;
}

