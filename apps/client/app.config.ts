import type { ExpoConfig, ConfigContext } from 'expo/config';

const FLOENTLY_APP_NAME = 'Floently Finnish';
const FLOENTLY_APP_SLUG = 'floently-finnish';
const FLOENTLY_APP_ICON = './assets/images/icon.png';

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
  const easProjectId = 'fa02c141-0a3b-4dbc-9122-7c1cf31ba42c';

  const googleOAuth = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
    nativeWebClientId: process.env.EXPO_PUBLIC_GOOGLE_NATIVE_WEB_CLIENT_ID?.trim() || undefined,
  };

  const existingUrlTypes = (baseExpo.ios?.infoPlist?.CFBundleURLTypes ?? []).filter(
    (entry) => entry?.CFBundleURLName !== 'GoogleSignIn',
  );

  const basePlugins = baseExpo.plugins ?? [];
  const ensurePlugin = (items: NonNullable<ExpoConfig['plugins']>, name: string) =>
    items.some((plugin) => plugin === name || (Array.isArray(plugin) && plugin[0] === name))
      ? items
      : [...items, name];

  let plugins = ['expo-image', 'expo-asset', 'expo-font', 'expo-web-browser'].reduce<
    NonNullable<ExpoConfig['plugins']>
  >((items, pluginName) => ensurePlugin(items, pluginName), basePlugins);

  const googleIosUrlScheme = getGoogleIosScheme(googleOAuth.iosClientId);

  const googleSignInPlugin: [string, { iosUrlScheme: string }] = [
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme: googleIosUrlScheme,
    },
  ];

  plugins = [
    ...plugins.filter(
      (plugin) =>
        !(
          plugin === '@react-native-google-signin/google-signin' ||
          (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin')
        ),
    ),
    "./plugins/withIosSwiftPodModularHeaders",
    googleSignInPlugin,
  ];

  return {
    ...baseExpo,
    name: FLOENTLY_APP_NAME,
    slug: FLOENTLY_APP_SLUG,
    icon: FLOENTLY_APP_ICON,
    plugins,
    updates: {
      ...(baseExpo.updates ?? {}),
      enabled: true,
      url: `https://u.expo.dev/${easProjectId}`,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    extra: {
      ...(baseExpo.extra ?? {}),
      apiBaseUrl,
      audioBaseUrl,
      googleOAuth,
    },

    ios: {
      ...(baseExpo.ios ?? {}),
      icon: FLOENTLY_APP_ICON,
      config: {
        ...(baseExpo.ios?.config ?? {}),
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        ...(baseExpo.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
        ...(baseExpo.ios?.infoPlist ?? {}),
        CFBundleURLTypes: [
          ...existingUrlTypes,
          {
            CFBundleURLName: 'GoogleSignIn',
            CFBundleURLSchemes: [googleIosUrlScheme],
          },
        ],
      },
    },
  };
}
