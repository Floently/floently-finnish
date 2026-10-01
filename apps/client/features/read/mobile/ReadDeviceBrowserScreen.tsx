import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  clearPreloadedSource,
  preload,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import {
  readTtsApi,
  type ReadTtsResult,
  type ReadVoice,
  type ReadWordTiming,
} from './readTtsApi';
import {
  createReadingPlaybackManifest,
  formatReadingClock,
  readingPositionForProgress,
  readingPrefetchIndexes,
  readingProgressForSegment,
  type ReadingPlaybackManifest,
} from './readingPlaybackManifest';

const WEB_BROWSER_URL = 'https://read.floently.com/app/browser-v2/live';
const BROWSER_READER_PREFS_KEY = 'floently.read.browser.reader-prefs.v1';
const BROWSER_READER_PROGRESS_PREFIX = 'floently.read.browser.progress.v1:';
const EMPTY_MANIFEST = createReadingPlaybackManifest('', 1, 1400, 220);

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
  language: string;
};

type BrowserAudioState =
  | 'idle'
  | 'extracting'
  | 'preparing'
  | 'playing'
  | 'paused'
  | 'error';

function browserReadingProgressKey(reading: BrowserReading) {
  const stableUrl = reading.url.slice(0, 480);
  return `${BROWSER_READER_PROGRESS_PREFIX}${stableUrl}:${reading.text.length}`;
}

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

function browserVisualPhrase(
  text: string,
  timings: ReadWordTiming[],
  currentTime: number,
  duration: number,
) {
  const sourceWords: string[] = text.match(/[^\s]+/g) ?? [];
  if (!sourceWords.length) return '';

  let activeIndex = 0;
  let words: string[] = sourceWords;

  if (timings.length) {
    words = timings.map((timing) => timing.word).filter(Boolean);
    const found = timings.findIndex((timing) => currentTime <= timing.end);
    activeIndex = found >= 0 ? found : Math.max(0, timings.length - 1);
  } else if (duration > 0) {
    const ratio = Math.max(0, Math.min(0.999, currentTime / duration));
    activeIndex = Math.floor(ratio * sourceWords.length);
  }

  const bucketSize = 7;
  const start = Math.max(
    0,
    Math.min(words.length - 1, Math.floor(activeIndex / bucketSize) * bucketSize),
  );
  return words.slice(start, start + 10).join(' ');
}

function buildReadingFocusScript(text: string) {
  const needle = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 10)
    .join(' ');

  return `
(function () {
  try {
    const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
    const marker = 'data-floently-reading-focus';
    const previous = document.querySelector('[' + marker + '="true"]');
    if (previous) previous.removeAttribute(marker);

    if (!document.getElementById('floently-reading-focus-style')) {
      const style = document.createElement('style');
      style.id = 'floently-reading-focus-style';
      style.textContent =
        '[data-floently-reading-focus="true"]{' +
        'outline:2px solid rgba(118,87,232,.65)!important;' +
        'outline-offset:4px!important;' +
        'border-radius:6px!important;' +
        'animation:floentlyReadingPulse 1.25s ease-out 1!important;' +
        '}' +
        '@keyframes floentlyReadingPulse{' +
        '0%{background-color:rgba(118,87,232,.18)}' +
        '100%{background-color:rgba(118,87,232,0)}' +
        '}';
      (document.head || document.documentElement).appendChild(style);
    }

    const needle = normalize(${JSON.stringify(needle)}).toLowerCase();
    if (!needle) return;

    const needleWords = needle.split(' ').filter(Boolean).slice(0, 8);
    const candidates = Array.from(document.querySelectorAll(
      'p,li,blockquote,h1,h2,h3,h4,h5,h6,td,th,article,section,div'
    )).slice(0, 2500);

    let target = null;
    let targetScore = -1;

    for (const element of candidates) {
      const value = normalize(element.innerText || element.textContent || '');
      if (!value || value.length > 7000) continue;
      const lower = value.toLowerCase();

      let score = 0;
      if (lower.includes(needle)) score += 100;
      for (const word of needleWords) {
        if (word.length >= 3 && lower.includes(word)) score += 4;
      }
      if (value.length < 1800) score += 2;
      if (score > targetScore) {
        target = element;
        targetScore = score;
      }
      if (score >= 100) break;
    }

    if (!target || targetScore < Math.max(8, needleWords.length * 2)) return;
    target.setAttribute(marker, 'true');

    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (viewportHeight > 0 && (rect.top < viewportHeight * .15 || rect.bottom > viewportHeight * .82)) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  } catch (_) {}
  true;
})();
`;
}

