import { create } from 'zustand';
import type { StoredAuthSession } from '@core/api/auth';
import { setAuthToken } from '@core/api/apiClient';
import { saveSession, clearSession } from '../services/authStorage';

type SessionState = {
  session: StoredAuthSession | null;
  setSession: (session: StoredAuthSession | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,

  setSession: (session) => {
    set({ session });

    const token =
      (session as any)?.access_token ??
      (session as any)?.accessToken ??
      (session as any)?.token ??
      null;

    setAuthToken(token);
    if (!token) {
      void clearSession();
      return;
    }
    void saveSession(token);
  },

  clearSession: () => {
    set({ session: null });
    setAuthToken(null);
    void clearSession();
  },
}));

export type { StoredAuthSession };
