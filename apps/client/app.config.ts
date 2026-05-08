import type { ExpoConfig, ConfigContext } from 'expo/config';

const appJson = require('./app.base.json');

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

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://learn-api.floently.com';
  const audioBaseUrl = process.env.EXPO_PUBLIC_AUDIO_BASE_URL?.trim() || apiBaseUrl;

  const googleOAuth = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
  };

  const existingUrlTypes = (baseExpo.ios?.infoPlist?.CFBundleURLTypes ?? []).filter(
    (entry) => entry?.CFBundleURLName !== 'GoogleSignIn',
  );

  const basePlugins = baseExpo.plugins ?? [];
  let plugins = basePlugins.some(
    (plugin) => plugin === 'expo-image' || (Array.isArray(plugin) && plugin[0] === 'expo-image'),
  )
    ? basePlugins
    : [...basePlugins, 'expo-image'];

  plugins = plugins.some(
    (plugin) =>
      plugin === '@react-native-google-signin/google-signin' ||
      (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin'),
  )
    ? plugins
    : [...plugins, '@react-native-google-signin/google-signin'];

  return {
    ...baseExpo,
    plugins,
    extra: {
      ...(baseExpo.extra ?? {}),
      apiBaseUrl,
      audioBaseUrl,
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
