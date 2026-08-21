import { API_BASE } from '@/constants/config';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './secure-storage';
import { router } from 'expo-router';

// ── Role-scoped token keys ─────────────────────────────────────────────────
// Stores tokens separately per role so admin and client on the same device
// never overwrite each other's session.
let _activeRole: string | null = null;

export function setActiveRole(role: string | null) {
  _activeRole = role;
}

// ── Force logout ───────────────────────────────────────────────────────────
async function forceLogout() {
  await clearTokens();
  _activeRole = null;
  router.replace('/(auth)/login');
}

// ── Token refresh queue ────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  if (isRefreshing) {
    return new Promise((resolve) => { refreshQueue.push(resolve); });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json().catch(() => ({}));
    const data = json?.data ?? json;

    if (!res.ok || !data?.accessToken) {
      refreshQueue.forEach((cb) => cb(null));
      refreshQueue = [];
      isRefreshing = false;
      await forceLogout();
      return null;
    }

    const { accessToken, refreshToken: newRefreshToken } = data as {
      accessToken: string;
      refreshToken: string;
    };

    await setTokens(accessToken, newRefreshToken);
    refreshQueue.forEach((cb) => cb(accessToken));
    refreshQueue = [];
    isRefreshing = false;
    return accessToken;
  } catch {
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];
    isRefreshing = false;
    await forceLogout();
    return null;
  }
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retry = true,
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // On 401 — try refresh once then retry
  if (res.status === 401 && _retry) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    throw new Error('Session expired. Please sign in again.');
  }

  const json = await res.json().catch(() => ({}));
  const data = json?.data !== undefined ? json.data : json;

  if (!res.ok) {
    const msg = json?.message;
    const message = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Request failed');
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data as T;
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPostForm<T>(path: string, formData: FormData) {
  return apiFetch<T>(path, { method: 'POST', body: formData });
}

export function apiPatchForm<T>(path: string, formData: FormData) {
  return apiFetch<T>(path, { method: 'PATCH', body: formData });
}

// ── Unwrap paginated response ──────────────────────────────────────────────
export function unwrapPage<T>(res: unknown): T[] {
  if (res && typeof res === 'object') {
    if ('data' in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as { data: T[] }).data;
    }
    if (Array.isArray(res)) return res as T[];
  }
  return res as T[];
}
