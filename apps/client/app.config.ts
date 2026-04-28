import type { ExpoConfig, ConfigContext } from 'expo/config';

const appJson = require('./app.json');

function getGoogleIosScheme(clientId?: string) {
  if (!clientId) {
    return 'com.googleusercontent.apps.PLACEHOLDER_REVERSED_IOS_CLIENT_ID';
  }
  return `com.googleusercontent.apps.${clientId.replace(/\.apps\.googleusercontent\.com$/, '')}`;
}

export default function config(_: ConfigContext): ExpoConfig {
  const baseExpo = appJson.expo as ExpoConfig & {
    ios?: {
      infoPlist?: Record<string, unknown> & {
        CFBundleURLTypes?: Array<Record<string, unknown>>;
      };
    };
  };

  const googleOAuth = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
  };

  const existingUrlTypes = (baseExpo.ios?.infoPlist?.CFBundleURLTypes ?? []).filter(
    (entry) => entry?.CFBundleURLName !== 'GoogleSignIn',
  );

  return {
    ...baseExpo,
    extra: {
      ...(baseExpo.extra ?? {}),
      googleOAuth,
    },
    ios: {
      ...(baseExpo.ios ?? {}),
      infoPlist: {
        ...(baseExpo.ios?.infoPlist ?? {}),
        CFBundleURLTypes: [
          ...existingUrlTypes,
          {
            CFBundleURLName: 'GoogleSignIn',
            CFBundleURLSchemes: [getGoogleIosScheme(googleOAuth.iosClientId)],
          },
        ],
      },
    },
  };
}
