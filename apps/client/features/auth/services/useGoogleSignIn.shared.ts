import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { exchangeGoogleIdToken, type StoredAuthSession } from '@core/api/auth';

WebBrowser.maybeCompleteAuthSession();

type GoogleConfig = {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
};

function normalizeGoogleAuthError(message: string): string {
  const trimmed = message.trim();
  if (/access blocked/i.test(trimmed)) {
    return [
      'Google blocked this sign-in attempt.',
      'Check the OAuth consent screen status, add your account as a test user if the app is still in Testing, and verify the OAuth client IDs match the current Google Cloud project.',
    ].join(' ');
  }
  if (/disallowed_useragent/i.test(trimmed)) {
    return 'Google blocked this browser surface. Use a supported browser or an installed build with the correct OAuth client configuration.';
  }
  return trimmed;
}

function readGoogleConfig(): GoogleConfig {
  const fromExpo = (Constants.expoConfig?.extra as { googleOAuth?: GoogleConfig } | undefined)?.googleOAuth;
  if (fromExpo) return fromExpo;
  // @ts-expect-error legacy manifest shape
  const fromManifest = (Constants.manifest?.extra as { googleOAuth?: GoogleConfig } | undefined)?.googleOAuth;
  if (fromManifest) return fromManifest;
  return {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };
}

export type GoogleSignInState =
  | { status: 'idle' }
  | { status: 'configuring' }
  | { status: 'unavailable'; reason: string }
  | { status: 'launching' }
  | { status: 'cancelled' }
  | { status: 'failed'; error: string }
  | { status: 'success'; session: StoredAuthSession };

export type UseGoogleSignInResult = {
  state: GoogleSignInState;
  signIn: () => Promise<StoredAuthSession | null>;
  reset: () => void;
};

export function useGoogleSignIn(): UseGoogleSignInResult {
  const [state, setState] = useState<GoogleSignInState>({ status: 'idle' });
  const config = readGoogleConfig();

  const platformClientId = Platform.select({
    ios: config.iosClientId,
    android: config.androidClientId,
    web: config.webClientId,
    default: config.webClientId,
  });

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
    webClientId: config.webClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  const signIn = useCallback(async (): Promise<StoredAuthSession | null> => {
    if (!platformClientId) {
      setState({
        status: 'unavailable',
        reason:
          Platform.OS === 'web'
            ? 'Google sign-in is not configured for the web build.'
            : `Google sign-in is not configured for ${Platform.OS}.`,
      });
      return null;
    }
    if (!request) {
      setState({ status: 'configuring' });
      return null;
    }

    setState({ status: 'launching' });
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setState({ status: 'cancelled' });
        return null;
      }
      if (result.type === 'error') {
        const message = ((result as any).error?.message ?? (result as any).error?.description ?? (result as any).params?.error_description ?? 'Google authorization failed');
        setState({ status: 'failed', error: normalizeGoogleAuthError(message) });
        return null;
      }
      const successResult = result as any;
      const idToken = successResult.params?.id_token ?? successResult.authentication?.idToken;
      if (!idToken) {
        setState({ status: 'failed', error: 'Google did not return an id_token. Check the OAuth client configuration.' });
        return null;
      }
      const session = await exchangeGoogleIdToken(idToken);
      setState({ status: 'success', session });
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: 'failed', error: normalizeGoogleAuthError(message) });
      return null;
    }
  }, [platformClientId, request, promptAsync]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, signIn, reset };
}
