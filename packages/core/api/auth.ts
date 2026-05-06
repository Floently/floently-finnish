// packages/core/api/auth.ts
//
// Updated to add signInWithGoogle() — the missing piece that broke the
// pre-launch Google Sign-In flow. The backend already supports
// /api/v1/auth/google with an id_token payload (see google_oauth_service.py).
// This file ties the client side to that endpoint via expo-auth-session.

import { apiClient } from './client';
import { getClientDeviceHeaders } from './deviceIdentity';
import { getApiBaseUrl } from './apiConfig';
import { isAllAccessTestEmail, normalizeSubscriptionStatus } from './entitlements';
import { extractResponseErrorMessage, isRecord, readResponseBody } from './response';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  subscriptionTier?: string | null;
  planLabel?: string | null;
  ykiAccess?: boolean;
  professionalAccess?: boolean;
  professions?: Array<'doctor' | 'nurse' | 'practical_nurse'>;
};

export type StoredAuthSession = {
  token: string;
  user: AuthUser;
};


const FLOW_READER_API_KEY_STORAGE_KEY = 'flowReader.auth.apiKey';
const FLOW_READER_AUTH_SESSION_STORAGE_KEY = 'flowReader.auth.session';

export type FlowReaderAuthUsage = {
  dailyCharacterLimit: number;
  dailyCharacters: number;
  dailyRequestLimit: number;
  dailyRequests: number;
  remainingDailyCharacters: number;
  remainingDailyRequests: number;
  totalCharacters: number;
  totalRequests: number;
  usageResetDate: string;
};

export type FlowReaderAuthUser = {
  apiKey: string;
  authProvider: string;
  createdAt: string;
  email: string;
  id: string;
  plan: string;
};

export type FlowReaderAuthSession = {
  apiKey: string;
  usage: FlowReaderAuthUsage;
  user: FlowReaderAuthUser;
};

function canUseLocalStorage(): boolean {
  try {
    return typeof globalThis !== 'undefined' && !!(globalThis as { localStorage?: Storage }).localStorage;
  } catch {
    return false;
  }
}

function defaultUsage(): FlowReaderAuthUsage {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    dailyCharacterLimit: 0,
    dailyCharacters: 0,
    dailyRequestLimit: 0,
    dailyRequests: 0,
    remainingDailyCharacters: 0,
    remainingDailyRequests: 0,
    totalCharacters: 0,
    totalRequests: 0,
    usageResetDate: tomorrow.toISOString(),
  };
}

function normalizePlan(tier?: string | null): string {
  return (tier ?? 'free').trim().toLowerCase() || 'free';
}

export function readFlowReaderAuthPayload(): { apiKey: string | null; session: FlowReaderAuthSession | null } {
  if (!canUseLocalStorage()) {
    return { apiKey: null, session: null };
  }

  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    const apiKey = local?.getItem(FLOW_READER_API_KEY_STORAGE_KEY)?.trim() || null;
    const rawSession = local?.getItem(FLOW_READER_AUTH_SESSION_STORAGE_KEY) ?? null;

    if (!rawSession) {
      return { apiKey, session: null };
    }

    const parsed = JSON.parse(rawSession) as Partial<FlowReaderAuthSession> | null;
    if (!parsed || typeof parsed !== 'object') {
      return { apiKey, session: null };
    }

    const sessionApiKey = typeof parsed.apiKey === 'string' && parsed.apiKey.trim() ? parsed.apiKey.trim() : apiKey;
    const user = parsed.user && typeof parsed.user === 'object' ? parsed.user : null;
    if (!sessionApiKey || !user || typeof user.email !== 'string' || typeof user.id !== 'string') {
      return { apiKey, session: null };
    }

    return {
      apiKey: sessionApiKey,
      session: {
        apiKey: sessionApiKey,
        usage: parsed.usage && typeof parsed.usage === 'object' ? parsed.usage as FlowReaderAuthUsage : defaultUsage(),
        user: {
          apiKey: typeof user.apiKey === 'string' && user.apiKey.trim() ? user.apiKey.trim() : sessionApiKey,
          authProvider: typeof user.authProvider === 'string' && user.authProvider.trim() ? user.authProvider.trim() : 'password',
          createdAt: typeof user.createdAt === 'string' && user.createdAt.trim() ? user.createdAt : new Date().toISOString(),
          email: user.email,
          id: user.id,
          plan: normalizePlan(typeof user.plan === 'string' ? user.plan : null),
        },
      },
    };
  } catch {
    return { apiKey: null, session: null };
  }
}

