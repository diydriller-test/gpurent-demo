import { getToken } from "./token";

// 동일 오리진 `/api/*` 만 사용 (절대 NEXT_PUBLIC 로 백엔드 http URL 을 넣지 않음 → mixed content 방지).

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

export interface SignupResponse {
  email: string;
  username: string;
  id: number;
  is_active: boolean;
  created_at: string;
}

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const res = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : JSON.stringify(error)
    );
  }

  return res.json();
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : JSON.stringify(error)
    );
  }

  return res.json();
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface Api {
  id: number;
  name: string;
  slug?: string;
  company_id: number;
  company_name: string;
  task_key?: string;
  task_label?: string;
  card_sublabel?: string;
  model_display?: string;
  tags?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export async function getApis(options?: {
  /** 기본 false: `is_active === false` 항목은 제외 (체험존 전체 목록 등에서 true로 사용) */
  includeInactive?: boolean;
}): Promise<Api[]> {
  const res = await fetch("/api/apis", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("API 목록을 불러올 수 없습니다.");
  }

  const data = await res.json();
  let apis: Api[] = Array.isArray(data) ? data : [];
  if (!options?.includeInactive) {
    apis = apis.filter((api) => api.is_active !== false);
  }
  return apis.sort(
    (a, b) =>
      (a.sort_order ?? Number.MAX_SAFE_INTEGER) -
      (b.sort_order ?? Number.MAX_SAFE_INTEGER),
  );
}

export interface Plan {
  id: number;
  name: string;
  api_id?: number;
  api_name?: string;
  price_monthly: string;
  description: string;
  max_rps: number;
  max_ip_count?: number;
  period: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export async function getPlans(apiId: number): Promise<Plan[]> {
  const res = await fetch(`/api/plans?api_id=${apiId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("플랜 정보를 불러올 수 없습니다.");
  }

  const plans: Plan[] = await res.json();
  return plans
    .filter((p) => p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export interface ApiPlan {
  api_id: number;
  api_name: string;
  company_id: number;
  company_name: string;
  plan_id: number;
  plan_name: string;
  max_rps: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  api_plans: ApiPlan[];
  is_active: boolean;
  created_at: string;
}

export async function getMe(): Promise<User> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch("/api/me", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    const { removeToken } = await import("./token");
    removeToken();
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("사용자 정보를 불러올 수 없습니다.");
  }

  return res.json();
}

export async function updatePlan(
  apiId: number,
  planId: number,
  apiSlugName?: string,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch("/api/me/plan", {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      api_id: apiId,
      plan_id: planId,
      ...(apiSlugName ? { api_slug_name: apiSlugName } : {}),
    }),
  });

  if (res.status === 401) {
    const { removeToken } = await import("./token");
    removeToken();
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : "플랜 변경에 실패했습니다."
    );
  }
}

export interface ApiKey {
  id: number;
  api_key: string;
  is_approved: boolean;
  created_at: string;
  last_used_at?: string;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch("/api/api-keys", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    const { removeToken } = await import("./token");
    removeToken();
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("API 키 목록을 불러올 수 없습니다.");
  }

  const data = await res.json();
  const keys = Array.isArray(data) ? data : data.keys ?? data.items ?? (data.id !== undefined ? [data] : []);
  return keys;
}

/** 플랜 등록 등: 최소 한 개의 API 키가 운영 승인된 경우에만 통과 */
export function hasApprovedApiKey(keys: ApiKey[]): boolean {
  return keys.some((k) => k.is_approved === true);
}

export interface CreateApiKeyRequest {
  name?: string;
}

export interface CreateApiKeyResponse {
  api_key: string;
  message: string;
}

export async function createApiKey(data?: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch("/api/api-keys", {
    method: "POST",
    headers,
    body: JSON.stringify(data ?? {}),
  });

  if (res.status === 401) {
    const { removeToken } = await import("./token");
    removeToken();
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : "API 키 생성에 실패했습니다."
    );
  }

  return res.json();
}

/** 기존 키 교체 후 한 번만 표시되는 새 키 발급 (백엔드 `POST /auth/api-keys`와 동일 경로). */
export async function regenerateApiKey(): Promise<CreateApiKeyResponse> {
  return createApiKey({});
}
