/**
 * Base API client — all requests go through here.
 * Automatically attaches the JWT access token from localStorage,
 * and handles 401 responses by clearing auth state.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").trim();

// ── Token helpers (localStorage, client-side only) ─────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("investo-access-token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("investo-refresh-token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("investo-access-token", accessToken);
  localStorage.setItem("investo-refresh-token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("investo-access-token");
  localStorage.removeItem("investo-refresh-token");
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Unwrap the { success, data } envelope our backend sends
  const json = await res.json().catch(() => ({}));
  // Handle double-wrapped responses: { success, data: { data: [], meta: {} } }
  // and single-wrapped: { success, data: {...} }
  const data = json?.data !== undefined ? json.data : json;

  if (!res.ok) {
    const message =
      json?.message ??
      (Array.isArray(json?.message) ? json.message.join(", ") : "Request failed");
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data as T;
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPostForm<T>(path: string, formData: FormData) {
  return apiFetch<T>(path, { method: "POST", body: formData });
}

export function apiPatchForm<T>(path: string, formData: FormData) {
  return apiFetch<T>(path, { method: "PATCH", body: formData });
}
