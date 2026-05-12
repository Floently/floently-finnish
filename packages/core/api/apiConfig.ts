function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? "").trim();
  return (normalized || fallback).replace(/\/+$/, "");
}


function webSameOriginApiBaseUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const origin = window.location.origin;
  if (origin === 'https://learn.floently.com') return origin;
  if (origin === 'http://learn.floently.com') return origin;
  return null;
}

export function getApiBaseUrl(): string {
  const sameOrigin = webSameOriginApiBaseUrl();
  if (sameOrigin) return sameOrigin;
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL, 'https://learn-api.floently.com');
}

export function getAudioBaseUrl(): string {
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_AUDIO_BASE_URL, getApiBaseUrl());
}

export function resolveApiUrl(value: string): string {
  const normalized = String(value ?? '').trim();
  const apiBaseUrl = getApiBaseUrl();
  if (!normalized) {
    return apiBaseUrl;
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return `${apiBaseUrl}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}