export function writeFlowReaderAuthPayload(session: {
  token: string;
  user: {
    email: string;
    id: string;
    subscriptionTier?: string | null;
    createdAt?: string | null;
    authProvider?: string | null;
  };
}): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const local = (globalThis as { localStorage?: Storage }).localStorage;
  if (!local) {
    return;
  }

  const payload: FlowReaderAuthSession = {
    apiKey: session.token,
    usage: defaultUsage(),
    user: {
      apiKey: session.token,
      authProvider: session.user.authProvider?.trim() || 'password',
      createdAt: session.user.createdAt?.trim() || new Date().toISOString(),
      email: session.user.email,
      id: session.user.id,
      plan: normalizePlan(session.user.subscriptionTier),
    },
  };

  local.setItem(FLOW_READER_API_KEY_STORAGE_KEY, session.token);
  local.setItem(FLOW_READER_AUTH_SESSION_STORAGE_KEY, JSON.stringify(payload));
}

export function clearFlowReaderAuthPayload(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const local = (globalThis as { localStorage?: Storage }).localStorage;
  local?.removeItem(FLOW_READER_API_KEY_STORAGE_KEY);
  local?.removeItem(FLOW_READER_AUTH_SESSION_STORAGE_KEY);
}


type BackendAuthUser = {
  user_id: string;
  email: string;
  name?: string | null;
  subscription_tier?: string | null;
  effective_tier?: string | null;
  plan_label?: string | null;
  yki_access?: boolean | null;
  professional_access?: boolean | null;
  accessible_professions?: Array<'doctor' | 'nurse' | 'practical_nurse'> | null;
  is_internal_all_access?: boolean | null;
};

type BackendAuthSession = {
  auth_user: BackendAuthUser;
  tokens: {
    access_token: string;
  };
  subscription_tier?: string | null;
};

function resolveSubscriptionTier(email: string, tier?: string | null, flags?: { isInternalAllAccess?: boolean | null }) {
  if (flags?.isInternalAllAccess) {
    return 'internal_all_access';
  }
  if (tier) {
    return tier;
  }
  if (isAllAccessTestEmail(email)) {
    return 'internal_all_access';
  }
  return null;
}

function enrichUser(email: string, tier?: string | null, flags?: { isInternalAllAccess?: boolean | null }) {
  const status = normalizeSubscriptionStatus({ is_internal_all_access: flags?.isInternalAllAccess ?? undefined }, { email, subscriptionTierHint: resolveSubscriptionTier(email, tier, flags) });
  return {
    subscriptionTier: status.billingTier,
    planLabel: status.planLabel,
    ykiAccess: status.ykiAccess,
    professionalAccess: status.professionalAccess,
    professions: status.professions,
  } satisfies Pick<AuthUser, 'subscriptionTier' | 'planLabel' | 'ykiAccess' | 'professionalAccess' | 'professions'>;
}


function enrichUserFromBackend(authUser: BackendAuthUser, tierHint?: string | null) {
  const payload = {
    billing_tier: authUser.subscription_tier ?? tierHint ?? undefined,
    tier: authUser.effective_tier ?? authUser.subscription_tier ?? tierHint ?? undefined,
    plan_label: authUser.plan_label ?? undefined,
    yki_access: authUser.yki_access ?? undefined,
    professional_access: authUser.professional_access ?? undefined,
    professions: authUser.accessible_professions ?? undefined,
    is_internal_all_access: authUser.is_internal_all_access ?? undefined,
  };
  const status = normalizeSubscriptionStatus(payload, {
    email: authUser.email,
    subscriptionTierHint: resolveSubscriptionTier(authUser.email, authUser.effective_tier ?? authUser.subscription_tier ?? tierHint ?? null, {
      isInternalAllAccess: authUser.is_internal_all_access ?? null,
    }),
  });
  return {
    subscriptionTier: status.billingTier,
    planLabel: status.planLabel,
    ykiAccess: status.ykiAccess,
    professionalAccess: status.professionalAccess,
    professions: status.professions,
  } satisfies Pick<AuthUser, 'subscriptionTier' | 'planLabel' | 'ykiAccess' | 'professionalAccess' | 'professions'>;
}


export async function restoreSessionFromToken(token: string): Promise<StoredAuthSession> {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw new Error('Missing auth token');
  }

  const deviceHeaders = await getClientDeviceHeaders();
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/session`, {
    headers: {
      ...deviceHeaders,
      Authorization: `Bearer ${trimmedToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Stored auth session is no longer valid.');
  }

  const { json, rawText } = await readResponseBody(response);
  const payload = isRecord(json) ? (json as { data?: { auth_user?: BackendAuthUser } }) : null;
  const authUser = payload?.data?.auth_user;
  if (!authUser || typeof authUser !== 'object' || typeof authUser.email !== 'string' || typeof authUser.user_id !== 'string') {
    throw new Error(extractResponseErrorMessage(json, 'Stored auth session is incomplete.', rawText));
  }

  return {
    token: trimmedToken,
    user: {
      id: authUser.user_id,
      email: authUser.email,
      name: authUser.name ?? '',
      ...enrichUserFromBackend(authUser),
    },
  };
}

