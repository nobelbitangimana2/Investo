import { API_BASE } from '@/constants/config';
import { getAccessToken } from './secure-storage';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const json = await res.json().catch(() => ({}));
  const data = json?.data !== undefined ? json.data : json;

  if (!res.ok) {
    const message =
      json?.message ?? (Array.isArray(json?.message) ? json.message.join(', ') : 'Request failed');
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data as T;
}

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
