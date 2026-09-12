import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const NativeWebView: any = WebView;

type DeviceVoice = { identifier: string; name: string; quality: string; language: string };

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
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'READ_TEXT', text, title: document.title, url: location.href, lang: document.documentElement.lang || 'en-US' }));
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
    if (next.length > 420 && current) {
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
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState('Open your course, sign in, then tap Read page.');
  const [rate, setRate] = useState(0.95);
  const [voices, setVoices] = useState<DeviceVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [pageLanguage, setPageLanguage] = useState('en-US');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const Speech = await import('expo-speech');
        const available = (await Speech.getAvailableVoicesAsync()) as DeviceVoice[];
        if (!active) return;
        const sorted = [...available].sort((a, b) => {
          const aEnglish = /^en[-_]/i.test(a.language) ? 0 : 1;
          const bEnglish = /^en[-_]/i.test(b.language) ? 0 : 1;
          if (aEnglish !== bEnglish) return aEnglish - bEnglish;
          const aEnhanced = /enhanced/i.test(a.quality) ? 0 : 1;
          const bEnhanced = /enhanced/i.test(b.quality) ? 0 : 1;
          if (aEnhanced !== bEnhanced) return aEnhanced - bEnhanced;
          return `${a.language} ${a.name}`.localeCompare(`${b.language} ${b.name}`);
        });
        setVoices(sorted);
        const english = sorted.find((voice) => /^en-US/i.test(voice.language) && /enhanced/i.test(voice.quality))
          ?? sorted.find((voice) => /^en-US/i.test(voice.language))
          ?? sorted.find((voice) => /^en-GB/i.test(voice.language))
          ?? sorted.find((voice) => /^en[-_]/i.test(voice.language));
        if (english) setSelectedVoiceId(english.identifier);
      } catch {
        // Speech remains usable with an explicit English language even if voice enumeration fails.
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedVoice = voices.find((voice) => voice.identifier === selectedVoiceId) ?? null;
  const voiceLabel = selectedVoice ? selectedVoice.name : 'System English';

  const stopSpeaking = async () => {
    try {
      const Speech = await import('expo-speech');
      await Speech.stop();
    } finally {
      setReading(false);
      setPaused(false);
    }
  };

  const speakChunk = async (index: number) => {
    const chunk = chunksRef.current[index];
    if (!chunk) {
      setReading(false);
      setStatus('Finished reading this page.');
      return;
    }
    speechIndexRef.current = index;
    setReading(true);
    setStatus(`Reading ${index + 1} of ${chunksRef.current.length}`);
    const Speech = await import('expo-speech');
    Speech.speak(chunk, {
      rate,
      language: selectedVoice?.language || (/^en/i.test(pageLanguage) ? 'en-US' : pageLanguage || 'en-US'),
      voice: selectedVoice?.identifier,
      onStart: () => { setPaused(false); setReading(true); },
      onDone: () => { void speakChunk(index + 1); },
      onStopped: () => { setReading(false); setPaused(false); },
      onError: () => {
        setReading(false);
        setStatus('Speech stopped. Tap Read page to retry.');
      },
    });
  };

  const readPage = async () => {
    const Speech = await import('expo-speech');
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
      if (payload.lang) setPageLanguage(String(payload.lang));
      const text = String(payload.text || '').trim();
      const chunks = splitForSpeech(text);
      if (!chunks.length) {
        setStatus('No readable lesson text was found on this view.');
        return;
      }
      chunksRef.current = chunks;
      speechIndexRef.current = 0;
      void speakChunk(0);
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

  const changeRate = (delta: number) => {
    const next = Math.min(2, Math.max(0.5, Math.round((rate + delta) * 10) / 10));
    setRate(next);
    setStatus(`Speed ${next.toFixed(1)}×. It applies to the next spoken segment.`);
  };

  const togglePause = async () => {
    const Speech = await import('expo-speech');
    if (paused) {
      await Speech.resume();
      setPaused(false);
      setReading(true);
      setStatus('Reading resumed.');
    } else {
      await Speech.pause();
      setPaused(true);
      setStatus('Reading paused.');
    }
  };

  const readSelection = async () => {
    await stopSpeaking();
    setStatus('Reading selected text…');
    webRef.current?.injectJavaScript(`(() => {
      const text = (window.getSelection && window.getSelection().toString() || '').trim();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'READ_TEXT', text, title:document.title, url:location.href, lang:document.documentElement.lang || 'en-US'
      }));
    })(); true;`);
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
        <Text numberOfLines={2} style={styles.status}>{status}</Text>
        <View style={styles.controlRow}>
          <Pressable onPress={() => setVoicePickerOpen(true)} style={styles.voiceButton}>
            <Text style={styles.controlKicker}>VOICE</Text>
            <Text numberOfLines={1} style={styles.voiceText}>{voiceLabel}</Text>
          </Pressable>
          <View style={styles.speedGroup}>
            <Pressable onPress={() => changeRate(-0.1)} style={styles.speedButton}><Text style={styles.speedGlyph}>−</Text></Pressable>
            <Text style={styles.speedValue}>{rate.toFixed(1)}×</Text>
            <Pressable onPress={() => changeRate(0.1)} style={styles.speedButton}><Text style={styles.speedGlyph}>+</Text></Pressable>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable onPress={readPage} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Read page</Text></Pressable>
          <Pressable onPress={readSelection} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Selection</Text></Pressable>
          {reading || paused ? (
            <>
              <Pressable onPress={togglePause} style={styles.primaryAction}><Text style={styles.primaryActionText}>{paused ? 'Resume' : 'Pause'}</Text></Pressable>
              <Pressable onPress={stopSpeaking} style={styles.stopAction}><Text style={styles.stopActionText}>Stop</Text></Pressable>
            </>
          ) : null}
        </View>
      </View>

      <Modal visible={voicePickerOpen} transparent animationType="slide" onRequestClose={() => setVoicePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.voiceSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetKicker}>READ VOICE</Text>
                <Text style={styles.sheetTitle}>Choose a voice</Text>
              </View>
              <Pressable onPress={() => setVoicePickerOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>Done</Text></Pressable>
            </View>
            <Pressable
              onPress={() => { setSelectedVoiceId(null); setPageLanguage('en-US'); setVoicePickerOpen(false); setStatus('Voice set to System English.'); }}
              style={[styles.voiceOption, !selectedVoiceId && styles.voiceOptionSelected]}
            >
              <View><Text style={styles.voiceOptionName}>System English</Text><Text style={styles.voiceOptionMeta}>English · automatic iPhone voice</Text></View>
              {!selectedVoiceId ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
            <ScrollView style={styles.voiceList} contentContainerStyle={styles.voiceListContent}>
              {voices.map((voice) => (
                <Pressable
                  key={voice.identifier}
                  onPress={() => { setSelectedVoiceId(voice.identifier); setVoicePickerOpen(false); setStatus(`Voice: ${voice.name} (${voice.language})`); }}
                  style={[styles.voiceOption, selectedVoiceId === voice.identifier && styles.voiceOptionSelected]}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceOptionName}>{voice.name}</Text>
                    <Text style={styles.voiceOptionMeta}>{voice.language} · {voice.quality}</Text>
                  </View>
                  {selectedVoiceId === voice.identifier ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  readerBar: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, gap: 8, backgroundColor: '#101827', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#273247' },
  status: { color: '#c7d0df', fontSize: 11, lineHeight: 15, minHeight: 15 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceButton: { flex: 1, minHeight: 46, borderRadius: 15, backgroundColor: '#18243a', paddingHorizontal: 12, justifyContent: 'center' },
  controlKicker: { color: '#7ea0ff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  voiceText: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 2 },
  speedGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: '#18243a', overflow: 'hidden' },
  speedButton: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center' },
  speedGlyph: { color: '#fff', fontSize: 24, lineHeight: 26, fontWeight: '700' },
  speedValue: { color: '#fff', width: 48, textAlign: 'center', fontSize: 13, fontWeight: '900' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  secondaryAction: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2435', paddingHorizontal: 8 },
  secondaryActionText: { color: '#e7ecf8', fontSize: 12, fontWeight: '800' },
  primaryAction: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364ff', paddingHorizontal: 8 },
  primaryActionText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stopAction: { minWidth: 58, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a3548', paddingHorizontal: 8 },
  stopActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.52)' },
  voiceSheet: { maxHeight: '72%', backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, borderTopWidth: 1, borderColor: '#273247' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetKicker: { color: '#7ea0ff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sheetTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  closeButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#1a2435', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontWeight: '800' },
  voiceList: { marginTop: 8 },
  voiceListContent: { paddingBottom: 18, gap: 7 },
  voiceOption: { minHeight: 58, borderRadius: 16, backgroundColor: '#162033', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'transparent' },
  voiceOptionSelected: { borderColor: '#5364ff', backgroundColor: '#19294f' },
  voiceInfo: { flex: 1, paddingRight: 12 },
  voiceOptionName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  voiceOptionMeta: { color: '#99a6ba', fontSize: 11, marginTop: 3 },
  check: { color: '#7ea0ff', fontSize: 18, fontWeight: '900' },
});
