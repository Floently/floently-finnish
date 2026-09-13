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

type BrowserReadSegment = {
  text: string;
  blockId: string | null;
  blockIndex: number;
  kind: 'heading' | 'bullet' | 'text';
  pauseAfterMs: number;
};

type BrowserReadModel = {
  text: string;
  title: string;
  url: string;
  segments: BrowserReadSegment[];
};

const INSTALL_READ_BRIDGE_SCRIPT = `
(() => {
  if (window.__floentlyReadBridge && window.__floentlyReadBridge.version === '2') return true;
  const normalize = (value) => String(value || '').replace(/\\r/g, '\\n').replace(/[^\\S\\n]+/g, ' ').replace(/\\n{3,}/g, '\\n\\n').trim();
  const sentenceParts = (value) => {
    const text = normalize(value);
    if (!text) return [];
    return (text.match(/[^.!?\\n]+(?:[.!?]+|$)/g) || [text]).map(normalize).filter((part) => part.length > 1);
  };
  const interactive = 'a,button,input,textarea,select,label,summary,[role="button"],[contenteditable="true"]';
  const noise = 'script,style,noscript,nav,aside,footer,form,[role="navigation"],[role="dialog"],[aria-hidden="true"],[class*="sidebar" i],[class*="drawer" i],[class*="menu" i],[class*="cookie" i]';
  const visible = (el) => {
    if (!(el instanceof HTMLElement)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.05 && rect.width > 40 && rect.height > 10;
  };
  const styleId = '__floently_read_bridge_style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = '.floently-read-active-block{outline:2px solid rgba(83,100,255,.88)!important;outline-offset:3px!important;background:rgba(83,100,255,.10)!important;border-radius:4px!important;transition:background .16s ease,outline-color .16s ease!important}.floently-read-pick-block{outline:2px dashed rgba(83,100,255,.9)!important;outline-offset:3px!important}';
    (document.head || document.documentElement).appendChild(style);
  }
  let model = null;
  let interactionMode = 'none';
  let cachedSelection = '';
  const post = (payload) => {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch (_) {}
  };
  const rememberSelection = () => {
    try {
      const selected = normalize(window.getSelection && window.getSelection().toString());
      if (selected.length > 1) cachedSelection = selected;
    } catch (_) {}
  };
  document.addEventListener('selectionchange', rememberSelection, true);
  const clearActive = () => document.querySelectorAll('.floently-read-active-block,.floently-read-pick-block').forEach((el) => el.classList.remove('floently-read-active-block','floently-read-pick-block'));
  const getCandidateRoot = () => {
    const selectors = ['main','article','[role="main"]','[class*="lesson" i]','[class*="lecture" i]','[class*="concept" i]','[class*="transcript" i]','[class*="content" i]','[class*="prose" i]'];
    const candidates = Array.from(new Set(selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))))).filter(visible);
    const score = (el) => {
      const text = normalize(el.innerText || '');
      if (text.length < 60) return -1e9;
      const rect = el.getBoundingClientRect();
      const links = Array.from(el.querySelectorAll('a')).reduce((sum, link) => sum + normalize(link.innerText || '').length, 0);
      const controls = el.querySelectorAll('button,input,select,textarea,[role="button"],[role="navigation"]').length;
      const chrome = el.querySelectorAll('nav,aside,[role="navigation"],[class*="sidebar" i],[class*="drawer" i],[class*="menu" i]').length;
      const paragraphs = el.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,blockquote').length;
      const center = rect.left < innerWidth / 2 && rect.right > innerWidth / 2 ? 1600 : 0;
      return text.length + paragraphs * 120 + center - links * 1.15 - controls * 160 - chrome * 1100 - Math.abs((rect.left + rect.right) / 2 - innerWidth / 2);
    };
    return candidates.sort((a,b) => score(b) - score(a))[0] || document.querySelector('main') || document.querySelector('article') || document.body;
  };
  const extract = () => {
    try {
      clearActive();
      document.querySelectorAll('[data-floently-read-block]').forEach((el) => el.removeAttribute('data-floently-read-block'));
      const root = getCandidateRoot();
      if (!root) throw new Error('No readable page root was found.');
      const rawBlocks = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,[role="heading"]')).filter((el) => visible(el) && !el.closest(noise));
      const blocks = rawBlocks.length ? rawBlocks : [root];
      const segments = [];
      const textParts = [];
      let blockIndex = 0;
      for (const el of blocks) {
        const blockText = normalize(el.innerText || el.textContent || '');
        if (blockText.length < 2) continue;
        if (blocks.length > 1 && el.querySelector('p,li,h1,h2,h3,h4,h5,h6,blockquote') && blockText.length > 1500) continue;
        const blockId = 'floently-read-' + blockIndex;
        el.setAttribute('data-floently-read-block', blockId);
        const tag = String(el.tagName || '').toUpperCase();
        const headingMatch = tag.match(/^H([1-6])$/);
        const isHeading = Boolean(headingMatch) || el.getAttribute('role') === 'heading';
        const isBullet = tag === 'LI';
        const level = headingMatch ? Number(headingMatch[1]) : Number(el.getAttribute('aria-level') || 3);
        const pauseAfterMs = isHeading
          ? ({ 1: 760, 2: 660, 3: 570, 4: 500, 5: 440, 6: 400 }[Math.max(1, Math.min(6, level))] || 520)
          : isBullet
            ? 340
            : 0;
        const kind = isHeading ? 'heading' : isBullet ? 'bullet' : 'text';
        const parts = isHeading || isBullet ? [blockText] : sentenceParts(blockText);
        for (const part of parts) segments.push({ text: part, blockId, blockIndex, kind, pauseAfterMs });
        textParts.push(blockText);
        blockIndex += 1;
      }
      if (!segments.length) {
        const fallbackText = normalize(root.innerText || root.textContent || '');
        sentenceParts(fallbackText).forEach((part) => segments.push({ text: part, blockId: null, blockIndex: 0, kind: 'text', pauseAfterMs: 0 }));
        textParts.push(fallbackText);
      }
      model = { text: textParts.join('\\n\\n'), title: document.title || 'Web reading', url: location.href, lang: document.documentElement.lang || 'en-US', segments };
      post({ type: 'READ_MODEL', ...model });
      return model;
    } catch (error) {
      post({ type: 'READ_ERROR', message: String(error && error.message || error) });
      return null;
    }
  };
  const highlightSegment = (index, shouldScroll) => {
    if (!model || !model.segments || !model.segments[index]) return false;
    clearActive();
    const blockId = model.segments[index].blockId;
    if (!blockId) return false;
    const el = document.querySelector('[data-floently-read-block="' + CSS.escape(blockId) + '"]');
    if (!el) return false;
    el.classList.add('floently-read-active-block');
    if (shouldScroll !== false) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    return true;
  };
  const getCaret = (x, y) => {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      return range ? { node: range.startContainer, offset: range.startOffset } : null;
    }
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      return pos ? { node: pos.offsetNode, offset: pos.offset } : null;
    }
    return null;
  };
  const textAtPoint = (x, y, mode) => {
    const caret = getCaret(x, y);
    if (!caret || !caret.node) return '';
    const nodeText = String(caret.node.nodeValue || caret.node.textContent || '');
    const offset = Math.max(0, Math.min(nodeText.length, Number(caret.offset) || 0));
    if (mode === 'word') {
      const matches = Array.from(nodeText.matchAll(/\\S+/g));
      const found = matches.find((match) => offset >= (match.index || 0) && offset <= (match.index || 0) + match[0].length) || matches[0];
      return normalize(found ? found[0] : '');
    }
    const before = nodeText.slice(0, offset);
    const after = nodeText.slice(offset);
    const start = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?')) + 1;
    const candidates = [after.indexOf('.'), after.indexOf('!'), after.indexOf('?')].filter((value) => value >= 0);
    const end = candidates.length ? offset + Math.min(...candidates) + 1 : nodeText.length;
    return normalize(nodeText.slice(start, end));
  };
  const nearestSegmentForBlock = (blockId, pickedText) => {
    if (!model || !Array.isArray(model.segments)) return -1;
    const candidates = model.segments.map((segment, index) => ({ segment, index })).filter((entry) => entry.segment.blockId === blockId);
    if (!candidates.length) return -1;
    if (!pickedText) return candidates[0].index;
    const normalizedPick = normalize(pickedText).toLowerCase();
    return (candidates.find((entry) => entry.segment.text.toLowerCase().includes(normalizedPick) || normalizedPick.includes(entry.segment.text.toLowerCase())) || candidates[0]).index;
  };
  let lastHandledTapAt = 0;
  let touchStart = null;
  const findBlockAtPoint = (x, y, target) => {
    const direct = target instanceof Element ? target.closest('[data-floently-read-block]') : null;
    if (direct) return direct;
    const stacked = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
    const fromStack = stacked.map((el) => el.closest && el.closest('[data-floently-read-block]')).find(Boolean);
    if (fromStack) return fromStack;
    let nearest = null;
    document.querySelectorAll('[data-floently-read-block]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const distance = Math.hypot(dx, dy);
      if (!nearest || distance < nearest.distance) nearest = { el, distance };
    });
    return nearest && nearest.distance <= 72 ? nearest.el : null;
  };
  const handlePoint = (event, x, y) => {
    if (interactionMode === 'none') return;
    const now = Date.now();
    if (now - lastHandledTapAt < 360) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest(interactive)) return;
    const blockEl = findBlockAtPoint(x, y, target);
    if (!blockEl) return;
    const blockId = blockEl.getAttribute('data-floently-read-block') || '';
    if (interactionMode === 'jump') {
      const picked = textAtPoint(x, y, 'sentence');
      const index = nearestSegmentForBlock(blockId, picked);
      if (index >= 0) {
        lastHandledTapAt = now;
        event.preventDefault();
        event.stopPropagation();
        post({ type: 'READ_JUMP', index });
      }
      return;
    }
    if (interactionMode === 'sentence' || interactionMode === 'word') {
      const text = textAtPoint(x, y, interactionMode);
      if (text) {
        lastHandledTapAt = now;
        event.preventDefault();
        event.stopPropagation();
        post({ type: 'READ_PICK', mode: interactionMode, text, title: document.title, url: location.href, lang: document.documentElement.lang || 'en-US' });
      }
    }
  };
  const handleClick = (event) => handlePoint(event, Number(event.clientX) || 0, Number(event.clientY) || 0);
  const handleTouchStart = (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    touchStart = { x: touch.clientX, y: touch.clientY, at: Date.now() };
  };
  const handleTouchEnd = (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch || !touchStart) return;
    const moved = Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y);
    const elapsed = Date.now() - touchStart.at;
    touchStart = null;
    if (moved > 14 || elapsed > 700) return;
    handlePoint(event, touch.clientX, touch.clientY);
  };
  document.addEventListener('touchstart', handleTouchStart, true);
  document.addEventListener('touchend', handleTouchEnd, true);
  document.addEventListener('click', handleClick, true);
  window.__floentlyReadBridge = {
    version: '2',
    extract,
    highlightSegment,
    setInteractionMode: (mode) => { interactionMode = ['jump','sentence','word'].includes(mode) ? mode : 'none'; clearActive(); return interactionMode; },
    getSelection: () => { rememberSelection(); post({ type:'READ_PICK', mode:'selection', text: cachedSelection, title:document.title, url:location.href, lang:document.documentElement.lang || 'en-US' }); return cachedSelection; },
    clearHighlight: clearActive,
  };
  return true;
})(); true;
`;

