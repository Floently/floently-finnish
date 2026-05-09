import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { exchangeGoogleIdToken, type StoredAuthSession } from '@core/api/auth';

WebBrowser.maybeCompleteAuthSession();

type GoogleConfig = {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
  nativeWebClientId?: string;
};

function logGoogleAuthDebug(label: string, data: Record<string, unknown> = {}) {
  try {
    console.info(`[floently-google-auth] ${label}`, data);
  } catch {
    // no-op
  }
}

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
    nativeWebClientId: process.env.EXPO_PUBLIC_GOOGLE_NATIVE_WEB_CLIENT_ID,
  };
}

async function signInWithNativeGoogle(config: GoogleConfig): Promise<StoredAuthSession | null> {
  const nativeWebClientId = config.nativeWebClientId || config.webClientId;
  if (!nativeWebClientId) {
    throw new Error('Google sign-in is missing the native web client ID required by native Google Sign-In.');
  }

  GoogleSignin.configure({
    webClientId: nativeWebClientId,
    iosClientId: config.iosClientId,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const userInfo = await GoogleSignin.signIn();
  const idToken =
    (userInfo as any)?.data?.idToken ??
    (userInfo as any)?.idToken ??
    (await GoogleSignin.getTokens()).idToken;

  if (!idToken) {
    throw new Error('Google native sign-in did not return an id_token.');
  }

  return exchangeGoogleIdToken(idToken);
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
  logGoogleAuthDebug('config_loaded', {
    platform: Platform.OS,
    hasAndroidClientId: Boolean(config.androidClientId),
    hasWebClientId: Boolean(config.webClientId),
    hasIosClientId: Boolean(config.iosClientId),
  });

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
    setState({ status: 'launching' });
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        logGoogleAuthDebug('native_mobile_start', { platform: Platform.OS });
        const session = await signInWithNativeGoogle(config);
        if (!session) {
          setState({ status: 'cancelled' });
          return null;
        }
        logGoogleAuthDebug('native_mobile_success', { platform: Platform.OS, email: session.user.email });
        setState({ status: 'success', session });
        return session;
      }

      if (!request) {
        setState({ status: 'configuring' });
        return null;
      }

      logGoogleAuthDebug('prompt_start');
      const result = await promptAsync();
      logGoogleAuthDebug('prompt_result', {
        type: result.type,
        paramsKeys: (result as any).params ? Object.keys((result as any).params) : [],
        hasIdTokenParam: Boolean((result as any).params?.id_token),
        hasAuthIdToken: Boolean((result as any).authentication?.idToken),
        hasAccessToken: Boolean((result as any).authentication?.accessToken),
        error: (result as any).error?.message ?? (result as any).params?.error ?? null,
        errorDescription: (result as any).error?.description ?? (result as any).params?.error_description ?? null,
      });
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
        logGoogleAuthDebug('missing_id_token');
        setState({ status: 'failed', error: 'Google did not return an id_token. Check the OAuth client configuration.' });
        return null;
      }
      logGoogleAuthDebug('exchange_start');
      const session = await exchangeGoogleIdToken(idToken);
      logGoogleAuthDebug('exchange_success', { email: session.user.email });
      setState({ status: 'success', session });
      return session;
    } catch (err) {
      const code = (err as any)?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        logGoogleAuthDebug('native_mobile_cancelled', { platform: Platform.OS });
        setState({ status: 'cancelled' });
        return null;
      }
      const message = err instanceof Error ? err.message : String(err);
      logGoogleAuthDebug('exception', { code, message });
      setState({ status: 'failed', error: normalizeGoogleAuthError(message) });
      return null;
    }
  }, [platformClientId, request, promptAsync, config]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, signIn, reset };
}
