import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { type WebViewNavigation } from 'react-native-webview';

type PublicSurface = 'gateway' | 'read' | 'create';

const SURFACE_URL: Record<PublicSurface, string> = {
  gateway: 'https://floently.com/',
  read: 'https://floently.com/read',
  create: 'https://floently.com/create/',
};

function appRouteFor(surface: PublicSurface, url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '') || '/';

    if (host === 'learn.floently.com') {
      if (path.startsWith('/auth')) return '/auth/login';
      return '/learn';
    }

    if (host === 'create.floently.com') return '/create';

    if (host === 'floently.com' || host === 'www.floently.com') {
      if (surface === 'read' && path === '/read') return null;
      if (surface === 'create' && path === '/create') return null;
      if (path === '/learn') return '/learn';
      if (path === '/read') return '/read';
      if (path === '/create') return '/create';
      if (path === '/auth/login') return '/auth/login';
      if (surface !== 'gateway' && path === '/') return '/';
      return null;
    }

    if (host === 'read.floently.com') {
      if (path === '/' && surface !== 'read') return '/read';
      if (path.startsWith('/auth')) return '/read/auth';
      if (path.startsWith('/subscribe')) return '/read/subscribe';
      return null;
    }
  } catch {
    return null;
  }

  return null;
}

function canStayOnSurface(surface: PublicSurface, url: string): boolean {
  if (url === 'about:blank') return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();

    return host === 'floently.com' || host === 'www.floently.com';
  } catch {
    return false;
  }
}

function PublicFloentlyWebSurface({ surface }: { surface: PublicSurface }) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const targetUrl = SURFACE_URL[surface];

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.location.replace(targetUrl);
  }, [targetUrl]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      if (surface === 'read' || surface === 'create') {
        router.replace('/' as never);
        return true;
      }
      return false;
    });
    return () => back.remove();
  }, [canGoBack, surface]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#8B5CF6" />
        <Text style={styles.loadingText}>Opening Floently…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.webArea}>
        <WebView
          ref={webViewRef}
          source={{ uri: targetUrl }}
          style={styles.webView}
          originWhitelist={['https://*']}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navigation: WebViewNavigation) => {
            setCanGoBack(navigation.canGoBack);
          }}
          onShouldStartLoadWithRequest={(request) => {
            const route = appRouteFor(surface, request.url);
            if (route) {
              router.push(route as never);
              return false;
            }
            if (canStayOnSurface(surface, request.url)) return true;
            if (/^https?:\/\//i.test(request.url)) {
              void Linking.openURL(request.url).catch(() => {});
            }
            return false;
          }}
        />
        {loading ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator color="#8B5CF6" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export function FloentlyGatewayScreen() {
  return <PublicFloentlyWebSurface surface="gateway" />;
}

export function FloentlyReadLandingScreen() {
  return <PublicFloentlyWebSurface surface="read" />;
}

export function FloentlyCreateComingSoonScreen() {
  return <PublicFloentlyWebSurface surface="create" />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020613' },
  webArea: { flex: 1, backgroundColor: '#020613' },
  webView: { flex: 1, backgroundColor: '#020613' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#020613',
  },
  loadingText: { color: '#A9B4C8', fontSize: 13, fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020613',
  },
});
