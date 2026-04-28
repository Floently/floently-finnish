import { useCallback, useState } from 'react';
import type { StoredAuthSession } from '@core/api/auth';

type GoogleSignInState =
  | { status: 'idle' }
  | { status: 'unavailable'; reason: string };

type UseGoogleSignInResult = {
  state: GoogleSignInState;
  signIn: () => Promise<StoredAuthSession | null>;
  reset: () => void;
};

export function useGoogleSignIn(): UseGoogleSignInResult {
  const [state, setState] = useState<GoogleSignInState>({ status: 'idle' });

  const signIn = useCallback(async (): Promise<StoredAuthSession | null> => {
    setState({
      status: 'unavailable',
      reason: 'Google sign-in is not configured for the web runtime on this deployment.',
    });
    return null;
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, signIn, reset };
}
