import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { getApiBaseUrl } from '@core/api/apiConfig';
import type { StoredAuthSession } from '@core/api/auth';

type GoogleSignInState =
  | { status: 'idle' }
  | { status: 'configuring' }
  | { status: 'unavailable'; reason: string }
  | { status: 'launching' }
  | { status: 'cancelled' }
  | { status: 'failed'; error: string };

type UseGoogleSignInResult = {
  state: GoogleSignInState;
  signIn: () => Promise<StoredAuthSession | null>;
  reset: () => void;
};

export function useGoogleSignIn(): UseGoogleSignInResult {
  const [state, setState] = useState<GoogleSignInState>({ status: 'idle' });

  const signIn = useCallback(async (): Promise<StoredAuthSession | null> => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setState({ status: 'unavailable', reason: 'Google sign-in is only available in the browser on this build.' });
      return null;
    }

    setState({ status: 'launching' });
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_origin: window.location.origin,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        data?: { authorization_url?: string };
        error?: { message?: string } | string;
      } | null;

      if (!response.ok || !payload?.ok || !payload.data?.authorization_url) {
        const message = typeof payload?.error === 'string'
          ? payload.error
          : payload?.error?.message ?? 'Google sign-in could not start.';
        setState({ status: 'failed', error: message });
        return null;
      }

      window.location.assign(payload.data.authorization_url);
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: 'failed', error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, signIn, reset };
}
