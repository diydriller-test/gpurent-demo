import { getToken } from "./token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
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
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
  company_id: number;
  company_name: string;
}

export async function getApis(): Promise<Api[]> {
  const res = await fetch(`${API_BASE_URL}/apis`, {
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
  return Array.isArray(data) ? data : [];
}

export interface Plan {
  id: number;
  name: string;
  api_id?: number;
  api_name?: string;
  price_monthly: string;
  description: string;
  max_rps: number;
  period: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export async function getPlans(apiId: number): Promise<Plan[]> {
  const res = await fetch(`${API_BASE_URL}/plans?api_id=${apiId}`, {
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

export interface User {
  id: number;
  email: string;
  username: string;
  plan_id: number | null;
  plan: Plan | null;
  is_active: boolean;
  created_at: string;
}

export async function getMe(): Promise<User> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
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

export async function updatePlan(planId: number): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API_BASE_URL}/auth/me/plan`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ plan_id: planId }),
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
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API_BASE_URL}/auth/api-keys`, {
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

  const res = await fetch(`${API_BASE_URL}/auth/api-keys`, {
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
