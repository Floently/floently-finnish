import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { createReadProjectFromText, fetchReadVoices, type ReadVoice } from '@core/api/read';
import { useAuthStore } from '../state/authStore';
import { formatReadTime, useReadNarrator } from '../features/read/useReadNarrator';

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
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'READ_TEXT', text, title: document.title, url: location.href, lang: document.documentElement.lang || 'en-US' }));
  } catch (error) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'READ_ERROR', message: String(error && error.message || error) }));
  }
})(); true;
`;

export default function ReadBrowserScreen() {
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const initialUrl = useMemo(() => normalizeUrl(Array.isArray(params.url) ? params.url[0] ?? DEFAULT_URL : params.url ?? DEFAULT_URL), [params.url]);
  const webRef = useRef<any>(null);
  const token = useAuthStore((state) => state.token);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [address, setAddress] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [manualStatus, setManualStatus] = useState('Open your course, sign in, then tap Read page.');
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<ReadVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [pageLanguage, setPageLanguage] = useState('en-US');
  const [lastExtracted, setLastExtracted] = useState<{ text: string; title: string; url: string } | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const selectedVoice = voices.find((voice) => voice.id === selectedVoiceId) ?? voices[0] ?? null;
  const narrator = useReadNarrator({ token, voice: selectedVoice, rate });

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const catalog = await fetchReadVoices();
        if (cancelled) return;
        const sorted = [...catalog.voices].sort((a, b) => {
          const pa = a.provider.toLowerCase() === 'google' ? 0 : a.provider.toLowerCase() === 'azure' ? 1 : 2;
          const pb = b.provider.toLowerCase() === 'google' ? 0 : b.provider.toLowerCase() === 'azure' ? 1 : 2;
          if (pa !== pb) return pa - pb;
          const ae = /^en/i.test(a.language) ? 0 : 1;
          const be = /^en/i.test(b.language) ? 0 : 1;
          if (ae !== be) return ae - be;
          return `${a.name} ${a.locale}`.localeCompare(`${b.name} ${b.locale}`);
        });
        setVoices(sorted);
        const preferred = sorted.find((voice) => voice.id === catalog.defaultVoiceId)
          ?? sorted.find((voice) => voice.provider.toLowerCase() === 'google' && /^en/i.test(voice.language))
          ?? sorted[0];
        if (preferred) setSelectedVoiceId(preferred.id);
      } catch (error) {
        if (!cancelled) setManualStatus(error instanceof Error ? error.message : 'Could not load Read voices.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const voiceLabel = selectedVoice ? selectedVoice.name : 'Loading voices…';
  const status = narrator.error
    ? narrator.error
    : narrator.buffering
      ? `Preparing audio ${Math.min(narrator.currentSegment + 1, Math.max(narrator.totalSegments, 1))} of ${Math.max(narrator.totalSegments, 1)}…`
      : narrator.active
        ? `${narrator.paused ? 'Paused' : 'Reading'} ${narrator.currentSegment + 1} of ${narrator.totalSegments} · ${formatReadTime(narrator.currentTime)} / ${formatReadTime(narrator.duration)}${narrator.currentWord ? ` · ${narrator.currentWord}` : ''}`
        : narrator.totalSegments > 0 && narrator.progress >= 0.999
          ? 'Finished reading this page.'
          : manualStatus;

  const readPage = () => {
    narrator.stop();
    setManualStatus('Finding the main lesson text…');
    webRef.current?.injectJavaScript(EXTRACT_SCRIPT);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'READ_ERROR') {
        setManualStatus(payload.message || 'Could not read this page.');
        return;
      }
      if (payload?.type !== 'READ_TEXT') return;
      if (payload.lang) setPageLanguage(String(payload.lang));
      const text = String(payload.text || '').trim();
      if (!text) {
        setManualStatus('No readable lesson text was found on this view.');
        return;
      }
      const extracted = {
        text,
        title: String(payload.title || 'Web reading').trim() || 'Web reading',
        url: String(payload.url || address).trim(),
      };
      setLastExtracted(extracted);
      setManualStatus(`Ready · ${extracted.title}`);
      void narrator.start(text);
    } catch {
      // Ignore messages outside the Read bridge.
    }
  };

  const go = () => {
    Keyboard.dismiss();
    const next = normalizeUrl(address);
    setCurrentUrl(next);
    setAddress(next);
    narrator.stop();
    setManualStatus('Page changed. Tap Read page when you are ready.');
  };

  const changeRate = (delta: number) => {
    const next = Math.min(2, Math.max(0.5, Math.round((rate + delta) * 10) / 10));
    setRate(next);
    setManualStatus(`Speed ${next.toFixed(1)}×.`);
  };

  const readSelection = () => {
    narrator.stop();
    setManualStatus('Finding selected text…');
    webRef.current?.injectJavaScript(`(() => {
      const text = (window.getSelection && window.getSelection().toString() || '').trim();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'READ_TEXT', text, title:document.title, url:location.href, lang:document.documentElement.lang || 'en-US'
      }));
    })(); true;`);
  };

  const saveCurrentReading = async () => {
    if (!token || !lastExtracted || savingPage) return;
    setSavingPage(true);
    setManualStatus('Saving this reading to your Library…');
    try {
      const project = await createReadProjectFromText(token, { text: lastExtracted.text, title: lastExtracted.title });
      setManualStatus(`Saved to Library · ${project.title}`);
    } catch (cause) {
      setManualStatus(cause instanceof Error ? cause.message : 'Could not save this reading.');
    } finally {
      setSavingPage(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => { narrator.stop(); router.replace('/read-home' as never); }} style={styles.homeButton} accessibilityLabel="Back to Floently Read">
          <Text style={styles.homeText}>F</Text>
        </Pressable>
        <Pressable disabled={!canGoBack} onPress={() => webRef.current?.goBack()} style={[styles.iconButton, !canGoBack && styles.disabled]}><Text style={styles.iconText}>‹</Text></Pressable>
        <Pressable disabled={!canGoForward} onPress={() => webRef.current?.goForward()} style={[styles.iconButton, !canGoForward && styles.disabled]}><Text style={styles.iconText}>›</Text></Pressable>
        <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="url" onChangeText={setAddress} onSubmitEditing={go} selectTextOnFocus style={styles.address} value={address} />
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
            Alert.alert('Open external app?', url, [{ text: 'Cancel', style: 'cancel' }]);
            return false;
          }}
          onContentProcessDidTerminate={() => {
            narrator.stop();
            setManualStatus('Website process restarted. Reloading…');
            webRef.current?.reload();
          }}
          style={styles.web}
        />
      </View>

      <View style={styles.readerBar}>
        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${Math.round(narrator.progress * 100)}%` }]} />
        </View>
        <View style={styles.statusRow}>
          <Text numberOfLines={2} style={styles.status}>{status}</Text>
          {narrator.totalSegments > 0 ? <Text style={styles.percent}>{Math.round(narrator.progress * 100)}%</Text> : null}
        </View>
        {narrator.active && narrator.currentText ? (
          <View style={styles.nowReading}>
            <Text style={styles.nowReadingLabel}>NOW READING · {narrator.currentSegment + 1} / {narrator.totalSegments}</Text>
            <Text numberOfLines={2} style={styles.nowReadingText}>{narrator.currentText}</Text>
          </View>
        ) : null}
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
          <Pressable disabled={!lastExtracted || savingPage} onPress={() => void saveCurrentReading()} style={[styles.secondaryAction, (!lastExtracted || savingPage) && styles.disabled]}><Text style={styles.secondaryActionText}>{savingPage ? 'Saving…' : 'Save'}</Text></Pressable>
        </View>
        {narrator.active ? (
          <View style={styles.transportRow}>
            <Pressable disabled={narrator.buffering} onPress={narrator.skipBackward} style={[styles.transportButton, narrator.buffering && styles.disabled]}><Text style={styles.transportGlyph}>↶</Text><Text style={styles.transportLabel}>Back</Text></Pressable>
            <Pressable disabled={narrator.buffering} onPress={narrator.togglePause} style={[styles.primaryAction, narrator.buffering && styles.disabled]}><Text style={styles.primaryActionText}>{narrator.paused ? '▶  Resume' : 'Ⅱ  Pause'}</Text></Pressable>
            <Pressable disabled={narrator.buffering} onPress={narrator.skipForward} style={[styles.transportButton, narrator.buffering && styles.disabled]}><Text style={styles.transportLabel}>Next</Text><Text style={styles.transportGlyph}>↷</Text></Pressable>
            <Pressable onPress={narrator.stop} style={styles.stopAction}><Text style={styles.stopActionText}>■ Stop</Text></Pressable>
          </View>
        ) : null}
      </View>

      <Modal visible={voicePickerOpen} transparent animationType="slide" onRequestClose={() => setVoicePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.voiceSheet}>
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetKicker}>FLOENTLY READ VOICE</Text><Text style={styles.sheetTitle}>Choose a voice</Text></View>
              <Pressable onPress={() => setVoicePickerOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>Done</Text></Pressable>
            </View>
            <Text style={styles.sheetHint}>Natural server voices. Changing voice stops the current narration so the next audio starts cleanly.</Text>
            <ScrollView style={styles.voiceList} contentContainerStyle={styles.voiceListContent}>
              {voices.map((voice) => (
                <Pressable
                  key={voice.id}
                  onPress={() => {
                    narrator.stop();
                    setSelectedVoiceId(voice.id);
                    setVoicePickerOpen(false);
                    setManualStatus(`Voice: ${voice.name} · ${voice.locale}`);
                  }}
                  style={[styles.voiceOption, selectedVoiceId === voice.id && styles.voiceOptionSelected]}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceOptionName}>{voice.name}</Text>
                    <Text style={styles.voiceOptionMeta}>{voice.provider.toUpperCase()} · {voice.locale}{voice.accent ? ` · ${voice.accent}` : ''}</Text>
                  </View>
                  {selectedVoiceId === voice.id ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.langNote}>Page language detected: {pageLanguage}</Text>
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
  progressLine: { height: 3, borderRadius: 999, backgroundColor: '#243047', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#6f83ff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { flex: 1, color: '#c7d0df', fontSize: 11, lineHeight: 15, minHeight: 15 },
  percent: { color: '#7ea0ff', fontSize: 11, fontWeight: '900', minWidth: 34, textAlign: 'right' },
  nowReading: { borderRadius: 12, backgroundColor: '#141f31', paddingHorizontal: 10, paddingVertical: 7, borderLeftWidth: 2, borderLeftColor: '#6f83ff' },
  nowReadingLabel: { color: '#7ea0ff', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.9, marginBottom: 3 },
  nowReadingText: { color: '#e8edf7', fontSize: 11, lineHeight: 15 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceButton: { flex: 1, minHeight: 46, borderRadius: 15, backgroundColor: '#18243a', paddingHorizontal: 12, justifyContent: 'center' },
  controlKicker: { color: '#7ea0ff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  voiceText: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 2 },
  speedGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: '#18243a', overflow: 'hidden' },
  speedButton: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center' },
  speedGlyph: { color: '#fff', fontSize: 24, lineHeight: 26, fontWeight: '700' },
  speedValue: { color: '#fff', width: 48, textAlign: 'center', fontSize: 13, fontWeight: '900' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  transportRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  transportButton: { minWidth: 55, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2435', paddingHorizontal: 7, flexDirection: 'row', gap: 3 },
  transportGlyph: { color: '#9cabbe', fontSize: 16, fontWeight: '900' },
  transportLabel: { color: '#d9e0eb', fontSize: 9.5, fontWeight: '800' },
  secondaryAction: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2435', paddingHorizontal: 8 },
  secondaryActionText: { color: '#e7ecf8', fontSize: 12, fontWeight: '800' },
  primaryAction: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364ff', paddingHorizontal: 8 },
  primaryActionText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stopAction: { minWidth: 58, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a3548', paddingHorizontal: 8 },
  stopActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.52)' },
  voiceSheet: { maxHeight: '76%', backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, borderTopWidth: 1, borderColor: '#273247' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  sheetKicker: { color: '#7ea0ff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sheetTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  sheetHint: { color: '#8f9db4', fontSize: 11, lineHeight: 16, marginBottom: 8 },
  closeButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#1a2435', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontWeight: '800' },
  voiceList: { marginTop: 4 },
  voiceListContent: { paddingBottom: 18, gap: 7 },
  voiceOption: { minHeight: 58, borderRadius: 16, backgroundColor: '#162033', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'transparent' },
  voiceOptionSelected: { borderColor: '#5364ff', backgroundColor: '#19294f' },
  voiceInfo: { flex: 1, paddingRight: 12 },
  voiceOptionName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  voiceOptionMeta: { color: '#99a6ba', fontSize: 11, marginTop: 3 },
  check: { color: '#7ea0ff', fontSize: 18, fontWeight: '900' },
  langNote: { color: '#69778c', fontSize: 10, paddingTop: 2 },
});