export function readFlowReaderCompatibilityToken(): string | null {
  const payload = readFlowReaderAuthPayload();
  return payload.apiKey?.trim() || payload.session?.apiKey?.trim() || null;
}

export function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.token === 'string' &&
    v.user !== null &&
    typeof v.user === 'object' &&
    typeof (v.user as Record<string, unknown>).id === 'string' &&
    typeof (v.user as Record<string, unknown>).email === 'string'
  );
}

export async function login(email: string, password: string): Promise<StoredAuthSession> {
  const rawRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/login/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { json, rawText } = await readResponseBody(rawRes);
  const payload = isRecord(json) ? (json as {
    ok?: boolean;
    data?: BackendAuthSession | null;
    error?: { code?: string; message?: string } | string | null;
  }) : null;
  if (!rawRes.ok || !payload?.ok || !payload.data) {
    const errCode = typeof payload?.error === 'object' && payload.error !== null ? (payload.error as { code?: string }).code : undefined;
    const errMsg = typeof payload?.error === 'string' ? payload.error : (typeof payload?.error === 'object' && payload.error !== null ? (payload.error as { message?: string }).message : undefined);
    if (errCode === 'AUTH_DATA_CORRUPTION') {
      throw new Error('Tämä tili käyttää Google-kirjautumista. Aseta salasana ensin tai kirjaudu Googlella.');
    }
    if (errCode === 'AUTH_PASSWORD_NOT_SET') {
      throw new Error(errMsg ?? 'This account does not have a password set yet. Use Google sign-in or reset the password first.');
    }
    throw new Error(errMsg ?? extractResponseErrorMessage(json, 'Login failed', rawText));
  }
  return {
    token: payload.data.tokens.access_token,
    user: {
      id: payload.data.auth_user.user_id,
      email: payload.data.auth_user.email,
      name: payload.data.auth_user.name ?? '',
      ...enrichUserFromBackend(payload.data.auth_user, payload.data.subscription_tier),
    },
  };
}

export async function register(payload: { email: string; password: string; name?: string }): Promise<StoredAuthSession> {
  const res = await apiClient.post<BackendAuthSession>('/api/v1/auth/register/password', payload);
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Registration failed');
  return {
    token: res.data.tokens.access_token,
    user: {
      id: res.data.auth_user.user_id,
      email: res.data.auth_user.email,
      name: res.data.auth_user.name ?? '',
      ...enrichUserFromBackend(res.data.auth_user, res.data.subscription_tier),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Google Sign-In — id_token exchange with backend
//
// The backend route POST /api/v1/auth/google accepts { id_token: <jwt> }
// and verifies it against the configured GOOGLE_OAUTH_ALLOWED_CLIENT_IDS.
// The CLIENT side is responsible only for obtaining the id_token via the
// platform-appropriate Google OAuth flow.
//
// This function takes the id_token and posts it to the backend, mirroring
// the contract of login()/register(). The actual OAuth flow (which uses
// expo-auth-session/providers/google) is implemented in the AuthScreen
// because hook-based flows cannot live in pure-function modules.
// ────────────────────────────────────────────────────────────────────────────
export async function exchangeGoogleIdToken(idToken: string): Promise<StoredAuthSession> {
  const trimmed = (idToken || '').trim();
  if (!trimmed) {
    throw new Error('Missing Google id_token');
  }
  const rawRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: trimmed }),
  });
  const { json, rawText } = await readResponseBody(rawRes);
  const payload = isRecord(json) ? (json as {
    ok?: boolean;
    data?: BackendAuthSession | null;
    error?: { code?: string; message?: string } | string | null;
  }) : null;
  if (!rawRes.ok || !payload?.ok || !payload.data) {
    const errMsg = typeof payload?.error === 'string'
      ? payload.error
      : (typeof payload?.error === 'object' && payload.error !== null ? (payload.error as { message?: string }).message : undefined);
    throw new Error(errMsg ?? extractResponseErrorMessage(json, 'Google sign-in failed', rawText));
  }
  return {
    token: payload.data.tokens.access_token,
    user: {
      id: payload.data.auth_user.user_id,
      email: payload.data.auth_user.email,
      name: payload.data.auth_user.name ?? '',
      ...enrichUserFromBackend(payload.data.auth_user, payload.data.subscription_tier),
    },
  };
}

