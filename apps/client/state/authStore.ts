import { clearAuthSession, clearLegacyAuthStorage, clearSession, getAuthSession, saveAuthSession, saveSession } from '../services/authStorage';
import { create } from 'zustand';

import {
  authService,
  type AuthUser,
  type StoredAuthSession,
  isStoredAuthSession,
  readFlowReaderCompatibilityToken,
  restoreSessionFromToken,
  clearFlowReaderAuthPayload,
  writeFlowReaderAuthPayload,
} from '@core/api/auth';

import { setAuthToken } from '@core/api/apiClient';

type AuthState = {
  hasHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  hydrateSession: () => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  demoLogin: (email?: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

async function persistSession(session: StoredAuthSession | null) {
  if (!session) {
    try {
      await clearAuthSession();
    } catch {
      memoryStore.delete('auth_session_v2');
    }

    clearFlowReaderAuthPayload();
    return;
  }

  const serialized = JSON.stringify(session);
  writeFlowReaderAuthPayload(session);

  try {
    await saveAuthSession(serialized);
  } catch {
    memoryStore.set('auth_session_v2', serialized);
  }
}

async function readSession(): Promise<StoredAuthSession | null> {
  let raw: string | null = null;

  try {
    raw = await getAuthSession();
  } catch {
    raw = memoryStore.get('auth_session_v2') ?? null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStoredAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function applyMockSession(email?: string) {
  const mockSession = await authService.mockLogin(email);
  await persistSession(mockSession);
  await saveSession(mockSession.token); // ✅ mobile secure storage
  return mockSession;
}

export const useAuthStore = create<AuthState>((set) => ({
  hasHydrated: false,
  token: null,
  user: null,

  async hydrateSession() {
    await clearLegacyAuthStorage();
    const stored = await readSession();

    if (stored) {
      await persistSession(stored);
      await saveSession(stored.token); // ✅ ensure mobile sync
      setAuthToken(stored.token);
      set({
        hasHydrated: true,
        token: stored.token,
        user: stored.user,
      });
      return;
    }

    const compatibilityToken = readFlowReaderCompatibilityToken();

    if (compatibilityToken) {
      try {
        const restored = await restoreSessionFromToken(compatibilityToken);
        await persistSession(restored);
        await saveSession(restored.token); // ✅ mobile sync
        setAuthToken(restored.token);
        set({
          hasHydrated: true,
          token: restored.token,
          user: restored.user,
        });
        return;
      } catch {
        clearFlowReaderAuthPayload();
      }
    }

    setAuthToken(null);
    set({
      hasHydrated: true,
      token: null,
      user: null,
    });
  },

  async logout() {
    await persistSession(null);
    await clearSession(); // ✅ clear mobile session
    setAuthToken(null);
    set({
      hasHydrated: true,
      token: null,
      user: null,
    });
  },

  async setAuth(user, token) {
    await persistSession({ token, user });
    await saveSession(token); // ✅ THIS IS THE MAIN LOGIN SAVE
    setAuthToken(token);
    set({
      hasHydrated: true,
      token,
      user,
    });
  },

  async demoLogin(email) {
    const mockSession = await applyMockSession(email);
    setAuthToken(mockSession.token);
    set({
      hasHydrated: true,
      token: mockSession.token,
      user: mockSession.user,
    });
  },
}));
