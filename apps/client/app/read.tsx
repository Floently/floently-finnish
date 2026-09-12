import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const NativeWebView: any = WebView;

const DEFAULT_URL = 'https://www.udacity.com/';

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

const EXTRACT_SCRIPT = `
(() => {
  try {
    const blocked = new Set(['SCRIPT','STYLE','NOSCRIPT','NAV','ASIDE','FOOTER','FORM']);
    const selectors = [
      'main','article','[role="main"]',
      '[class*="lesson" i]','[class*="lecture" i]','[class*="concept" i]',
      '[class*="transcript" i]','[class*="content" i]','[class*="prose" i]'
    ];
    const candidates = Array.from(new Set(selectors.flatMap((s) => Array.from(document.querySelectorAll(s)))));
    const visible = (el) => {
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.05 && r.width > 80 && r.height > 24;
    };
    const score = (el) => {
      if (!visible(el) || blocked.has(el.tagName)) return -1e9;
      const text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
      if (text.length < 80) return -1e9;
      const r = el.getBoundingClientRect();
      const links = Array.from(el.querySelectorAll('a')).reduce((n,a) => n + ((a.innerText||'').length), 0);
      const controls = el.querySelectorAll('button,input,select,textarea,[role="button"],[role="navigation"]').length;
      const chrome = el.querySelectorAll('nav,aside,[role="navigation"],[class*="sidebar" i],[class*="drawer" i],[class*="menu" i]').length;
      const paragraphs = el.querySelectorAll('p,li,h1,h2,h3,h4').length;
      const centerBonus = r.left < innerWidth/2 && r.right > innerWidth/2 ? 1600 : 0;
      return text.length + paragraphs*120 + centerBonus - links*1.2 - controls*180 - chrome*1200 - Math.abs((r.left+r.right)/2 - innerWidth/2)*1.5;
    };
    let best = candidates.sort((a,b) => score(b)-score(a))[0] || document.querySelector('main') || document.body;
    const clone = best.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,nav,aside,footer,form,[role="navigation"],[role="dialog"],[aria-hidden="true"],[class*="sidebar" i],[class*="drawer" i],[class*="menu" i],[class*="cookie" i]').forEach((n) => n.remove());
    const text = (clone.innerText || '').replace(/\\n{3,}/g,'\\n\\n').replace(/[ \\t]+/g,' ').trim();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'READ_TEXT', text, title: document.title, url: location.href }));
  } catch (error) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'READ_ERROR', message: String(error && error.message || error) }));
  }
})(); true;
`;

