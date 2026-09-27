import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return (normalized || fallback).replace(/\/+$/, '');
}

function configuredApiBaseUrl(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
  const fromExpoExtra = extra?.apiBaseUrl?.trim();
  if (fromExpoExtra) return fromExpoExtra;

  return undefined;
}

function webSameOriginApiBaseUrl(): string | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  const origin =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { location?: { origin?: string } }).location?.origin === 'string'
      ? (globalThis as { location: { origin: string } }).location.origin
      : undefined;

  if (!origin) return null;

  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  if (cleanOrigin === 'https://learn.floently.com') return cleanOrigin;
  if (cleanOrigin === 'http://learn.floently.com') return cleanOrigin;

  return null;
}

export function getApiBaseUrl(): string {
  const configured = configuredApiBaseUrl();
  if (configured) return normalizeBaseUrl(configured, 'https://learn-api.floently.com');

  const sameOrigin = webSameOriginApiBaseUrl();
  if (sameOrigin) return sameOrigin;

  return 'https://learn-api.floently.com';
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
