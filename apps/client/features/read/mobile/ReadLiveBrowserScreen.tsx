import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import { useAuthStore } from '../../../state/authStore';
import { useSubscriptionStore } from '../../../state/subscriptionStore';

const DEFAULT_READ_BROWSER_URL = 'https://read.floently.com/app/browser-v2/live?embed=react-native';
const READ_BROWSER_HOST = 'read.floently.com';
const AUTH_API_KEY_STORAGE_KEY = 'flowReader.auth.apiKey';
const AUTH_SESSION_STORAGE_KEY = 'flowReader.auth.session';

function getBrowserUrl() {
  const configured = process.env.EXPO_PUBLIC_READ_BROWSER_URL?.trim();
  if (!configured) return DEFAULT_READ_BROWSER_URL;
  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== 'https:' || parsed.hostname !== READ_BROWSER_HOST) {
      return DEFAULT_READ_BROWSER_URL;
    }
    return parsed.toString();
  } catch {
    return DEFAULT_READ_BROWSER_URL;
  }
}

function getBrowserUrlForPlatform(url: string) {
  if (Platform.OS !== 'web') return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('embed');
    return parsed.toString();
  } catch {
    return 'https://read.floently.com/app/browser-v2/live';
  }
}

function canStayInsideReadBrowser(url: string) {
  if (url === 'about:blank') return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === READ_BROWSER_HOST;
  } catch {
    return false;
  }
}

function defaultUsage() {
  const reset = new Date();
  reset.setDate(reset.getDate() + 1);
  return {
    dailyCharacterLimit: 0,
    dailyCharacters: 0,
    dailyRequestLimit: 0,
    dailyRequests: 0,
    remainingDailyCharacters: 0,
    remainingDailyRequests: 0,
    totalCharacters: 0,
    totalRequests: 0,
    usageResetDate: reset.toISOString(),
  };
}

export default function ReadLiveBrowserScreen() {
  const webViewRef = useRef<WebView>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const subscription = useSubscriptionStore((state) => state.status);
  const [reloadKey, setReloadKey] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const browserUrl = useMemo(() => getBrowserUrlForPlatform(getBrowserUrl()), []);

  const embeddedAuth = useMemo(() => {
    if (!token || !user) return null;
    const plan = String(user.subscriptionTier || subscription?.tier || 'free').trim() || 'free';
    const readAccess = Boolean(
      user.readAccess ||
      subscription?.isInternalAllAccess ||
      subscription?.entitlements?.readAccess,
    );
    const session = {
      usage: defaultUsage(),
      user: {
        apiKey: token,
        authProvider: 'react-native',
        createdAt: new Date().toISOString(),
        email: user.email,
        id: user.id,
        plan,
        readPlan: readAccess ? 'app' : 'free',
        readAccess,
        readFullAccess: Boolean(subscription?.isInternalAllAccess),
        requiresUserApiKey: false,
      },
    };
    return { token, session };
  }, [subscription, token, user]);

  const authBootstrap = useMemo(() => {
    if (!embeddedAuth) return 'true;';
    const script = [
      '(function(){',
      'try {',
      `localStorage.setItem(${JSON.stringify(AUTH_API_KEY_STORAGE_KEY)}, ${JSON.stringify(embeddedAuth.token)});`,
      `localStorage.setItem(${JSON.stringify(AUTH_SESSION_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(embeddedAuth.session))});`,
      'window.__FLOENTLY_REACT_NATIVE_EMBED__ = true;',
      '} catch (_) {}',
      'true;',
      '})();',
    ];
    return script.join('');
  }, [embeddedAuth]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window !== 'undefined') {
      window.location.assign(browserUrl);
    }
  }, [browserUrl]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscriptionBack = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      router.replace('/read/app' as never);
      return true;
    });
    return () => subscriptionBack.remove();
  }, [canGoBack]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#8B5CF6" />
        <Text style={styles.loadingText}>Opening the Read browser…</Text>
      </View>
    );
  }

  if (!token || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Sign in required</Text>
        <Text style={styles.errorBody}>Your Read session is no longer available.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/read' as never)}>
          <Text style={styles.primaryButtonText}>Return to Read</Text>
        </Pressable>
      </View>
    );
  }

  const handleNavigation = (navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close live browser"
            onPress={() => router.replace('/read/app' as never)}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>‹</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text numberOfLines={1} style={styles.headerTitle}>Live website</Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              Secure remote browser · Reader available
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reload live browser"
            onPress={() => {
              setLoadError(null);
              webViewRef.current?.reload();
            }}
            style={styles.headerButton}
          >
            <Text style={styles.reloadText}>↻</Text>
          </Pressable>
      </View>

      <View style={styles.browserArea}>
        <WebView
          key={`${user.id}:${reloadKey}`}
          ref={webViewRef}
          source={{ uri: browserUrl }}
          style={styles.webView}
          originWhitelist={['https://read.floently.com']}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          cacheEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          injectedJavaScriptObject={
            embeddedAuth ? { flowReaderAuth: embeddedAuth } : {}
          }
          injectedJavaScriptBeforeContentLoaded={authBootstrap}
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly
          onMessage={() => {
            // Keep the native bridge active; Browser V2 does not send
            // credential or remote-page data back through postMessage.
          }}
          onLoadStart={() => {
            setLoading(true);
            setLoadError(null);
          }}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigation}
          onShouldStartLoadWithRequest={(request) => {
            if (canStayInsideReadBrowser(request.url)) return true;
            if (/^https?:\/\//i.test(request.url)) {
              void Linking.openURL(request.url).catch(() => {});
            }
            return false;
          }}
          onError={(event) => {
            setLoading(false);
            setLoadError(event.nativeEvent.description || 'The live browser could not be loaded.');
          }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              setLoading(false);
              setLoadError(`The Read browser returned ${event.nativeEvent.statusCode}. Try reconnecting.`);
            }
          }}
          onContentProcessDidTerminate={() => {
            // iOS: only a dead WebKit renderer justifies replacing the view.
            setLoadError(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
          onRenderProcessGone={() => {
            // Android: preserve normal network failures in-place, but recover
            // deterministically if the WebView renderer itself has died.
            setLoadError(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
        />

        {loadError ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Browser connection interrupted</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setLoadError(null);
                setLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.primaryButtonText}>Reconnect</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !loadError ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator color="#8B5CF6" />
            <Text style={styles.loadingText}>Connecting to your secure browser…</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070B16' },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0C1220',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: { color: '#FFFFFF', fontSize: 32, lineHeight: 34, fontWeight: '500' },
  reloadText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  headerText: { flex: 1, paddingHorizontal: 6 },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  headerSubtitle: { color: '#9CA8BF', fontSize: 11, marginTop: 2, fontWeight: '700' },
  browserArea: { flex: 1, backgroundColor: '#030712' },
  webView: { flex: 1, backgroundColor: '#030712' },
  centered: {
    flex: 1,
    backgroundColor: '#070B16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(7,11,22,0.86)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
    backgroundColor: 'rgba(7,11,22,0.94)',
  },
  loadingText: { color: '#BAC5D9', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  errorTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  errorBody: { color: '#AAB5CA', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 420 },
  primaryButton: {
    marginTop: 8,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
