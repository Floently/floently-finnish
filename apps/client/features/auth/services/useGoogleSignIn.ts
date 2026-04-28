// apps/client/features/auth/services/useGoogleSignIn.ts
//
// Cross-platform Google Sign-In hook for Floently. Wraps
// expo-auth-session/providers/google and exchanges the id_token with the
// Floently backend via /api/v1/auth/google.
//
// Why this lives in a hook (not a plain function):
//   expo-auth-session must be initialized in component scope so it can
//   register the WebBrowser auth-session listener and respond to the OS
//   redirect callback. Trying to call it from a pure function leaks
//   subscription state and breaks on iOS. The hook pattern is the standard
//   recommendation in the expo-auth-session docs.
//
// Configuration:
//   The three OAuth client IDs (iOS / Android / Web) are read from
//   Constants.expoConfig.extra.googleOAuth — set in app.json with values
//   from EXPO_PUBLIC_GOOGLE_*_CLIENT_ID environment variables (see
//   GOOGLE_SIGNIN_SETUP.md for instructions on populating these).

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { exchangeGoogleIdToken, type StoredAuthSession } from '@core/api/auth';

// Required for the WebBrowser-based redirect callback. Calling this at
// module scope means the redirect-handling code is set up before the user
// taps the Google button, which avoids a race on cold start.
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
  // Prefer Expo's typed config; fall back to manifest for dev clients.
  const fromExpo = (Constants.expoConfig?.extra as { googleOAuth?: GoogleConfig } | undefined)?.googleOAuth;
  if (fromExpo) return fromExpo;
  // Manifest path for older runtimes
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
  | { status: 'configuring' }     // expo-auth-session is loading the request
  | { status: 'unavailable'; reason: string }
  | { status: 'launching' }        // user tapped, OAuth flow opening
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

  // Pick the correct client ID per platform. expo-auth-session/providers/google
  // takes platform-specific IDs and selects internally, but if we're missing
  // the relevant one we want to surface that as 'unavailable' before the user
  // even taps the button.
  const platformClientId = Platform.select({
    ios: config.iosClientId,
    android: config.androidClientId,
    web: config.webClientId,
    default: config.webClientId,
  });

  // useIdTokenAuthRequest is the right primitive — we want an id_token (a JWT
  // signed by Google with the user's identity), not an access_token. The
  // backend verifies the JWT signature and 'aud' claim against
  // GOOGLE_OAUTH_ALLOWED_CLIENT_IDS.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
    webClientId: config.webClientId,
    // Ask Google to include the user's email and basic profile in the id_token
    scopes: ['openid', 'profile', 'email'],
  });

  const signIn = useCallback(async (): Promise<StoredAuthSession | null> => {
    // Surface configuration errors before triggering the flow. Without
    // these checks the user would tap the button and see a generic
    // "Google sign-in failed" message; better to tell them up front.
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
      // expo-auth-session is still preparing the request; this is rare
      // and usually transient.
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
      // type === 'success'
      const successResult = result as any;
      const idToken = successResult.params?.id_token ?? successResult.authentication?.idToken;
      if (!idToken) {
        // This generally means the OAuth client wasn't configured for
        // id_token responses (only access_token). Server-verifiable
        // sign-in needs id_token.
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