function buildClearReadingFocusScript() {
  return `
(function () {
  try {
    const current = document.querySelector('[data-floently-reading-focus="true"]');
    if (current) current.removeAttribute('data-floently-reading-focus');
  } catch (_) {}
  true;
})();
`;
}

const EXTRACT_READABLE_PAGE = `
(function () {
  try {
    const normalizeInline = (value) => String(value || '')
      .replace(/\\u00a0/g, ' ')
      .replace(/[\\t ]+/g, ' ')
      .replace(/ *\\n */g, '\\n')
      .trim();
    const normalizeBlock = (value) => normalizeInline(value)
      .replace(/\\n{2,}/g, '\\n')
      .replace(/\\s+/g, ' ')
      .trim();

    const excludedSelector = [
      'script', 'style', 'noscript', 'template', 'nav', 'footer', 'aside',
      '[role="navigation"]', '[role="dialog"]', '[role="menu"]',
      '[aria-modal="true"]', '[aria-hidden="true"]', '[hidden]',
      '.cookie', '.cookies', '.modal', '.drawer', '.sidebar', '.side-nav',
      '.sidenav', '.toolbar', '.menu', '.advertisement', '.ads'
    ].join(',');

    const rootCandidates = Array.from(document.querySelectorAll(
      'main,article,[role="main"],section,body'
    )).map((element) => {
      const clone = element.cloneNode(true);
      if (clone.querySelectorAll) {
        clone.querySelectorAll(excludedSelector).forEach((node) => node.remove());
      }
      const text = normalizeBlock(clone.innerText || clone.textContent || '');
      const links = element.querySelectorAll
        ? Array.from(element.querySelectorAll('a')).reduce(
            (sum, link) => sum + normalizeBlock(link.innerText).length, 0
          )
        : 0;
      const density = Math.min(1, links / Math.max(1, text.length));
      const semantic = element.matches && element.matches('main,article,[role="main"]') ? 1800 : 0;
      return {
        element,
        text,
        score: Math.min(text.length, 40000) + semantic - density * 7000
      };
    }).filter((entry) => entry.text.length >= 80)
      .sort((a, b) => b.score - a.score);

    const root = rootCandidates[0]?.element || document.body;
    const blocks = Array.from(root.querySelectorAll(
      'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,td,th'
    )).filter((element) => !element.closest(excludedSelector));

    const paragraphs = [];
    let previous = '';
    for (const element of blocks) {
      const value = normalizeBlock(element.innerText || element.textContent || '');
      if (!value || value.length < 2 || value === previous) continue;
      // Avoid a parent/table cell echoing exactly the same text as a nested
      // semantic block while preserving the actual reading order.
      if (previous && value.startsWith(previous) && value.length < previous.length + 12) continue;
      paragraphs.push(value);
      previous = value;
    }

    let text = paragraphs.join('\\n\\n').trim();
    if (text.length < 80) {
      text = rootCandidates[0]?.text || normalizeBlock(document.body?.innerText || '');
    }

    // Repair the most common DOM-boundary artifact before TTS, e.g.
    // "experts.Most" or "DataAI Notice", without changing the rendered page.
    text = text
      .replace(/([.!?])([A-ZÀ-ÖØ-Þ])/g, '$1 $2')
      .trim();

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FLOENTLY_DEVICE_BROWSER_READ_PAGE',
      title: normalizeBlock(document.title) || location.hostname,
      url: location.href,
      language: String(document.documentElement.lang || navigator.language || 'auto'),
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
  const activePlaybackKeyRef = useRef<string | null>(null);
  const startedPlaybackKeyRef = useRef<string | null>(null);
  const lastSavedProgressRef = useRef(0);
  const prefetchGenerationRef = useRef(0);
  const playAttemptRef = useRef(0);
  const playbackHealthRef = useRef({
    playing: false,
    isBuffering: false,
    currentTime: 0,
  });

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
  const [controlsHidden, setControlsHidden] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window !== 'undefined') window.location.assign(WEB_BROWSER_URL);
  }, []);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      // Expo Audio requires exclusive focus for reliable lock-screen controls.
      // It also lets the OS deliver interruption/focus behavior consistently
      // instead of silently mixing a long-form Reader behind another session.
      interruptionMode: 'doNotMix',
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(BROWSER_READER_PREFS_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        const stored = JSON.parse(raw) as { speed?: number; voiceId?: string | null };
        const storedSpeed = Number(stored.speed);
        if (Number.isFinite(storedSpeed)) {
          setSpeed(Math.max(0.8, Math.min(2, storedSpeed)));
        }
        if (typeof stored.voiceId === 'string' && stored.voiceId.trim()) {
          setSelectedVoiceId(stored.voiceId.trim());
        }
      } catch {
        // Corrupt local preferences must never block Browser Reader startup.
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    playbackHealthRef.current = {
      playing: playbackStatus.playing,
      isBuffering: playbackStatus.isBuffering,
      currentTime: playbackStatus.currentTime,
    };
  }, [
    playbackStatus.currentTime,
    playbackStatus.isBuffering,
    playbackStatus.playing,
  ]);

  const monitorPlaybackStart = () => {
    const attempt = ++playAttemptRef.current;

    setTimeout(() => {
      if (playAttemptRef.current !== attempt) return;
      const health = playbackHealthRef.current;
      if (health.playing || health.isBuffering || health.currentTime > 0.05) return;

      setAudioState('paused');
      setAudioError(
        'Audio did not start. If a call or another app is using audio, end or pause it and tap Play again.',
      );
      setPlayerExpanded(true);
    }, 5_000);

    setTimeout(() => {
      if (playAttemptRef.current !== attempt) return;
      const health = playbackHealthRef.current;
      if (health.playing || health.currentTime > 0.05) return;

      player.pause();
      setAudioState('paused');
      setAudioError(
        'Audio is still buffering. Check the connection, then tap Play to retry.',
      );
      setPlayerExpanded(true);
    }, 12_000);
  };

  useEffect(() => {
    let cancelled = false;
    void readTtsApi.listVoices().then((catalog) => {
      if (cancelled) return;
      setVoices(catalog.voices);
      setDefaultVoiceId(catalog.defaultVoiceId);
      setSelectedVoiceId((current) => {
        if (current && catalog.voices.some((voice) => voice.id === current)) {
          return current;
        }
        return catalog.defaultVoiceId;
      });
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
    prefetchGenerationRef.current += 1;
    player.pause();
    try { player.clearLockScreenControls(); } catch {}
    for (const url of preloadCache.current.keys()) {
      void clearPreloadedSource(url).catch(() => {});
    }
    preloadCache.current.clear();
  }, [player]);

  const clearPreparedAudio = () => {
    playAttemptRef.current += 1;
    prefetchGenerationRef.current += 1;
    player.pause();
    webViewRef.current?.injectJavaScript(buildClearReadingFocusScript());
    setAudioResult(null);
    audioCache.current.clear();
    for (const url of preloadCache.current.keys()) {
      void clearPreloadedSource(url).catch(() => {});
    }
    preloadCache.current.clear();
    handledFinishedRef.current = null;
    activePlaybackKeyRef.current = null;
    startedPlaybackKeyRef.current = null;
  };

  const readingLanguage = String(reading?.language || 'auto')
    .trim()
    .toLowerCase()
    .split('-')[0];
  const browserVoices = useMemo(() => {
    if (!voices.length || !readingLanguage || readingLanguage === 'auto') return voices;
    const matching = voices.filter((voice) => {
      const voiceLanguage = String(voice.language || '').toLowerCase().split('-')[0];
      const voiceLocale = String(voice.locale || '').toLowerCase().split('-')[0];
      return voiceLanguage === readingLanguage || voiceLocale === readingLanguage;
    });
    return matching.length ? matching : voices;
  }, [readingLanguage, voices]);
  const selectedVoice =
    browserVoices.find((voice) => voice.id === selectedVoiceId) ||
    browserVoices.find((voice) => voice.id === defaultVoiceId) ||
    browserVoices[0] ||
    voices[0] ||
    null;
  const effectiveVoiceId = selectedVoice?.id || defaultVoiceId || selectedVoiceId;

  const activeText = manifest.segments[activeSegment]?.text || '';
  const activeVisualPhrase = useMemo(
    () => browserVisualPhrase(
      activeText,
      audioResult?.wordTimings ?? [],
      playbackStatus.currentTime,
      playbackStatus.duration,
    ),
    [
      activeText,
      audioResult?.wordTimings,
      playbackStatus.currentTime,
      playbackStatus.duration,
    ],
  );

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
  const progressSaveThreshold =
    totalSeconds > 0 ? Math.min(0.01, 15 / totalSeconds) : 0.01;

  const persistBrowserProgress = (value = displayedProgress) => {
    if (!reading) return;
    const next = Math.max(0, Math.min(1, value));
    lastSavedProgressRef.current = next;
    void AsyncStorage.setItem(
      browserReadingProgressKey(reading),
      String(next),
    ).catch(() => {});
  };

  useEffect(() => {
    if (!reading || !manifest.segments.length) return;
    if (
      displayedProgress < 1 &&
      Math.abs(displayedProgress - lastSavedProgressRef.current) < progressSaveThreshold
    ) return;

    persistBrowserProgress(displayedProgress);
  }, [
    displayedProgress,
    manifest.segments.length,
    progressSaveThreshold,
    reading,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && reading) {
        persistBrowserProgress(displayedProgress);
      }
    });
    return () => subscription.remove();
  }, [displayedProgress, reading]);

  const isPlaying = audioState === 'playing' || playbackStatus.playing;
  const playbackHasStarted =
    playbackStatus.playing &&
    !playbackStatus.isBuffering &&
    playbackStatus.currentTime > 0.05;
  const isPreparing =
    audioState === 'extracting' ||
    audioState === 'preparing' ||
    playbackStatus.isBuffering;

  useEffect(() => {
    if (!reading || !isPlaying || !activeVisualPhrase) return;
    webViewRef.current?.injectJavaScript(buildReadingFocusScript(activeVisualPhrase));
  }, [activeVisualPhrase, isPlaying, reading?.url]);

  useEffect(() => {
    if (!reading || !playbackHasStarted || playerExpanded || audioError) {
      setControlsHidden(false);
      return;
    }
    if (controlsHidden) return;

    const timer = setTimeout(() => setControlsHidden(true), 3_500);
    return () => clearTimeout(timer);
  }, [audioError, controlsHidden, playbackHasStarted, playerExpanded, reading?.url]);

  const chunkKey = (index: number) =>
    `${reading?.url || currentUrl || 'page'}:${effectiveVoiceId || 'default'}:${index}`;

  const prepareSegment = async (index: number) => {
    const segment = manifest.segments[index];
    if (!segment?.text) throw new Error('No readable section is available at this position.');
    const key = chunkKey(index);
    const cached = audioCache.current.get(key);
    if (cached) return cached;

    const result = await readTtsApi.prerenderReading({
      text: segment.text,
      language: reading?.language || 'auto',
      voiceId: effectiveVoiceId,
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
    const indexes = readingPrefetchIndexes(manifest, index, 90, 4);
    const generation = ++prefetchGenerationRef.current;

    // Prioritize the immediately upcoming hidden segment. Firing four neural
    // synthesis requests at once can delay the one clip that must be ready
    // first on constrained/mobile networks and on a warming TTS backend.
    void (async () => {
      for (const nextIndex of indexes) {
        if (prefetchGenerationRef.current !== generation) return;
        try {
          await preloadSegment(nextIndex);
        } catch {
          // A failed speculative preload must never stop the active reading.
          // playSegment() will make a fresh request if that segment is reached.
        }
      }
    })();
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
      const playbackKey = `${reading?.url || currentUrl || 'page'}:${index}:${result.cacheKey || result.audioUrl}`;
      activePlaybackKeyRef.current = playbackKey;
      startedPlaybackKeyRef.current = null;
      webViewRef.current?.injectJavaScript(
        buildReadingFocusScript(browserVisualPhrase(segment.text, result.wordTimings, 0, Number(result.duration || 0))),
      );
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
      monitorPlaybackStart();
      setAudioState('playing');
      setPlayerExpanded(false);
      setControlsHidden(false);
      prefetchAhead(index);
    } catch (error) {
      setAudioState('error');
      setAudioError(error instanceof Error ? error.message : String(error));
      setPlayerExpanded(true);
    }
  };

  useEffect(() => {
    if (!reading || !audioResult) return;
    const currentKey = `${reading.url}:${activeSegment}:${audioResult.cacheKey || audioResult.audioUrl}`;
    if (
      activePlaybackKeyRef.current === currentKey &&
      (playbackStatus.playing || playbackStatus.currentTime > 0)
    ) {
      startedPlaybackKeyRef.current = currentKey;
    }
  }, [
    activeSegment,
    audioResult,
    playbackStatus.currentTime,
    playbackStatus.playing,
    reading,
  ]);

  useEffect(() => {
    if (!reading || !audioResult || !playbackStatus.didJustFinish) return;
    const key = `${reading.url}:${activeSegment}:${audioResult.cacheKey || audioResult.audioUrl}`;
    if (
      activePlaybackKeyRef.current !== key ||
      startedPlaybackKeyRef.current !== key ||
      handledFinishedRef.current === key
    ) return;
    handledFinishedRef.current = key;
    startedPlaybackKeyRef.current = null;

    const next = activeSegment + 1;
    if (next < manifest.segments.length) {
      void playSegment(next);
      return;
    }

    setAudioState('paused');
    webViewRef.current?.injectJavaScript(buildClearReadingFocusScript());
    try { player.clearLockScreenControls(); } catch {}
  }, [
    activeSegment,
    audioResult,
    manifest.segments.length,
    playbackStatus.didJustFinish,
    reading,
  ]);

  const hardRestart = (message = 'Reloading with a fresh browser process…') => {
    persistBrowserProgress(displayedProgress);
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

  const stopReadingPage = () => {
    persistBrowserProgress(displayedProgress);
    clearPreparedAudio();
    setReading(null);
    setManifest(EMPTY_MANIFEST);
    setActiveSegment(0);
    resumeFractionRef.current = 0;
    setAudioState('idle');
    setAudioError(null);
    setPlayerExpanded(false);
    setControlsHidden(false);
    setStatus('Ready');
  };

  const openAddress = () => {
    const target = normalizeAddress(addressText);
    if (!target) {
      setLoadError('Enter a website address or search term.');
      return;
    }
    persistBrowserProgress(displayedProgress);
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
        persistBrowserProgress(displayedProgress);
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

  const startReadingPage = async (payload: BrowserReading) => {
    const nextManifest = createReadingPlaybackManifest(payload.text, speed, 1400, 220);
    if (!nextManifest.segments.length) {
      setAudioState('error');
      setAudioError('No readable text was found on this page.');
      return;
    }

    let savedProgress = 0;
    try {
      const raw = await AsyncStorage.getItem(browserReadingProgressKey(payload));
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0 && parsed < 0.995) {
        savedProgress = parsed;
      }
    } catch {}

    const savedPosition = readingPositionForProgress(nextManifest, savedProgress);
    clearPreparedAudio();
    setReading(payload);
    setManifest(nextManifest);
    setActiveSegment(savedPosition.index);
    setAudioResult(null);
    resumeFractionRef.current = savedPosition.fraction;
    lastSavedProgressRef.current = savedProgress;
    setAudioState('paused');
    setAudioError(null);
    setStatus(savedProgress > 0 ? 'Resuming this page' : 'Reader ready on this page');

    // Start only after React has committed the new manifest. A zero-delay task
    // avoids racing playSegment against the previous empty manifest.
    setTimeout(() => {
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
      playAttemptRef.current += 1;
      player.pause();
      persistBrowserProgress(displayedProgress);
      setAudioState('paused');
      return;
    }

    if (audioResult?.audioUrl) {
      setPlayerPlaybackRate(player, speed);
      enableLockScreen();
      player.play();
      monitorPlaybackStart();
      setAudioState('playing');
      setPlayerExpanded(false);
      setControlsHidden(false);
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
      try {
        await player.seekTo(playbackStatus.duration * target.fraction);
      } catch {
        // A freshly replaced iOS media item can briefly reject seek. Reload
        // that same hidden segment at the logical target rather than making
        // the ±10 second control appear dead.
        player.pause();
        setAudioResult(null);
        activePlaybackKeyRef.current = null;
        startedPlaybackKeyRef.current = null;
        resumeFractionRef.current = target.fraction;
        if (wasPlaying) await playSegment(target.index);
      }
      return;
    }

    player.pause();
    setActiveSegment(target.index);
    setAudioResult(null);
    resumeFractionRef.current = target.fraction;
    handledFinishedRef.current = null;
    activePlaybackKeyRef.current = null;
    startedPlaybackKeyRef.current = null;

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
    void AsyncStorage.setItem(
      BROWSER_READER_PREFS_KEY,
      JSON.stringify({ speed: next, voiceId: selectedVoiceId || null }),
    ).catch(() => {});

    if (!reading) return;
    const nextManifest = createReadingPlaybackManifest(reading.text, next, 1400, 220);
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
    if (!browserVoices.length) return;
    const wasPlaying = isPlaying;
    const current = browserVoices.findIndex((voice) => voice.id === selectedVoice?.id);
    const next = browserVoices[(current + 1 + browserVoices.length) % browserVoices.length];
    if (!next) return;

    const progress = displayedProgress;
    clearPreparedAudio();
    setSelectedVoiceId(next.id);
    void AsyncStorage.setItem(
      BROWSER_READER_PREFS_KEY,
      JSON.stringify({ speed, voiceId: next.id }),
    ).catch(() => {});
    const position = readingPositionForProgress(manifest, progress);
    setActiveSegment(position.index);
    resumeFractionRef.current = position.fraction;
    setControlsHidden(false);
    // React commits the new voice id before the preparing effect runs, so a
    // voice change during playback resumes at the same logical cursor using
    // the new voice instead of silently stopping the reading.
    setAudioState(wasPlaying ? 'preparing' : 'paused');
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
              }
              // Sites frequently probe custom app schemes in the background.
              // Ignore unsupported probes silently; they are not a page-load
              // failure and must never replace the browser's Ready state.
              return false;
            }}
            onOpenWindow={(event) => {
              const target = event.nativeEvent.targetUrl;
              if (/^https?:\/\//i.test(target)) {
                persistBrowserProgress(displayedProgress);
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
                  language?: string;
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

                void startReadingPage({
                  title: String(payload.title || 'Web reading'),
                  url: String(payload.url || currentUrl || ''),
                  language: String(payload.language || 'auto'),
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
          controlsHidden && isPlaying ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show reader controls"
              onPress={() => setControlsHidden(false)}
              style={styles.hiddenPlayerPill}
            >
              <Text style={styles.hiddenPlayerIcon}>⌃</Text>
            </Pressable>
          ) : (
          <View style={[styles.player, playerExpanded && styles.playerExpanded]}>
            {!playerExpanded ? (
              <>
                <View style={styles.compactBar}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? 'Pause reading' : 'Play reading'}
                    disabled={isPreparing}
                    onPress={togglePlayback}
                    style={[styles.compactPlay, isPreparing && styles.disabled]}
                  >
                    {isPreparing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.compactPlayText}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Expand reader controls"
                    accessibilityState={{ expanded: false }}
                    onPress={() => setPlayerExpanded(true)}
                    style={styles.compactNow}
                  >
                    <Text style={styles.nowLabel}>NOW READING</Text>
                    <Text numberOfLines={1} style={styles.compactNowText}>
                      {activeText || reading.title}
                    </Text>
                  </Pressable>

                  <Text style={styles.compactRemaining}>
                    {formatReadingClock(Math.max(0, totalSeconds - currentSeconds))}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Expand reader controls"
                    onPress={() => setPlayerExpanded(true)}
                    style={styles.compactExpand}
                  >
                    <Text style={styles.expandGlyph}>⌃</Text>
                  </Pressable>
                </View>
                <View style={[styles.progressTrack, styles.compactProgressTrack]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(0, Math.min(100, displayedProgress * 100))}%` },
                    ]}
                  />
                </View>
              </>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minimize reader controls"
                  accessibilityState={{ expanded: true }}
                  onPress={() => setPlayerExpanded(false)}
                  style={styles.playerTop}
                >
                  <View style={styles.nowReading}>
                    <Text style={styles.nowLabel}>NOW READING</Text>
                    <Text numberOfLines={2} style={styles.nowText}>
                      {activeText || reading.title}
                    </Text>
                  </View>
                  <Text style={styles.expandGlyph}>⌄</Text>
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
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back 10 seconds"
                    onPress={() => { void seekBySeconds(-10); }}
                    style={styles.transportSecondary}
                  >
                    <Text style={styles.transportSecondaryText}>-10s</Text>
                  </Pressable>

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

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Forward 10 seconds"
                    onPress={() => { void seekBySeconds(10); }}
                    style={styles.transportSecondary}
                  >
                    <Text style={styles.transportSecondaryText}>+10s</Text>
                  </Pressable>
                </View>

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
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Stop reading this page"
                    onPress={stopReadingPage}
                    style={[styles.optionChip, styles.stopChip]}
                  >
                    <Text style={styles.stopChipText}>Stop</Text>
                  </Pressable>
                </View>
              </>
            )}

            {audioError ? <Text style={styles.playerError}>{audioError}</Text> : null}
          </View>
          )
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

  hiddenPlayerPill: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,18,32,0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132,111,255,0.55)',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  hiddenPlayerIcon: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
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
  compactBar: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  compactPlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7657E8',
  },
  compactPlayText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  compactNow: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  compactNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  compactExpand: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  compactProgressTrack: {
    marginTop: 4,
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
    minWidth: 58,
    color: '#AEB7CB',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
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
  stopChip: { minWidth: 64, backgroundColor: 'rgba(255,94,108,0.10)' },
  stopChipText: { color: '#FF9EA8', fontSize: 12, fontWeight: '900' },
  playerError: {
    marginTop: 8,
    color: '#FF9EA8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
});
