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
import {
  clearPreloadedSource,
  preload,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import { readTtsApi, type ReadTtsResult, type ReadVoice } from './readTtsApi';
import {
  createReadingPlaybackManifest,
  formatReadingClock,
  readingPositionForProgress,
  readingPrefetchIndexes,
  readingProgressForSegment,
  type ReadingPlaybackManifest,
} from './readingPlaybackManifest';

const WEB_BROWSER_URL = 'https://read.floently.com/app/browser-v2/live';
const EMPTY_MANIFEST = createReadingPlaybackManifest('', 1, 1400, 320);

const PROTECTED_AUTH_HOSTS = new Set([
  'accounts.google.com',
  'login.microsoftonline.com',
  'login.live.com',
  'appleid.apple.com',
  'www.facebook.com',
  'm.facebook.com',
]);

type BrowserReading = {
  title: string;
  url: string;
  text: string;
};

type BrowserAudioState =
  | 'idle'
  | 'extracting'
  | 'preparing'
  | 'playing'
  | 'paused'
  | 'error';

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

function isExternalScheme(url: string) {
  try {
    const scheme = new URL(url).protocol.toLowerCase();
    return scheme === 'mailto:' || scheme === 'tel:' || scheme === 'sms:' || scheme === 'facetime:';
  } catch {
    return false;
  }
}

function setPlayerPlaybackRate(player: ReturnType<typeof useAudioPlayer>, rate: number) {
  const safeRate = Math.max(0.5, Math.min(2, Number.isFinite(rate) ? rate : 1));
  const maybePlayer = player as unknown as {
    setPlaybackRate?: (value: number) => void;
    playbackRate?: number;
  };

  try {
    if (typeof maybePlayer.setPlaybackRate === 'function') {
      maybePlayer.setPlaybackRate(safeRate);
    } else {
      Reflect.set(maybePlayer, 'playbackRate', safeRate);
    }
  } catch {
    // Playback remains available at the player's default rate.
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
      return { text, score: Math.min(text.length, 40000) + semantic - density * 7000 };
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
  const player = useAudioPlayer(null, {
    updateInterval: 100,
    // Stream the active clip as soon as it is available. Downloading the
    // entire active audio file before playback made the browser Reader feel
    // frozen even though the document timeline was already known.
    downloadFirst: false,
    preferredForwardBufferDuration: 20,
  });
  const playbackStatus = useAudioPlayerStatus(player);

  const audioCache = useRef(new Map<string, ReadTtsResult>());
  const preloadCache = useRef(new Map<string, Promise<void>>());
  const resumeFractionRef = useRef(0);
  const handledFinishedRef = useRef<string | null>(null);

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

  const [reading, setReading] = useState<BrowserReading | null>(null);
  const [manifest, setManifest] = useState<ReadingPlaybackManifest>(EMPTY_MANIFEST);
  const [audioState, setAudioState] = useState<BrowserAudioState>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioResult, setAudioResult] = useState<ReadTtsResult | null>(null);
  const [activeSegment, setActiveSegment] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState<ReadVoice[]>([]);
  const [defaultVoiceId, setDefaultVoiceId] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [playerExpanded, setPlayerExpanded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window !== 'undefined') window.location.assign(WEB_BROWSER_URL);
  }, []);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void readTtsApi.listVoices().then((catalog) => {
      if (cancelled) return;
      setVoices(catalog.voices);
      setDefaultVoiceId(catalog.defaultVoiceId);
      setSelectedVoiceId((current) => current || catalog.defaultVoiceId);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
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

  useEffect(() => () => {
    player.pause();
    try { player.clearLockScreenControls(); } catch {}
    for (const url of preloadCache.current.keys()) {
      void clearPreloadedSource(url).catch(() => {});
    }
    preloadCache.current.clear();
  }, [player]);

  const clearPreparedAudio = () => {
    player.pause();
    setAudioResult(null);
    audioCache.current.clear();
    for (const url of preloadCache.current.keys()) {
      void clearPreloadedSource(url).catch(() => {});
    }
    preloadCache.current.clear();
    handledFinishedRef.current = null;
  };

  const selectedVoice =
    voices.find((voice) => voice.id === selectedVoiceId) ||
    voices.find((voice) => voice.id === defaultVoiceId) ||
    voices[0] ||
    null;

  const activeText = manifest.segments[activeSegment]?.text || '';

  const displayedProgress = useMemo(() => {
    if (!manifest.segments.length) return 0;
    if (playbackStatus.duration > 0 && audioResult) {
      const clipProgress = Math.max(
        0,
        Math.min(1, playbackStatus.currentTime / playbackStatus.duration),
      );
      return readingProgressForSegment(manifest, activeSegment, clipProgress);
    }
    return readingProgressForSegment(
      manifest,
      activeSegment,
      resumeFractionRef.current,
    );
  }, [
    activeSegment,
    audioResult,
    manifest,
    playbackStatus.currentTime,
    playbackStatus.duration,
  ]);

  const totalSeconds = Math.max(0, manifest.estimatedPlaybackDurationSeconds);
  const currentSeconds = totalSeconds * displayedProgress;
  const isPlaying = audioState === 'playing' || playbackStatus.playing;
  const isPreparing =
    audioState === 'extracting' ||
    audioState === 'preparing' ||
    playbackStatus.isBuffering;

  const chunkKey = (index: number) =>
    `${reading?.url || currentUrl || 'page'}:${selectedVoiceId || defaultVoiceId || 'default'}:${index}`;

  const prepareSegment = async (index: number) => {
    const segment = manifest.segments[index];
    if (!segment?.text) throw new Error('No readable section is available at this position.');
    const key = chunkKey(index);
    const cached = audioCache.current.get(key);
    if (cached) return cached;

    const result = await readTtsApi.prerenderReading({
      text: segment.text,
      language: 'auto',
      voiceId: selectedVoiceId || defaultVoiceId,
    });
    audioCache.current.set(key, result);
    return result;
  };

  const preloadSegment = async (index: number) => {
    const result = await prepareSegment(index);
    let pending = preloadCache.current.get(result.audioUrl);
    if (!pending) {
      pending = preload(result.audioUrl, {
        preferredForwardBufferDuration: 20,
      }).catch(() => {});
      preloadCache.current.set(result.audioUrl, pending);
    }
    await pending;
  };

  const prefetchAhead = (index: number) => {
    for (const nextIndex of readingPrefetchIndexes(manifest, index, 90, 4)) {
      void preloadSegment(nextIndex).catch(() => {});
    }
  };

  const enableLockScreen = () => {
    if (!reading) return;
    try {
      player.setActiveForLockScreen(true, {
        title: reading.title,
        artist: 'Floently Read',
        albumTitle: 'Website',
      });
    } catch {}
  };

  const playSegment = async (index: number) => {
    const segment = manifest.segments[index];
    if (!segment?.text) return;

    setAudioState('preparing');
    setAudioError(null);
    try {
      // Do not await a complete local download for the active segment.
      const result = await prepareSegment(index);
      setActiveSegment(index);
      setAudioResult(result);
      handledFinishedRef.current = null;
      player.replace(result.audioUrl);
      setPlayerPlaybackRate(player, speed);

      const resumeFraction = Math.max(0, Math.min(0.995, resumeFractionRef.current));
      if (resumeFraction > 0) {
        const sourceDuration =
          Number(result.duration || 0) ||
          manifest.segments[index]?.estimatedSourceDurationSeconds ||
          0;
        if (sourceDuration > 0) {
          try {
            await player.seekTo(sourceDuration * resumeFraction);
          } catch {
            // Some WebKit/AVPlayer sources are not seekable until their first
            // status update. Playback still starts; a later explicit seek works.
          }
        }
      }
      resumeFractionRef.current = 0;

      enableLockScreen();
      player.play();
      setAudioState('playing');
      setPlayerExpanded(false);
      prefetchAhead(index);
    } catch (error) {
      setAudioState('error');
      setAudioError(error instanceof Error ? error.message : String(error));
      setPlayerExpanded(true);
    }
  };

  useEffect(() => {
    if (!reading || !audioResult || !playbackStatus.didJustFinish) return;
    const key = `${reading.url}:${activeSegment}:${audioResult.cacheKey || audioResult.audioUrl}`;
    if (handledFinishedRef.current === key) return;
    handledFinishedRef.current = key;

    const next = activeSegment + 1;
    if (next < manifest.segments.length) {
      void playSegment(next);
      return;
    }

    setAudioState('paused');
    try { player.clearLockScreenControls(); } catch {}
  }, [
    activeSegment,
    audioResult,
    manifest.segments.length,
    playbackStatus.didJustFinish,
    reading,
  ]);

  const hardRestart = (message = 'Reloading with a fresh browser process…') => {
    setLoadError(null);
    setStatus(message);
    setLoading(Boolean(currentUrl));
    clearPreparedAudio();
    setReading(null);
    setManifest(EMPTY_MANIFEST);
    setAudioState('idle');
    setAudioError(null);
    setReloadKey((value) => value + 1);
  };

  const openAddress = () => {
    const target = normalizeAddress(addressText);
    if (!target) {
      setLoadError('Enter a website address or search term.');
      return;
    }
    clearPreparedAudio();
    setReading(null);
    setManifest(EMPTY_MANIFEST);
    setAudioState('idle');
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
      if (navigation.url !== currentUrl && reading?.url && navigation.url !== reading.url) {
        clearPreparedAudio();
        setReading(null);
        setManifest(EMPTY_MANIFEST);
        setAudioState('idle');
      }
      setCurrentUrl(navigation.url);
      setAddressText(navigation.url);
    }
    setLoading(navigation.loading);
  };

  const beginReadingExtraction = () => {
    if (!currentUrl || isProtectedAuthenticationUrl(currentUrl)) return;
    setAudioError(null);
    setAudioState('extracting');
    setStatus('Preparing this page for continuous reading…');
    webViewRef.current?.injectJavaScript(EXTRACT_READABLE_PAGE);
  };

  const startReadingPage = (payload: BrowserReading) => {
    const nextManifest = createReadingPlaybackManifest(payload.text, speed, 1400, 320);
    if (!nextManifest.segments.length) {
      setAudioState('error');
      setAudioError('No readable text was found on this page.');
      return;
    }

    clearPreparedAudio();
    setReading(payload);
    setManifest(nextManifest);
    setActiveSegment(0);
    setAudioResult(null);
    resumeFractionRef.current = 0;
    setAudioState('paused');
    setAudioError(null);
    setStatus('Reader ready on this page');

    // Start only after React has committed the new manifest. A zero-delay task
    // avoids racing playSegment against the previous empty manifest.
    setTimeout(() => {
      // The play button remains authoritative if the platform cancels this
      // optimistic start for any reason.
      setAudioState((state) => state === 'paused' ? 'preparing' : state);
    }, 0);
  };

  useEffect(() => {
    if (!reading || audioState !== 'preparing' || audioResult || !manifest.segments.length) return;
    void playSegment(activeSegment);
  }, [audioResult, audioState, manifest.segments.length, reading]);

  const togglePlayback = () => {
    if (!reading) {
      beginReadingExtraction();
      return;
    }

    if (isPlaying) {
      player.pause();
      setAudioState('paused');
      return;
    }

    if (audioResult?.audioUrl) {
      setPlayerPlaybackRate(player, speed);
      enableLockScreen();
      player.play();
      setAudioState('playing');
      setPlayerExpanded(false);
      prefetchAhead(activeSegment);
      return;
    }

    void playSegment(activeSegment);
  };

  const seekBySeconds = async (deltaSeconds: number) => {
    if (!reading || !manifest.segments.length || totalSeconds <= 0) return;
    const targetProgress = Math.max(
      0,
      Math.min(1, displayedProgress + deltaSeconds / totalSeconds),
    );
    const target = readingPositionForProgress(manifest, targetProgress);
    const wasPlaying = isPlaying;

    if (
      target.index === activeSegment &&
      audioResult?.audioUrl &&
      playbackStatus.duration > 0
    ) {
      await player.seekTo(playbackStatus.duration * target.fraction);
      return;
    }

    player.pause();
    setActiveSegment(target.index);
    setAudioResult(null);
    resumeFractionRef.current = target.fraction;
    handledFinishedRef.current = null;

    if (wasPlaying) {
      await playSegment(target.index);
    } else {
      setAudioState('paused');
      void preloadSegment(target.index).catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const values = [0.8, 1, 1.2, 1.5, 1.8, 2];
    const current = values.findIndex((value) => Math.abs(value - speed) < 0.01);
    const next = values[(current + 1 + values.length) % values.length];
    const progress = displayedProgress;
    setSpeed(next);
    setPlayerPlaybackRate(player, next);

    if (!reading) return;
    const nextManifest = createReadingPlaybackManifest(reading.text, next, 1400, 320);
    setManifest(nextManifest);

    // Segment boundaries do not change with speed. When a clip is already
    // loaded, keep its real currentTime as the authority; carrying the old
    // fraction into the next clip would incorrectly skip part of that clip.
    if (audioResult?.audioUrl) {
      resumeFractionRef.current = 0;
      return;
    }

    const position = readingPositionForProgress(nextManifest, progress);
    setActiveSegment(position.index);
    resumeFractionRef.current = position.fraction;
  };

  const cycleVoice = () => {
    if (!voices.length) return;
    const current = voices.findIndex((voice) => voice.id === selectedVoiceId);
    const next = voices[(current + 1 + voices.length) % voices.length];
    if (!next) return;

    const progress = displayedProgress;
    clearPreparedAudio();
    setSelectedVoiceId(next.id);
    const position = readingPositionForProgress(manifest, progress);
    setActiveSegment(position.index);
    resumeFractionRef.current = position.fraction;
    setAudioState('paused');
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
        {loading || audioState === 'extracting' ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : null}
        <Text numberOfLines={1} style={styles.statusText}>
          {loadError ?? audioError ?? status}
        </Text>
        {currentUrl && !isProtectedAuthenticationUrl(currentUrl) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Read this page in place"
            disabled={audioState === 'extracting'}
            onPress={reading ? togglePlayback : beginReadingExtraction}
            style={[styles.readButton, audioState === 'extracting' && styles.disabled]}
          >
            <Text style={styles.readButtonText}>
              {reading && isPlaying ? 'Pause' : reading ? 'Play' : 'Read'}
            </Text>
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
                  ? 'Sign-in page · Reader stays out of authentication'
                  : reading
                    ? 'Reader ready on this page'
                    : 'Ready',
              );
            }}
            onNavigationStateChange={handleNavigation}
            onShouldStartLoadWithRequest={(request) => {
              if (canRenderInsideDeviceBrowser(request.url)) return true;

              if (isExternalScheme(request.url)) {
                void Linking.openURL(request.url).catch(() => {
                  setStatus('The external app for this link is unavailable.');
                });
              } else if (request.isTopFrame) {
                // Do not turn background/custom-scheme probes into a persistent
                // browser error while the actual https page remains usable.
                setStatus('Blocked an unsupported external-app link.');
              }
              return false;
            }}
            onOpenWindow={(event) => {
              const target = event.nativeEvent.targetUrl;
              if (/^https?:\/\//i.test(target)) {
                clearPreparedAudio();
                setReading(null);
                setManifest(EMPTY_MANIFEST);
                setAudioState('idle');
                setAddressText(target);
                setCurrentUrl(target);
                setLoadError(null);
                setLoading(true);
              } else if (isExternalScheme(target)) {
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
                  setAudioState('error');
                  setAudioError(payload.message || 'This page could not be prepared for reading.');
                  return;
                }
                if (payload.type !== 'FLOENTLY_DEVICE_BROWSER_READ_PAGE') return;

                const text = String(payload.text || '').trim();
                if (!text) {
                  setAudioState('error');
                  setAudioError('No readable article or lesson text was found on this page.');
                  return;
                }

                startReadingPage({
                  title: String(payload.title || 'Web reading'),
                  url: String(payload.url || currentUrl || ''),
                  text,
                });
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
                setLoadError(
                  `Website returned ${event.nativeEvent.statusCode}. Reload creates a fresh browser surface.`,
                );
              }
            }}
            onContentProcessDidTerminate={() => {
              hardRestart('The website process stopped. Restoring it in a fresh browser…');
            }}
            onRenderProcessGone={() => {
              hardRestart('The website process stopped. Restoring it in a fresh browser…');
            }}
          />
        ) : (
          <View style={styles.startScreen}>
            <Text style={styles.startIcon}>◎</Text>
            <Text style={styles.startTitle}>Browse on this device</Text>
            <Text style={styles.startBody}>
              Website rendering, touch, cookies and sign-in stay in the phone's native browser engine.
              Enter a website or search above.
            </Text>
          </View>
        )}

        {reading ? (
          <View style={[styles.player, playerExpanded && styles.playerExpanded]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playerExpanded ? 'Minimize reader controls' : 'Expand reader controls'}
              onPress={() => setPlayerExpanded((value) => !value)}
              style={styles.playerTop}
            >
              <View style={styles.nowReading}>
                <Text style={styles.nowLabel}>NOW READING</Text>
                <Text numberOfLines={playerExpanded ? 2 : 1} style={styles.nowText}>
                  {activeText || reading.title}
                </Text>
              </View>
              <Text style={styles.expandGlyph}>{playerExpanded ? '⌄' : '⌃'}</Text>
            </Pressable>

            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {formatReadingClock(currentSeconds)} / {formatReadingClock(totalSeconds)}
              </Text>
              <Text style={styles.progressText}>{Math.round(displayedProgress * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(100, displayedProgress * 100))}%` },
                ]}
              />
            </View>

            <View style={styles.transport}>
              {playerExpanded ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back 10 seconds"
                  onPress={() => { void seekBySeconds(-10); }}
                  style={styles.transportSecondary}
                >
                  <Text style={styles.transportSecondaryText}>-10s</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause reading' : 'Play reading'}
                disabled={isPreparing}
                onPress={togglePlayback}
                style={[styles.transportPrimary, isPreparing && styles.disabled]}
              >
                {isPreparing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.transportPrimaryText}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
                )}
              </Pressable>

              {playerExpanded ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forward 10 seconds"
                  onPress={() => { void seekBySeconds(10); }}
                  style={styles.transportSecondary}
                >
                  <Text style={styles.transportSecondaryText}>+10s</Text>
                </Pressable>
              ) : (
                <Text style={styles.compactRemaining}>
                  {formatReadingClock(Math.max(0, totalSeconds - currentSeconds))} left
                </Text>
              )}
            </View>

            {playerExpanded ? (
              <View style={styles.optionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change voice"
                  onPress={cycleVoice}
                  style={[styles.optionChip, styles.optionVoice]}
                >
                  <Text numberOfLines={1} style={styles.optionText}>
                    {selectedVoice ? selectedVoice.name : 'Voice'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change speed"
                  onPress={cycleSpeed}
                  style={styles.optionChip}
                >
                  <Text style={styles.optionText}>{speed}x</Text>
                </Pressable>
              </View>
            ) : null}

            {audioError ? <Text style={styles.playerError}>{audioError}</Text> : null}
          </View>
        ) : null}
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
  disabled: { opacity: 0.42 },
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
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
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
  startBody: {
    color: '#9CA8BF',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 420,
  },

  player: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132,111,255,0.50)',
    backgroundColor: 'rgba(12,18,32,0.97)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  playerExpanded: {
    paddingVertical: 14,
  },
  playerTop: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nowReading: { flex: 1 },
  nowLabel: {
    color: '#64E1D2',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 3,
  },
  nowText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  expandGlyph: {
    color: '#AEB7CB',
    width: 32,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
  },
  progressRow: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: { color: '#B8C2D8', fontSize: 11, fontWeight: '800' },
  progressTrack: {
    height: 4,
    marginTop: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
  },
  transport: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 6,
  },
  transportPrimary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7657E8',
  },
  transportPrimaryText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  transportSecondary: {
    minWidth: 56,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16223A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  transportSecondaryText: { color: '#D9E0EE', fontSize: 13, fontWeight: '900' },
  compactRemaining: {
    minWidth: 76,
    color: '#AEB7CB',
    fontSize: 11,
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  optionChip: {
    minHeight: 42,
    minWidth: 72,
    paddingHorizontal: 14,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16223A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  optionVoice: { flex: 1, alignItems: 'flex-start' },
  optionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  playerError: {
    marginTop: 8,
    color: '#FF9EA8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
});