const EXTRACT_SCRIPT = `${INSTALL_READ_BRIDGE_SCRIPT}\nwindow.__floentlyReadBridge && window.__floentlyReadBridge.extract(); true;`;

export default function ReadBrowserScreen() {
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const initialUrl = useMemo(() => normalizeUrl(Array.isArray(params.url) ? params.url[0] ?? DEFAULT_URL : params.url ?? DEFAULT_URL), [params.url]);
  const webRef = useRef<any>(null);
  const lastNavigationUrlRef = useRef(initialUrl);
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
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'none' | 'jump' | 'sentence' | 'word'>('none');
  const [playbackScope, setPlaybackScope] = useState<'none' | 'page' | 'picked'>('none');
  const [pageLanguage, setPageLanguage] = useState('en-US');
  const [lastExtracted, setLastExtracted] = useState<BrowserReadModel | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);
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

  useEffect(() => {
    if (playbackScope !== 'page' || !lastExtracted?.segments.length || narrator.totalSegments <= 0) return;
    const index = Math.min(narrator.currentSegment, lastExtracted.segments.length - 1);
    webRef.current?.injectJavaScript(`window.__floentlyReadBridge && window.__floentlyReadBridge.highlightSegment(${index}, true); true;`);
  }, [lastExtracted?.segments.length, narrator.currentSegment, narrator.totalSegments, playbackScope]);

  const voiceLabel = selectedVoice ? selectedVoice.name : 'Loading voices…';
  const status = narrator.error
    ? narrator.error
    : narrator.buffering
      ? `Preparing audio ${Math.min(narrator.currentSegment + 1, Math.max(narrator.totalSegments, 1))} of ${Math.max(narrator.totalSegments, 1)}…`
      : narrator.interSegmentPause
        ? `Natural pause · next section ${Math.min(narrator.currentSegment + 2, narrator.totalSegments)} of ${narrator.totalSegments}`
        : narrator.active
          ? `${narrator.paused ? 'Paused' : 'Reading'} ${narrator.currentSegment + 1} of ${narrator.totalSegments} · ${formatReadTime(narrator.currentTime)} / ${formatReadTime(narrator.duration)}${narrator.currentWord ? ` · ${narrator.currentWord}` : ''}`
        : narrator.totalSegments > 0 && narrator.progress >= 0.999
          ? 'Finished reading this page.'
          : manualStatus;

  const setPageInteractionMode = (mode: 'none' | 'jump' | 'sentence' | 'word') => {
    setSelectorMode(mode);
    webRef.current?.injectJavaScript(`${INSTALL_READ_BRIDGE_SCRIPT}\nwindow.__floentlyReadBridge && window.__floentlyReadBridge.setInteractionMode('${mode}'); true;`);
  };

  const readPage = () => {
    narrator.stop();
    setPlaybackScope('none');
    setSelectorMode('none');
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
      if (payload?.type === 'READ_JUMP') {
        const index = Number(payload.index);
        if (Number.isFinite(index) && index >= 0 && index < (lastExtracted?.segments.length ?? 0)) {
          setPlaybackScope('page');
          narrator.jumpToSegment(index);
          setManualStatus(`Jumped to section ${index + 1}.`);
        }
        return;
      }
      if (payload?.type === 'READ_PICK') {
        if (payload.lang) setPageLanguage(String(payload.lang));
        const text = String(payload.text || '').trim();
        if (!text) {
          setManualStatus(payload.mode === 'selection' ? 'Select text on the page first, then tap Selection.' : 'No readable text was found where you tapped.');
          return;
        }
        setPlaybackScope('picked');
        setSelectorMode('jump');
        webRef.current?.injectJavaScript("window.__floentlyReadBridge && window.__floentlyReadBridge.setInteractionMode('jump'); window.__floentlyReadBridge && window.__floentlyReadBridge.clearHighlight(); true;");
        setManualStatus(`Reading ${String(payload.mode || 'selection')}.`);
        void narrator.startSegments([{ text, pauseAfterMs: 0 }]);
        return;
      }
      if (payload?.type !== 'READ_MODEL') return;
      if (payload.lang) setPageLanguage(String(payload.lang));
      const text = String(payload.text || '').trim();
      const segments: BrowserReadSegment[] = Array.isArray(payload.segments)
        ? payload.segments
            .map((segment: any) => ({
              text: String(segment?.text || '').trim(),
              blockId: typeof segment?.blockId === 'string' ? segment.blockId : null,
              blockIndex: Number(segment?.blockIndex ?? 0) || 0,
              kind: segment?.kind === 'heading' || segment?.kind === 'bullet' ? segment.kind : 'text',
              pauseAfterMs: Math.max(0, Number(segment?.pauseAfterMs ?? 0) || 0),
            }))
            .filter((segment: BrowserReadSegment) => Boolean(segment.text))
        : [];
      if (!text || !segments.length) {
        setManualStatus('No readable lesson text was found on this view.');
        return;
      }
      const extracted: BrowserReadModel = {
        text,
        segments,
        title: String(payload.title || 'Web reading').trim() || 'Web reading',
        url: String(payload.url || address).trim(),
      };
      setLastExtracted(extracted);
      setManualStatus(`Ready · ${extracted.title} · ${segments.length} sections`);
      setPlaybackScope('page');
      setSelectorMode('jump');
      webRef.current?.injectJavaScript("window.__floentlyReadBridge && window.__floentlyReadBridge.setInteractionMode('jump'); true;");
      void narrator.startSegments(segments.map((segment) => ({ text: segment.text, pauseAfterMs: segment.pauseAfterMs })));
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
    setPlaybackScope('none');
    setSelectorMode('none');
    setManualStatus('Page changed. Tap Read page when you are ready.');
  };

  const changeRate = (delta: number) => {
    const next = Math.min(2, Math.max(0.5, Math.round((rate + delta) * 10) / 10));
    setRate(next);
    setManualStatus(`Speed ${next.toFixed(1)}×.`);
  };

  const readSelection = () => {
    narrator.stop();
    setManualStatus('Reading your selected text…');
    webRef.current?.injectJavaScript(`${INSTALL_READ_BRIDGE_SCRIPT}\nwindow.__floentlyReadBridge && window.__floentlyReadBridge.getSelection(); true;`);
  };

  const activatePicker = (mode: 'sentence' | 'word') => {
    narrator.stop();
    setPageInteractionMode(mode);
    setManualStatus(`Tap a ${mode} on the web page to read it.`);
  };

  const jumpToSection = (index: number) => {
    if (!lastExtracted?.segments[index]) return;
    setSectionsOpen(false);
    setPlaybackScope('page');
    setSelectorMode('jump');
    narrator.jumpToSegment(index);
    webRef.current?.injectJavaScript(`window.__floentlyReadBridge && window.__floentlyReadBridge.setInteractionMode('jump'); window.__floentlyReadBridge && window.__floentlyReadBridge.highlightSegment(${index}, true); true;`);
  };

  const saveCurrentReading = async () => {
    if (!token || !lastExtracted || savingPage || renderingPage) return;
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

  const renderCurrentReading = async () => {
    if (!token || !lastExtracted || savingPage || renderingPage) return;
    narrator.stop();
    setRenderingPage(true);
    setManualStatus('Rendering this page in Floently Reader…');
    try {
      const project = await createReadProjectFromText(token, { text: lastExtracted.text, title: lastExtracted.title });
      router.push({ pathname: '/read-document', params: { id: project.id } } as never);
    } catch (cause) {
      setManualStatus(cause instanceof Error ? cause.message : 'Could not render this page in Reader.');
    } finally {
      setRenderingPage(false);
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
          injectedJavaScriptBeforeContentLoaded={INSTALL_READ_BRIDGE_SCRIPT}
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
            if (nav.url) {
              setAddress(nav.url);
              if (nav.url !== lastNavigationUrlRef.current) {
                lastNavigationUrlRef.current = nav.url;
                narrator.stop();
                setSelectorMode('none');
                setLastExtracted(null);
                setManualStatus('Page changed. Tap Read page when the lesson is ready.');
              }
            }
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
        <View style={styles.playerTopRow}>
          <View style={styles.playerBrandMark}><Text style={styles.playerBrandMarkText}>F</Text></View>
          <View style={styles.playerHeadline}>
            <Text style={styles.playerEyebrow}>FLOENTLY READ</Text>
            <Text numberOfLines={1} style={styles.playerTitle}>
              {narrator.active && narrator.currentText ? narrator.currentText : 'Ready to read this page'}
            </Text>
          </View>
          <Pressable onPress={() => setVoicePickerOpen(true)} style={styles.voiceAvatar}>
            <Text style={styles.voiceAvatarText}>{voiceLabel.trim().slice(0, 1).toUpperCase() || 'V'}</Text>
          </Pressable>
        </View>

        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${Math.round(narrator.progress * 100)}%` }]} />
        </View>
        <View style={styles.playerMetaRow}>
          <Text style={styles.playerTime}>{formatReadTime(narrator.currentTime)} / {formatReadTime(narrator.duration)}</Text>
          <Text numberOfLines={1} style={styles.playerStatusCompact}>{status}</Text>
          <Text style={styles.percent}>{Math.round(narrator.progress * 100)}%</Text>
        </View>

        <View style={styles.transportHeroRow}>
          <Pressable disabled={!narrator.active || narrator.buffering} onPress={narrator.skipBackward} style={[styles.transportRoundButton, (!narrator.active || narrator.buffering) && styles.disabled]}>
            <Text style={styles.transportRoundGlyph}>↶</Text>
          </Pressable>
          <Pressable
            disabled={narrator.buffering}
            onPress={narrator.active ? narrator.togglePause : readPage}
            style={[styles.playHeroButton, narrator.buffering && styles.disabled]}
          >
            <Text style={styles.playHeroIcon}>{narrator.buffering ? '…' : narrator.active && !narrator.paused ? 'Ⅱ' : '▶'}</Text>
            <Text style={styles.playHeroText}>{narrator.buffering ? 'Preparing' : narrator.active ? (narrator.paused ? 'Resume' : 'Pause') : 'Read page'}</Text>
          </Pressable>
          <Pressable disabled={!narrator.active || narrator.buffering} onPress={narrator.skipForward} style={[styles.transportRoundButton, (!narrator.active || narrator.buffering) && styles.disabled]}>
            <Text style={styles.transportRoundGlyph}>↷</Text>
          </Pressable>
        </View>

        <View style={styles.playerQuickRow}>
          <Pressable onPress={() => setVoicePickerOpen(true)} style={styles.quickControl}>
            <Text style={styles.quickControlLabel}>VOICE</Text>
            <Text numberOfLines={1} style={styles.quickControlValue}>{voiceLabel}</Text>
          </Pressable>
          <View style={styles.speedGroup}>
            <Pressable onPress={() => changeRate(-0.1)} style={styles.speedButton}><Text style={styles.speedGlyph}>−</Text></Pressable>
            <View style={styles.speedCenter}><Text style={styles.quickControlLabel}>SPEED</Text><Text style={styles.speedValue}>{rate.toFixed(1)}×</Text></View>
            <Pressable onPress={() => changeRate(0.1)} style={styles.speedButton}><Text style={styles.speedGlyph}>+</Text></Pressable>
          </View>
        </View>

        <View style={styles.selectorRow}>
          <Pressable disabled={!lastExtracted?.segments.length} onPress={() => setSectionsOpen(true)} style={[styles.selectorButton, !lastExtracted?.segments.length && styles.disabled]}>
            <Text style={styles.selectorLabel}>Sections</Text>
          </Pressable>
          <Pressable onPress={() => activatePicker('sentence')} style={[styles.selectorButton, selectorMode === 'sentence' && styles.selectorButtonActive]}>
            <Text style={[styles.selectorLabel, selectorMode === 'sentence' && styles.selectorLabelActive]}>Sentence</Text>
          </Pressable>
          <Pressable onPress={() => activatePicker('word')} style={[styles.selectorButton, selectorMode === 'word' && styles.selectorButtonActive]}>
            <Text style={[styles.selectorLabel, selectorMode === 'word' && styles.selectorLabelActive]}>Word</Text>
          </Pressable>
          <Pressable onPress={readSelection} style={styles.selectorButton}>
            <Text style={styles.selectorLabel}>Selection</Text>
          </Pressable>
        </View>

        <View style={styles.utilityRow}>
          <Pressable disabled={!lastExtracted || renderingPage || savingPage} onPress={() => void renderCurrentReading()} style={[styles.utilityButton, (!lastExtracted || renderingPage || savingPage) && styles.disabled]}>
            <Text style={styles.utilityButtonText}>{renderingPage ? 'Rendering…' : 'Render'}</Text>
          </Pressable>
          <Pressable disabled={!lastExtracted || savingPage || renderingPage} onPress={() => void saveCurrentReading()} style={[styles.utilityButton, (!lastExtracted || savingPage || renderingPage) && styles.disabled]}>
            <Text style={styles.utilityButtonText}>{savingPage ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          {narrator.active ? <Pressable onPress={narrator.stop} style={styles.stopCompact}><Text style={styles.stopCompactText}>■ Stop</Text></Pressable> : null}
        </View>
      </View>

      <Modal visible={sectionsOpen} transparent animationType="slide" onRequestClose={() => setSectionsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sectionSheet}>
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetKicker}>PAGE NAVIGATION</Text><Text style={styles.sheetTitle}>Jump to a section</Text></View>
              <Pressable onPress={() => setSectionsOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>Done</Text></Pressable>
            </View>
            <Text style={styles.sheetHint}>Tap any sentence to move both the webpage and narration to that point.</Text>
            <ScrollView contentContainerStyle={styles.sectionList}>
              {(lastExtracted?.segments ?? []).map((segment, index) => (
                <Pressable key={`${segment.blockId ?? 'section'}-${index}`} onPress={() => jumpToSection(index)} style={[styles.sectionOption, index === narrator.currentSegment && styles.sectionOptionActive]}>
                  <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{index + 1}</Text></View>
                  <Text numberOfLines={3} style={styles.sectionText}>{segment.text}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  readerBar: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, gap: 10, backgroundColor: '#0C1422', borderTopWidth: 1, borderTopColor: '#25324A', shadowColor: '#000000', shadowOpacity: 0.34, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 18 },
  playerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerBrandMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364FF' },
  playerBrandMarkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  playerHeadline: { flex: 1, minWidth: 0 },
  playerEyebrow: { color: '#7F92FF', fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: 1.2 },
  playerTitle: { color: '#F7F9FF', fontSize: 13.5, lineHeight: 18, fontWeight: '800', marginTop: 2 },
  voiceAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#182844', borderWidth: 1, borderColor: '#2C4168' },
  voiceAvatarText: { color: '#A8B5FF', fontSize: 14, fontWeight: '900' },
  progressLine: { height: 4, borderRadius: 999, backgroundColor: '#202C40', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#7187FF' },
  playerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  playerTime: { color: '#91A0B6', fontSize: 9.5, fontWeight: '700' },
  playerStatusCompact: { flex: 1, color: '#AAB6C9', fontSize: 9.5, textAlign: 'center' },
  percent: { color: '#91A3FF', fontSize: 9.5, fontWeight: '900', minWidth: 31, textAlign: 'right' },
  transportHeroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  transportRoundButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172235', borderWidth: 1, borderColor: '#27364F' },
  transportRoundGlyph: { color: '#DCE5F4', fontSize: 22, fontWeight: '900' },
  playHeroButton: { minWidth: 146, height: 52, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#5364FF', paddingHorizontal: 18, shadowColor: '#5364FF', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  playHeroIcon: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  playHeroText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  playerQuickRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  quickControl: { flex: 1, minHeight: 48, borderRadius: 15, backgroundColor: '#151F31', borderWidth: 1, borderColor: '#26344C', paddingHorizontal: 12, justifyContent: 'center' },
  quickControlLabel: { color: '#7387F6', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.9 },
  quickControlValue: { color: '#F5F7FD', fontSize: 12, fontWeight: '800', marginTop: 3 },
  speedGroup: { minHeight: 48, borderRadius: 15, backgroundColor: '#151F31', borderWidth: 1, borderColor: '#26344C', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  speedButton: { width: 38, height: 48, alignItems: 'center', justifyContent: 'center' },
  speedGlyph: { color: '#FFFFFF', fontSize: 21, lineHeight: 23, fontWeight: '800' },
  speedCenter: { width: 48, alignItems: 'center', justifyContent: 'center' },
  speedValue: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '900', marginTop: 2 },
  selectorRow: { flexDirection: 'row', gap: 6 },
  selectorButton: { flex: 1, minHeight: 34, borderRadius: 11, backgroundColor: '#121C2C', borderWidth: 1, borderColor: '#24324A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  selectorButtonActive: { backgroundColor: '#263A72', borderColor: '#7187FF' },
  selectorLabel: { color: '#A7B2C3', fontSize: 9, fontWeight: '800' },
  selectorLabelActive: { color: '#FFFFFF' },
  utilityRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  utilityButton: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151F31', borderWidth: 1, borderColor: '#25334A' },
  utilityButtonText: { color: '#DCE3EF', fontSize: 10.5, fontWeight: '800' },
  stopCompact: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2632', borderWidth: 1, borderColor: '#493647' },
  stopCompactText: { color: '#F2DDE6', fontSize: 10.5, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.52)' },
  sectionSheet: { maxHeight: '78%', backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18, borderTopWidth: 1, borderColor: '#273247' },
  sectionList: { gap: 7, paddingBottom: 18 },
  sectionOption: { minHeight: 62, borderRadius: 16, backgroundColor: '#162033', borderWidth: 1, borderColor: 'transparent', padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sectionOptionActive: { borderColor: '#5364ff', backgroundColor: '#19294f' },
  sectionNumber: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#223252', alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { color: '#8fa0ff', fontSize: 10, fontWeight: '900' },
  sectionText: { flex: 1, color: '#e7ebf3', fontSize: 11.5, lineHeight: 17 },
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