export async function completeGoogleOAuthResult(oauthResultId: string): Promise<StoredAuthSession> {
  const trimmed = (oauthResultId || '').trim();
  if (!trimmed) {
    throw new Error('Missing Google OAuth result id');
  }
  const rawRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oauth_result_id: trimmed }),
  });
  const { json, rawText } = await readResponseBody(rawRes);
  const payload = isRecord(json) ? (json as {
    ok?: boolean;
    data?: BackendAuthSession | null;
    error?: { code?: string; message?: string } | string | null;
  }) : null;
  if (!rawRes.ok || !payload?.ok || !payload.data) {
    const errMsg = typeof payload?.error === 'string'
      ? payload.error
      : (typeof payload?.error === 'object' && payload.error !== null ? (payload.error as { message?: string }).message : undefined);
    throw new Error(errMsg ?? extractResponseErrorMessage(json, 'Google sign-in failed', rawText));
  }
  return {
    token: payload.data.tokens.access_token,
    user: {
      id: payload.data.auth_user.user_id,
      email: payload.data.auth_user.email,
      name: payload.data.auth_user.name ?? '',
      ...enrichUserFromBackend(payload.data.auth_user, payload.data.subscription_tier),
    },
  };
}

export async function deleteAccount(payload?: { deletionReason?: string | null }): Promise<void> {
  const res = await apiClient.post('/api/v1/auth/account/delete', {
    confirm_delete: true,
    deletion_reason: payload?.deletionReason ?? null,
  });
  if (!res.ok) {
    throw new Error(res.error ?? 'Account deletion failed');
  }
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const rawRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const { json, rawText } = await readResponseBody(rawRes);
  const payload = isRecord(json) ? (json as {
    ok?: boolean;
    data?: { message?: string } | null;
    error?: { message?: string } | string | null;
  }) : null;
  if (!rawRes.ok || !payload?.ok || !payload.data) {
    const errMsg = typeof payload?.error === 'string' ? payload.error : (typeof payload?.error === 'object' && payload.error !== null ? payload.error.message : undefined);
    throw new Error(errMsg ?? extractResponseErrorMessage(json, 'Password reset request failed', rawText));
  }
  return { message: payload.data.message ?? 'If an account exists for this email, we have sent password reset instructions.' };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const rawRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: input.token,
      password: input.password,
      confirm_password: input.confirmPassword,
    }),
  });
  const { json, rawText } = await readResponseBody(rawRes);
  const responsePayload = isRecord(json) ? (json as {
    ok?: boolean;
    data?: { message?: string } | null;
    error?: { message?: string } | string | null;
  }) : null;
  if (!rawRes.ok || !responsePayload?.ok || !responsePayload.data) {
    const errMsg = typeof responsePayload?.error === 'string' ? responsePayload.error : (typeof responsePayload?.error === 'object' && responsePayload.error !== null ? responsePayload.error.message : undefined);
    throw new Error(errMsg ?? extractResponseErrorMessage(json, 'Password reset failed', rawText));
  }
  return { message: responsePayload.data.message ?? 'Password reset successful.' };
}

function isMockEnabled(): boolean {
  if (typeof process !== 'undefined') {
    return process.env?.EXPO_PUBLIC_MOCK_AUTH === 'true';
  }
  return false;
}

async function mockLogin(email?: string): Promise<StoredAuthSession> {
  const normalizedEmail = (email ?? 'learner@floently.local').trim().toLowerCase();
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/mock-login?email=${encodeURIComponent(normalizedEmail)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Mock login failed');
  const { json, rawText } = await readResponseBody(res);
  const data = isRecord(json) ? (json as { token: string; user: AuthUser & { isInternalAllAccess?: boolean; effectiveTier?: string } }) : null;
  if (!data) {
    throw new Error(extractResponseErrorMessage(json, 'Mock login failed', rawText));
  }
  return {
    token: data.token,
    user: {
      ...data.user,
      ...enrichUser(data.user.email, (data.user as { effectiveTier?: string; subscriptionTier?: string | null }).effectiveTier ?? data.user.subscriptionTier ?? null, { isInternalAllAccess: (data.user as { isInternalAllAccess?: boolean }).isInternalAllAccess ?? null }),
    },
  };
}

export const authService = {
  login,
  register,
  exchangeGoogleIdToken,
  deleteAccount,
  requestPasswordReset,
  resetPasswordWithToken,
  isMockAuthEnabled: isMockEnabled,
  mockLogin,
};
