import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import { useReadMobileStore } from './readMobileStore';

const WEB_BROWSER_URL = 'https://read.floently.com/app/browser-v2/live';

const PROTECTED_AUTH_HOSTS = new Set([
  'accounts.google.com',
  'login.microsoftonline.com',
  'login.live.com',
  'appleid.apple.com',
  'www.facebook.com',
  'm.facebook.com',
]);

function isProtectedAuthenticationUrl(value: string | null) {
  if (!value) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      PROTECTED_AUTH_HOSTS.has(host) ||
      host.endsWith('.okta.com') ||
      host.endsWith('.auth0.com')
    );
  } catch {
    return false;
  }
}

function normalizeAddress(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // Continue with domain/search normalization.
  }

  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}([/:?#].*)?$/.test(raw)) {
    return `https://${raw}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
}

function canRenderInsideDeviceBrowser(url: string) {
  if (url === 'about:blank') return true;
  try {
    const scheme = new URL(url).protocol.toLowerCase();
    return scheme === 'http:' || scheme === 'https:' || scheme === 'data:' || scheme === 'blob:';
  } catch {
    return false;
  }
}

const EXTRACT_READABLE_PAGE = `
(function () {
  try {
    const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
    const excludedSelector = [
      'script', 'style', 'noscript', 'template', 'nav', 'footer', 'aside',
      '[role="navigation"]', '[role="dialog"]', '[role="menu"]',
      '[aria-modal="true"]', '[aria-hidden="true"]', '[hidden]',
      '.cookie', '.cookies', '.modal', '.drawer', '.sidebar', '.side-nav',
      '.sidenav', '.toolbar', '.menu'
    ].join(',');

    const candidates = Array.from(document.querySelectorAll(
      'main,article,[role="main"],section,body'
    )).map((element) => {
      const clone = element.cloneNode(true);
      if (clone.querySelectorAll) {
        clone.querySelectorAll(excludedSelector).forEach((node) => node.remove());
      }
      const text = normalize(clone.innerText || clone.textContent || '');
      const links = element.querySelectorAll
        ? Array.from(element.querySelectorAll('a')).reduce(
            (sum, link) => sum + normalize(link.innerText).length, 0
          )
        : 0;
      const density = Math.min(1, links / Math.max(1, text.length));
      const semantic = element.matches && element.matches('main,article,[role="main"]') ? 1800 : 0;
      return { text, score: Math.min(text.length, 18000) + semantic - density * 7000 };
    }).filter((entry) => entry.text.length >= 80).sort((a, b) => b.score - a.score);

    const text = candidates[0] ? candidates[0].text : normalize(document.body?.innerText || '');
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FLOENTLY_DEVICE_BROWSER_READ_PAGE',
      title: normalize(document.title) || location.hostname,
      url: location.href,
      text
    }));
  } catch (error) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FLOENTLY_DEVICE_BROWSER_READ_ERROR',
      message: String(error && error.message ? error.message : error)
    }));
  }
  true;
})();
`;

export default function ReadDeviceBrowserScreen() {
  const params = useLocalSearchParams<{ url?: string }>();
  const webViewRef = useRef<WebView>(null);
  const createFromText = useReadMobileStore((state) => state.createFromText);

  const initialUrl = useMemo(() => {
    const value = Array.isArray(params.url) ? params.url[0] : params.url;
    return value ? normalizeAddress(value) : null;
  }, [params.url]);

  const [addressText, setAddressText] = useState(initialUrl ?? '');
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl);
  const [reloadKey, setReloadKey] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialUrl));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState('Local device browser');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window !== 'undefined') window.location.assign(WEB_BROWSER_URL);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      router.replace('/read/app' as never);
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const hardRestart = (message = 'Reloading with a fresh browser process…') => {
    // A renderer can be wedged even when reload() itself still returns.
    // Remount the native WKWebView/Android WebView while leaving the platform
    // cookie/site-data store persistent.
    setLoadError(null);
    setStatus(message);
    setLoading(Boolean(currentUrl));
    setReloadKey((value) => value + 1);
  };

  const openAddress = () => {
    const target = normalizeAddress(addressText);
    if (!target) {
      setLoadError('Enter a website address or search term.');
      return;
    }
    setAddressText(target);
    setCurrentUrl(target);
    setLoadError(null);
    setLoading(true);
    setStatus('Loading on this device…');
  };

  const handleNavigation = (navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
    setCanGoForward(navigation.canGoForward);
    if (/^https?:\/\//i.test(navigation.url)) {
      setCurrentUrl(navigation.url);
      setAddressText(navigation.url);
    }
    setLoading(navigation.loading);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#8B5CF6" />
        <Text style={styles.statusText}>Opening Browser V2 for web…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canGoBack ? 'Back' : 'Close browser'}
          onPress={() => {
            if (canGoBack) webViewRef.current?.goBack();
            else router.replace('/read/app' as never);
          }}
          style={styles.roundButton}
        >
          <Text style={styles.iconText}>{canGoBack ? '‹' : '×'}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forward"
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
          style={[styles.roundButton, !canGoForward && styles.disabled]}
        >
          <Text style={styles.iconText}>›</Text>
        </Pressable>

        <TextInput
          accessibilityLabel="Website address"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          value={addressText}
          onChangeText={setAddressText}
          onSubmitEditing={openAddress}
          placeholder="Search or enter website"
          placeholderTextColor="#72809A"
          style={styles.addressInput}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reload with fresh browser"
          disabled={!currentUrl}
          onPress={() => hardRestart()}
          style={[styles.roundButton, !currentUrl && styles.disabled]}
        >
          <Text style={styles.reloadText}>↻</Text>
        </Pressable>
      </View>

      <View style={styles.statusBar}>
        {loading ? <ActivityIndicator size="small" color="#8B5CF6" /> : null}
        <Text numberOfLines={1} style={styles.statusText}>
          {loadError ?? status}
        </Text>
        {currentUrl && !isProtectedAuthenticationUrl(currentUrl) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Read this page in Floently"
            onPress={() => {
              setStatus('Finding readable text…');
              webViewRef.current?.injectJavaScript(EXTRACT_READABLE_PAGE);
            }}
            style={styles.readButton}
          >
            <Text style={styles.readButtonText}>Read</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.browserArea}>
        {currentUrl ? (
          <WebView
            key={reloadKey}
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            originWhitelist={['http://*', 'https://*', 'about:*', 'data:*', 'blob:*']}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            cacheEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures
            setSupportMultipleWindows={false}
            onLoadStart={() => {
              setLoading(true);
              setLoadError(null);
              setStatus('Loading on this device…');
            }}
            onLoadEnd={() => {
              setLoading(false);
              setStatus(
                isProtectedAuthenticationUrl(currentUrl)
                  ? 'Sign-in page · Reader injection is paused'
                  : 'Ready',
              );
            }}
            onNavigationStateChange={handleNavigation}
            onShouldStartLoadWithRequest={(request) => {
              if (canRenderInsideDeviceBrowser(request.url)) return true;
              void Linking.openURL(request.url).catch(() => {
                setLoadError('This link needs another app and could not be opened.');
              });
              return false;
            }}
            onOpenWindow={(event) => {
              const target = event.nativeEvent.targetUrl;
              if (/^https?:\/\//i.test(target)) {
                setAddressText(target);
                setCurrentUrl(target);
                setLoadError(null);
                setLoading(true);
              } else {
                void Linking.openURL(target).catch(() => {});
              }
            }}
            onMessage={(event) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data) as {
                  type?: string;
                  title?: string;
                  url?: string;
                  text?: string;
                  message?: string;
                };
                if (payload.type === 'FLOENTLY_DEVICE_BROWSER_READ_ERROR') {
                  setLoadError(payload.message || 'This page could not be prepared for reading.');
                  return;
                }
                if (payload.type !== 'FLOENTLY_DEVICE_BROWSER_READ_PAGE') return;
                const text = String(payload.text || '').trim();
                if (!text) {
                  setLoadError('No readable article or lesson text was found on this page.');
                  return;
                }
                createFromText({
                  title: String(payload.title || 'Web reading'),
                  text,
                  sourceType: 'browser',
                });
                router.push('/read/reader' as never);
              } catch {
                // Ignore messages that are not Floently's explicit extraction result.
              }
            }}
            onError={(event) => {
              setLoading(false);
              setLoadError(event.nativeEvent.description || 'This website could not be loaded.');
            }}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 500) {
                setLoadError(`Website returned ${event.nativeEvent.statusCode}. Reload creates a fresh browser surface.`);
              }
            }}
            onContentProcessDidTerminate={() => {
              // iOS WKWebView content process died. Never reuse it.
              hardRestart('The website process stopped. Restoring it in a fresh browser…');
            }}
            onRenderProcessGone={() => {
              // Android WebView renderer died. Never reuse it.
              hardRestart('The website process stopped. Restoring it in a fresh browser…');
            }}
          />
        ) : (
          <View style={styles.startScreen}>
            <Text style={styles.startIcon}>◎</Text>
            <Text style={styles.startTitle}>Browse on this device</Text>
            <Text style={styles.startBody}>
              Website rendering, touch, cookies and sign-in now stay in the phone's native browser engine.
              Enter a website or search above.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070B16' },
  toolbar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0C1220',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  iconText: { color: '#FFFFFF', fontSize: 30, lineHeight: 32, fontWeight: '600' },
  reloadText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  addressInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#121A2A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  statusBar: {
    minHeight: 38,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A1020',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statusText: { flex: 1, color: '#9CA8BF', fontSize: 11, fontWeight: '700' },
  readButton: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  browserArea: { flex: 1, backgroundColor: '#030712' },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: {
    flex: 1,
    backgroundColor: '#070B16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  startScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#070B16',
  },
  startIcon: { color: '#8B5CF6', fontSize: 48, marginBottom: 14 },
  startTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  startBody: { color: '#9CA8BF', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 420 },
});
