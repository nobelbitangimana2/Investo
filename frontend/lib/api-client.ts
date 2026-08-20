/**
 * Base API client — all requests go through here.
 *
 * TOKEN ISOLATION: tokens are stored per-role so admin and client sessions
 * on the same browser never overwrite each other.
 *
 * Key format: investo-access-token:<role>  (e.g. investo-access-token:admin)
 * Falls back to role-less key for backward compat during first load.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").trim();

// ── Active role tracking ───────────────────────────────────────────────────
// Set by auth-store after login/load so all requests use the right token slot.
let _activeRole: string | null = null;

export function setActiveRole(role: string | null) {
  _activeRole = role;
}

function tokenKey(suffix: "access" | "refresh") {
  const base = `investo-${suffix}-token`;
  return _activeRole ? `${base}:${_activeRole}` : base;
}

// ── Token helpers ──────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  // Try role-scoped key first, fall back to legacy key
  return (
    localStorage.getItem(tokenKey("access")) ??
    localStorage.getItem("investo-access-token")
  );
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(tokenKey("refresh")) ??
    localStorage.getItem("investo-refresh-token")
  );
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(tokenKey("access"), accessToken);
  localStorage.setItem(tokenKey("refresh"), refreshToken);
  // Also keep legacy keys in sync for the current session
  localStorage.setItem("investo-access-token", accessToken);
  localStorage.setItem("investo-refresh-token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(tokenKey("access"));
  localStorage.removeItem(tokenKey("refresh"));
  // Clear legacy keys too
  localStorage.removeItem("investo-access-token");
  localStorage.removeItem("investo-refresh-token");
}

// ── Redirect to login, clearing all auth state ─────────────────────────────
function forceLogout() {
  clearTokens();
  localStorage.removeItem("investo-auth");
  _activeRole = null;
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ── Attempt to get a new access token using the stored refresh token ────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json().catch(() => ({}));
    const data = json?.data ?? json;

    if (!res.ok || !data?.accessToken) {
      refreshQueue.forEach((cb) => cb(null));
      refreshQueue = [];
      isRefreshing = false;
      forceLogout();
      return null;
    }

    const { accessToken, refreshToken: newRefreshToken } = data as {
      accessToken: string;
      refreshToken: string;
    };

    setTokens(accessToken, newRefreshToken);
    refreshQueue.forEach((cb) => cb(accessToken));
    refreshQueue = [];
    isRefreshing = false;
    return accessToken;
  } catch {
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];
    isRefreshing = false;
    forceLogout();
    return null;
  }
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retry = true,
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

  if (res.status === 401 && _retry) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    throw new Error("Session expired. Please sign in again.");
  }

  const json = await res.json().catch(() => ({}));
  const data = json?.data !== undefined ? json.data : json;

  if (!res.ok) {
    const msg = json?.message;
    const message = Array.isArray(msg) ? msg.join(", ") : (msg ?? "Request failed");
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data as T;
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
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