function splitForSpeech(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [clean];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (next.length > 900 && current) {
      chunks.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export default function ReadBrowserScreen() {
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const initialUrl = useMemo(() => normalizeUrl(Array.isArray(params.url) ? params.url[0] ?? DEFAULT_URL : params.url ?? DEFAULT_URL), [params.url]);
  const webRef = useRef<any>(null);
  const chunksRef = useRef<string[]>([]);
  const speechIndexRef = useRef(0);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [address, setAddress] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState('Open your course, sign in, then tap Read page.');
  const [rate, setRate] = useState(0.95);

  const stopSpeaking = async () => {
    await Speech.stop();
    setReading(false);
  };

  const speakChunk = (index: number) => {
    const chunk = chunksRef.current[index];
    if (!chunk) {
      setReading(false);
      setStatus('Finished reading this page.');
      return;
    }
    speechIndexRef.current = index;
    setReading(true);
    setStatus(`Reading ${index + 1} of ${chunksRef.current.length}`);
    Speech.speak(chunk, {
      rate,
      onDone: () => speakChunk(index + 1),
      onStopped: () => setReading(false),
      onError: () => {
        setReading(false);
        setStatus('Speech stopped. Tap Read page to retry.');
      },
    });
  };

  const readPage = async () => {
    await Speech.stop();
    chunksRef.current = [];
    speechIndexRef.current = 0;
    setReading(false);
    setStatus('Finding the main lesson text…');
    webRef.current?.injectJavaScript(EXTRACT_SCRIPT);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'READ_ERROR') {
        setStatus(payload.message || 'Could not read this page.');
        return;
      }
      if (payload?.type !== 'READ_TEXT') return;
      const text = String(payload.text || '').trim();
      const chunks = splitForSpeech(text);
      if (!chunks.length) {
        setStatus('No readable lesson text was found on this view.');
        return;
      }
      chunksRef.current = chunks;
      speechIndexRef.current = 0;
      speakChunk(0);
    } catch {
      // Ignore messages that are not part of the Read bridge.
    }
  };

  const go = () => {
    Keyboard.dismiss();
    const next = normalizeUrl(address);
    setCurrentUrl(next);
    setAddress(next);
    void stopSpeaking();
  };

  const changeRate = () => {
    const values = [0.8, 0.95, 1.1, 1.25];
    const next = values[(values.findIndex((value) => value === rate) + 1) % values.length];
    setRate(next);
    setStatus(`Speech speed ${next}×`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/read-home' as never)} style={styles.homeButton} accessibilityLabel="Back to Floently Read">
          <Text style={styles.homeText}>F</Text>
        </Pressable>
        <Pressable disabled={!canGoBack} onPress={() => webRef.current?.goBack()} style={[styles.iconButton, !canGoBack && styles.disabled]}>
          <Text style={styles.iconText}>‹</Text>
        </Pressable>
        <Pressable disabled={!canGoForward} onPress={() => webRef.current?.goForward()} style={[styles.iconButton, !canGoForward && styles.disabled]}>
          <Text style={styles.iconText}>›</Text>
        </Pressable>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setAddress}
          onSubmitEditing={go}
          selectTextOnFocus
          style={styles.address}
          value={address}
        />
        <Pressable onPress={go} style={styles.goButton}><Text style={styles.goText}>Go</Text></Pressable>
      </View>

      <View style={styles.webWrap}>
        <NativeWebView
          ref={webRef}
          source={{ uri: currentUrl }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          onMessage={handleMessage}
          onNavigationStateChange={(nav: any) => {
            setCanGoBack(nav.canGoBack);
            setCanGoForward(nav.canGoForward);
            if (nav.url) setAddress(nav.url);
          }}
          onShouldStartLoadWithRequest={(request: any) => {
            const url = request.url || '';
            if (/^https?:\/\//i.test(url) || url === 'about:blank') return true;
            Alert.alert('Open external app?', url, [
              { text: 'Cancel', style: 'cancel' },
            ]);
            return false;
          }}
          onContentProcessDidTerminate={() => {
            setStatus('Website process restarted. Reloading…');
            webRef.current?.reload();
          }}
          style={styles.web}
        />
      </View>

      <View style={styles.readerBar}>
        <View style={styles.statusWrap}>
          <Text numberOfLines={2} style={styles.status}>{status}</Text>
        </View>
        <Pressable onPress={changeRate} style={styles.smallButton}><Text style={styles.smallText}>{rate}×</Text></Pressable>
        <Pressable onPress={reading ? stopSpeaking : readPage} style={styles.readButton}>
          <Text style={styles.readText}>{reading ? 'Stop' : 'Read page'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b111c' },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#101827', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#273247' },
  homeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364ff' },
  homeText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2435' },
  disabled: { opacity: 0.35 },
  iconText: { color: '#fff', fontSize: 31, lineHeight: 34 },
  address: { flex: 1, minHeight: 40, borderRadius: 14, paddingHorizontal: 12, color: '#f7f9ff', backgroundColor: '#182233', fontSize: 14 },
  goButton: { height: 40, minWidth: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364ff' },
  goText: { color: '#fff', fontWeight: '700' },
  webWrap: { flex: 1, backgroundColor: '#fff' },
  web: { flex: 1 },
  readerBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#101827', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#273247' },
  statusWrap: { flex: 1 },
  status: { color: '#c7d0df', fontSize: 12, lineHeight: 16 },
  smallButton: { minWidth: 50, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2435' },
  smallText: { color: '#fff', fontWeight: '700' },
  readButton: { minWidth: 96, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364ff', paddingHorizontal: 14 },
  readText: { color: '#fff', fontWeight: '800' },
});
