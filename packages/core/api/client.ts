import { getApiBaseUrl } from "./apiConfig";
import { getAuthToken } from "./apiClient";
import { extractResponseErrorMessage, isRecord, readResponseBody } from "./response";
import { getClientDeviceHeaders } from "./deviceIdentity";

// FLOENTLY_DEVICE_ID_HEADER_PATCH_START
const DEVICE_ID_STORAGE_KEY = 'floently.release.deviceId.v1';

function createReleaseDeviceId(): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
  return `floently-${randomPart}`;
}

function memoryDeviceId(): string {
  const globalKey = '__FLOENTLY_RELEASE_DEVICE_ID__';
  const g = globalThis as unknown as Record<string, string | undefined>;
  if (!g[globalKey]) g[globalKey] = createReleaseDeviceId();
  return g[globalKey]!;
}

function getPersistentDeviceId(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (existing && existing.trim()) return existing.trim();
      const next = createReleaseDeviceId();
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
      return next;
    }
  } catch {
    // Native runtimes may not expose localStorage. Fall through to a stable in-process id.
  }

  return memoryDeviceId();
}

function addDeviceHeaders(headers: Record<string, string>): Record<string, string> {
  const deviceId = getPersistentDeviceId();
  return {
    ...headers: addDeviceHeaders(headers),
    'X-Device-Id': deviceId,
    'X-Floently-Device-Id': deviceId,
  };
}
// FLOENTLY_DEVICE_ID_HEADER_PATCH_END


type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const requestHeaders = new Headers(options?.headers);
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
    if (token && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    const deviceHeaders = await getClientDeviceHeaders();
    for (const [key, value] of Object.entries(deviceHeaders)) {
      if (!requestHeaders.has(key)) {
        requestHeaders.set(key, value);
      }
    }

    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: requestHeaders,
    });

    const { json, rawText } = await readResponseBody(res);
    const data = isRecord(json) && 'data' in json ? json.data : json;
    const errorMessage = extractResponseErrorMessage(json, `REQUEST_FAILED_${res.status}`, rawText);

    return {
      ok: res.ok,
      data: data as T,
      error: res.ok ? undefined : errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      ok: false,
      error: message,
    };
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};

export function unwrapApiResponse<T>(response: ApiResponse<T>, path = 'request'): T {
  if (!response.ok) {
    throw new Error(response.error || `REQUEST_FAILED_${path}`);
  }
  if (response.data === undefined) {
    throw new Error(`EMPTY_RESPONSE_${path}`);
  }
  return response.data;
}

export async function getData<T>(path: string): Promise<T> {
  return unwrapApiResponse(await apiClient.get<T>(path), path);
}

export async function postData<T>(path: string, body: unknown): Promise<T> {
  return unwrapApiResponse(await apiClient.post<T>(path, body), path);
}

export async function withFallback<T>(
  requestFn: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await requestFn();
  } catch (err) {
    console.warn('Request failed, using fallback:', err);
    return await fallback();
  }
}


export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiClient.get<T>(path);
  if (res.data === undefined) {
    throw new Error(`Missing response data for GET ${path}`);
  }
  return res.data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<T>(path, body);
  if (res.data === undefined) {
    throw new Error(`Missing response data for POST ${path}`);
  }
  return res.data;
}
