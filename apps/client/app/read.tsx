import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
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
import {
  canonicalizeReadUrl,
  contentFingerprint,
  isSensitiveAuthUrl,
  loadReadWebContinuity,
  saveReadWebContinuity,
  type ReadWebContinuitySnapshot,
} from '../features/read/webContinuity';

const NativeWebView: any = WebView;
const DEFAULT_URL = 'https://www.google.com/';
type PlayerDockMode = 'auto' | 'pinned' | 'minimized';
const PLAYER_DOCK_MODE_KEY = 'floently.read.playerDockMode.v1';
const PLAYER_AUTO_COLLAPSE_MS = 1400;
const PLAYER_TEMP_REVEAL_MS = 6000;

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

type ReadFocusMode = 'chunk' | 'sentence' | 'word';
type VoiceFilter = 'all' | 'American' | 'British' | 'Finnish';

type BrowserPlaybackChunkEntry = {
  segmentIndex: number;
  startWord: number;
  endWord: number;
  sourceWordStart: number;
};

type BrowserPlaybackChunk = {
  text: string;
  entries: BrowserPlaybackChunkEntry[];
};

function buildPlaybackChunks(segments: BrowserReadSegment[], startSegmentIndex = 0, maxChars = 1800, firstSegmentWordOffset = 0): BrowserPlaybackChunk[] {
  const chunks: BrowserPlaybackChunk[] = [];
  let textParts: string[] = [];
  let entries: BrowserPlaybackChunkEntry[] = [];
  let charCount = 0;
  let wordCount = 0;

  const flush = () => {
    if (!textParts.length) return;
    chunks.push({ text: textParts.join(' ').trim(), entries });
    textParts = [];
    entries = [];
    charCount = 0;
    wordCount = 0;
  };

  segments.forEach((segment, localIndex) => {
    const segmentIndex = startSegmentIndex + localIndex;
    const sourceWords = segment.text.match(/\S+/g) ?? [];
    if (!sourceWords.length) return;
    let cursor = localIndex === 0 ? Math.min(Math.max(0, firstSegmentWordOffset), Math.max(0, sourceWords.length - 1)) : 0;
    while (cursor < sourceWords.length) {
      let take = 0;
      let pieceChars = 0;
      while (cursor + take < sourceWords.length) {
        const word = sourceWords[cursor + take];
        const added = word.length + (take > 0 ? 1 : 0);
        if (take > 0 && pieceChars + added > maxChars) break;
        pieceChars += added;
        take += 1;
      }
      const piece = sourceWords.slice(cursor, cursor + Math.max(1, take)).join(' ');
      const separator = textParts.length ? 1 : 0;
      if (textParts.length && charCount + separator + piece.length > maxChars) flush();
      const startWord = wordCount;
      const pieceWordCount = piece.match(/\S+/g)?.length ?? 0;
      textParts.push(piece);
      entries.push({ segmentIndex, startWord, endWord: startWord + pieceWordCount, sourceWordStart: cursor });
      charCount += (textParts.length > 1 ? 1 : 0) + piece.length;
      wordCount += pieceWordCount;
      cursor += Math.max(1, take);
      if (charCount >= maxChars) flush();
    }
  });
  flush();
  return chunks;
}

const INSTALL_READ_BRIDGE_SCRIPT = `
(() => {
  if (window.__floentlyReadBridge && window.__floentlyReadBridge.version === '3') return true;
  const normalize = (value) => String(value || '').replace(/\\r/g, '\\n').replace(/[^\\S\\n]+/g, ' ').replace(/\\n{3,}/g, '\\n\\n').trim();
  const sentenceParts = (value) => {
    const text = normalize(value);
    if (!text) return [];
    const rough = (text.match(/[^.!?…！？。\\n]+(?:[.!?…！？。]+|$)/g) || [text]).map(normalize).filter((part) => part.length > 1);
    const bounded = [];
    for (const part of rough) {
      const words = part.match(/\\S+/g) || [];
      if (words.length <= 36) { bounded.push(part); continue; }
      for (let index = 0; index < words.length; index += 32) bounded.push(words.slice(index, index + 32).join(' '));
    }
    return bounded;
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
    style.textContent = '.floently-read-active-block{outline:2px solid rgba(83,100,255,.88)!important;outline-offset:3px!important;background:rgba(83,100,255,.08)!important;border-radius:4px!important;transition:background .16s ease,outline-color .16s ease!important}.floently-read-pick-block{outline:2px dashed rgba(83,100,255,.9)!important;outline-offset:3px!important}::highlight(floently-read-focus){background:rgba(113,135,255,.38);color:inherit}';
    (document.head || document.documentElement).appendChild(style);
  }
  let model = null;
  let interactionMode = 'none';
  let cachedSelection = '';
  let activeRoot = null;
  let rootObserver = null;
  let contentTimer = null;
  let routeTimer = null;
  let lastContentSignature = '';
  let lastContentText = '';
  let lastRoute = location.href;
  const post = (payload) => {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch (_) {}
  };
  const rememberSelection = () => {
    try {
      const selected = normalize(window.getSelection && window.getSelection().toString());
      if (selected.length > 1) cachedSelection = selected;
    } catch (_) {}
  };
  const signature = (value) => {
    const text = normalize(value);
    let hash = 2166136261;
    const sample = text.length > 2600 ? text.slice(0, 1300) + text.slice(-1300) : text;
    for (let i = 0; i < sample.length; i += 1) { hash ^= sample.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return text.length + ':' + (hash >>> 0).toString(36);
  };
  const isAuthLikePage = () => {
    const target = (location.pathname + ' ' + location.search).toLowerCase();
    return /(?:^|[\/_-])(login|log-in|signin|sign-in|signup|sign-up|oauth|authorize|authorization|sso|saml|auth|account)(?:[\/_-]|$)/i.test(target)
      || Boolean(document.querySelector('input[type=\"password\"]'));
  };
  document.addEventListener('selectionchange', rememberSelection, true);
  const clearFocus = () => { try { if (CSS.highlights) CSS.highlights.delete('floently-read-focus'); } catch (_) {} };
  const clearActive = () => { clearFocus(); document.querySelectorAll('.floently-read-active-block,.floently-read-pick-block').forEach((el) => el.classList.remove('floently-read-active-block','floently-read-pick-block')); };
  const normalizedRange = (el, targetText, relativeStart, relativeEnd) => {
    if (!el || !targetText || !document.createTreeWalker) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const positions = [];
    let normalizedText = '';
    let node = walker.nextNode();
    while (node) {
      const value = String(node.nodeValue || '');
      for (let i = 0; i < value.length; i += 1) {
        const char = value[i];
        if (/\s/.test(char)) {
          if (normalizedText && normalizedText[normalizedText.length - 1] !== ' ') { normalizedText += ' '; positions.push({ node, offset: i }); }
        } else { normalizedText += char; positions.push({ node, offset: i }); }
      }
      node = walker.nextNode();
    }
    const target = normalize(targetText);
    const base = normalizedText.toLowerCase().indexOf(target.toLowerCase());
    if (base < 0) return null;
    const startIndex = Math.max(base, Math.min(base + target.length - 1, base + Math.max(0, relativeStart || 0)));
    const requestedEnd = relativeEnd == null ? target.length : Math.max(relativeStart + 1, relativeEnd);
    const endIndex = Math.max(startIndex, Math.min(base + target.length - 1, base + requestedEnd - 1));
    const start = positions[startIndex];
    const end = positions[endIndex];
    if (!start || !end) return null;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, Math.min(String(end.node.nodeValue || '').length, end.offset + 1));
    return range;
  };
  const highlightFocus = (index, mode, wordIndex, shouldScroll) => {
    if (!model || !model.segments || !model.segments[index]) return false;
    clearActive();
    const segment = model.segments[index];
    const blockId = segment.blockId;
    if (!blockId) return false;
    const el = document.querySelector('[data-floently-read-block="' + CSS.escape(blockId) + '"]');
    if (!el) return false;
    el.classList.add('floently-read-active-block');
    if (mode !== 'chunk' && CSS.highlights && window.Highlight) {
      const target = normalize(segment.text);
      let relativeStart = 0;
      let relativeEnd = target.length;
      if (mode === 'word') {
        const matches = Array.from(target.matchAll(/\S+/g));
        const match = matches[Math.max(0, Math.min(matches.length - 1, Number(wordIndex) || 0))];
        if (match) { relativeStart = match.index || 0; relativeEnd = relativeStart + match[0].length; }
      }
      const range = normalizedRange(el, target, relativeStart, relativeEnd);
      if (range) { try { CSS.highlights.set('floently-read-focus', new Highlight(range)); } catch (_) {} }
    }
    if (shouldScroll !== false) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    return true;
  };
  const getCandidateRoot = () => {
    const selectors = ['main','article','[role="main"]','[itemprop="articleBody"]','[class*="lesson" i]','[class*="lecture" i]','[class*="course-content" i]','[id*="region-main" i]','[class*="book" i]','[class*="chapter" i]','[class*="article" i]','[class*="story" i]','[class*="entry-content" i]','[class*="transcript" i]','[class*="documentation" i]','[class*="docs-content" i]','[class*="content" i]','[class*="prose" i]'];
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
  const observeReadableRoot = (root) => {
    if (!root || typeof MutationObserver === 'undefined') return;
    if (rootObserver) rootObserver.disconnect();
    activeRoot = root;
    lastContentText = normalize(root.innerText || root.textContent || '');
    lastContentSignature = signature(lastContentText);
    rootObserver = new MutationObserver(() => {
      if (!model || isAuthLikePage()) return;
      if (contentTimer) clearTimeout(contentTimer);
      contentTimer = setTimeout(() => {
        contentTimer = null;
        if (!activeRoot || !document.contains(activeRoot)) {
          post({ type: 'READ_CONTENT_CHANGED', url: location.href, title: document.title || '', signature: 'root-replaced' });
          extract('content');
          return;
        }
        const nextText = normalize(activeRoot.innerText || activeRoot.textContent || '');
        const nextSignature = signature(nextText);
        if (!nextSignature || nextSignature === lastContentSignature) return;
        const lengthDelta = Math.abs(nextText.length - lastContentText.length);
        const threshold = Math.max(100, Math.round(Math.max(lastContentText.length, 1) * 0.05));
        const headChanged = nextText.slice(0, 500) !== lastContentText.slice(0, 500);
        const tailChanged = nextText.slice(-500) !== lastContentText.slice(-500);
        lastContentText = nextText;
        lastContentSignature = nextSignature;
        if (lengthDelta < threshold && !(headChanged && tailChanged)) return;
        post({ type: 'READ_CONTENT_CHANGED', url: location.href, title: document.title || '', signature: nextSignature });
        extract('content');
      }, 520);
    });
    rootObserver.observe(root.parentElement || root, { childList: true, subtree: true, characterData: true });
  };
  const scheduleRouteExtract = () => {
    if (!model || isAuthLikePage()) return;
    if (routeTimer) clearTimeout(routeTimer);
    routeTimer = setTimeout(() => { routeTimer = null; extract('route'); }, 720);
  };
  const emitRoute = (reason) => {
    const url = location.href;
    const changed = url !== lastRoute;
    lastRoute = url;
    const authLike = isAuthLikePage();
    post({ type: 'READ_ROUTE', url, title: document.title || '', reason, changed, authLike });
    if (changed && !authLike) scheduleRouteExtract();
  };
  const installRouteContinuity = () => {
    if (window.__floentlyReadRoutePatched) return;
    window.__floentlyReadRoutePatched = true;
    const wrap = (name) => {
      const original = history[name];
      if (typeof original !== 'function') return;
      history[name] = function(...args) { const result = original.apply(this, args); queueMicrotask(() => emitRoute(name)); return result; };
    };
    wrap('pushState');
    wrap('replaceState');
    addEventListener('popstate', () => emitRoute('popstate'), true);
    addEventListener('hashchange', () => emitRoute('hashchange'), true);
    addEventListener('pageshow', () => emitRoute('pageshow'), true);
  };
  const extract = (reason = 'manual') => {
    try {
      if (isAuthLikePage()) {
        post({ type: 'READ_SENSITIVE_ROUTE', url: location.href, title: document.title || '', reason });
        return null;
      }
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
      observeReadableRoot(root);
      post({ type: 'READ_MODEL', reason, contentSignature: lastContentSignature, ...model });
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
    version: '3',
    extract,
    highlightSegment,
    highlightFocus,
    setInteractionMode: (mode) => { interactionMode = ['jump','sentence','word'].includes(mode) ? mode : 'none'; clearActive(); return interactionMode; },
    getSelection: () => { rememberSelection(); post({ type:'READ_PICK', mode:'selection', text: cachedSelection, title:document.title, url:location.href, lang:document.documentElement.lang || 'en-US' }); return cachedSelection; },
    clearHighlight: clearActive,
    routeState: () => ({ url: location.href, title: document.title || '', authLike: isAuthLikePage() }),
  };
  installRouteContinuity();
  queueMicrotask(() => emitRoute('bridge-ready'));
  return true;
})(); true;
`;

const EXTRACT_SCRIPT = `${INSTALL_READ_BRIDGE_SCRIPT}\nwindow.__floentlyReadBridge && window.__floentlyReadBridge.extract('manual'); true;`;
const ROUTE_EXTRACT_SCRIPT = `${INSTALL_READ_BRIDGE_SCRIPT}\nwindow.__floentlyReadBridge && window.__floentlyReadBridge.extract('route'); true;`;

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
  const [manualStatus, setManualStatus] = useState('Open a course, article, book, document, or other webpage, then tap Read page.');
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<ReadVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>('all');
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<ReadFocusMode>('sentence');
  const [playbackScope, setPlaybackScope] = useState<'none' | 'page' | 'picked'>('none');
  const [playbackChunks, setPlaybackChunks] = useState<BrowserPlaybackChunk[]>([]);
  const lastFocusKeyRef = useRef('');
  const routeAutoContinueRef = useRef(false);
  const continuitySaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContinuityFingerprintRef = useRef('');
  const [pageLanguage, setPageLanguage] = useState('en-US');
  const [lastExtracted, setLastExtracted] = useState<BrowserReadModel | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);
  const [playerDockMode, setPlayerDockMode] = useState<PlayerDockMode>('auto');
  const [playerExpanded, setPlayerExpanded] = useState(true);
  const [playerSettingsOpen, setPlayerSettingsOpen] = useState(false);
  const playerCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedVoice = voices.find((voice) => voice.id === selectedVoiceId) ?? voices[0] ?? null;
  const narrator = useReadNarrator({
    token,
    voice: selectedVoice,
    rate,
    nowPlaying: {
      title: lastExtracted?.title || 'Floently Read',
      artist: selectedVoice ? `${selectedVoice.name} · ${selectedVoice.provider}` : 'Floently Read',
      albumTitle: 'Web Reading',
    },
  });

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(PLAYER_DOCK_MODE_KEY)
      .then((value) => {
        if (!mounted) return;
        if (value === 'auto' || value === 'pinned' || value === 'minimized') setPlayerDockMode(value);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (playerCollapseTimerRef.current) {
      clearTimeout(playerCollapseTimerRef.current);
      playerCollapseTimerRef.current = null;
    }
    if (playerDockMode === 'pinned') {
      setPlayerExpanded(true);
      return;
    }
    if (playerDockMode === 'minimized') {
      setPlayerExpanded(false);
      return;
    }
    if (!narrator.playing) {
      setPlayerExpanded(true);
      return;
    }
    playerCollapseTimerRef.current = setTimeout(() => {
      setPlayerExpanded(false);
      playerCollapseTimerRef.current = null;
    }, PLAYER_AUTO_COLLAPSE_MS);
    return () => {
      if (playerCollapseTimerRef.current) {
        clearTimeout(playerCollapseTimerRef.current);
        playerCollapseTimerRef.current = null;
      }
    };
  }, [narrator.playing, playerDockMode]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const catalog = await fetchReadVoices(token);
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
  }, [token]);

  const activePlaybackChunk = playbackChunks[narrator.currentSegment] ?? null;
  const activePlaybackEntry = activePlaybackChunk?.entries.find((entry) => narrator.currentWordIndex >= entry.startWord && narrator.currentWordIndex < entry.endWord)
    ?? activePlaybackChunk?.entries[0]
    ?? null;
  const activeSourceSegmentIndex = activePlaybackEntry?.segmentIndex ?? -1;
  const activeSourceWordIndex = activePlaybackEntry
    ? activePlaybackEntry.sourceWordStart + Math.max(0, narrator.currentWordIndex - activePlaybackEntry.startWord)
    : 0;
  const activeSourceSegment = activeSourceSegmentIndex >= 0 ? lastExtracted?.segments[activeSourceSegmentIndex] ?? null : null;
  const currentContentFingerprint = useMemo(() => contentFingerprint(lastExtracted?.text ?? ''), [lastExtracted?.text]);

  const persistCurrentContinuityNow = () => {
    if (playbackScope !== 'page' || !lastExtracted?.url || !currentContentFingerprint) return;
    const snapshot: ReadWebContinuitySnapshot = {
      version: 2,
      canonicalUrl: canonicalizeReadUrl(lastExtracted.url),
      title: lastExtracted.title,
      contentFingerprint: currentContentFingerprint,
      segmentIndex: Math.max(0, activeSourceSegmentIndex),
      wordIndex: Math.max(0, activeSourceWordIndex),
      focusMode,
      voiceId: selectedVoiceId,
      rate,
      savedAt: Date.now(),
    };
    lastContinuityFingerprintRef.current = currentContentFingerprint;
    void saveReadWebContinuity(snapshot);
  };

  useEffect(() => {
    if (playbackScope !== 'page' || !lastExtracted?.url || activeSourceSegmentIndex < 0) return;
    if (continuitySaveTimerRef.current) clearTimeout(continuitySaveTimerRef.current);
    continuitySaveTimerRef.current = setTimeout(() => {
      const snapshot: ReadWebContinuitySnapshot = {
        version: 2, canonicalUrl: canonicalizeReadUrl(lastExtracted.url), title: lastExtracted.title,
        contentFingerprint: currentContentFingerprint, segmentIndex: activeSourceSegmentIndex,
        wordIndex: Math.max(0, activeSourceWordIndex), focusMode, voiceId: selectedVoiceId, rate, savedAt: Date.now(),
      };
      lastContinuityFingerprintRef.current = currentContentFingerprint;
      void saveReadWebContinuity(snapshot);
      continuitySaveTimerRef.current = null;
    }, 900);
    return () => { if (continuitySaveTimerRef.current) { clearTimeout(continuitySaveTimerRef.current); continuitySaveTimerRef.current = null; } };
  }, [activeSourceSegmentIndex, activeSourceWordIndex, currentContentFingerprint, focusMode, lastExtracted?.title, lastExtracted?.url, playbackScope, rate, selectedVoiceId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || playbackScope !== 'page' || !lastExtracted?.url || activeSourceSegmentIndex < 0) return;
      const snapshot: ReadWebContinuitySnapshot = {
        version: 2, canonicalUrl: canonicalizeReadUrl(lastExtracted.url), title: lastExtracted.title,
        contentFingerprint: currentContentFingerprint, segmentIndex: activeSourceSegmentIndex,
        wordIndex: Math.max(0, activeSourceWordIndex), focusMode, voiceId: selectedVoiceId, rate, savedAt: Date.now(),
      };
      void saveReadWebContinuity(snapshot);
    });
    return () => subscription.remove();
  }, [activeSourceSegmentIndex, activeSourceWordIndex, currentContentFingerprint, focusMode, lastExtracted?.title, lastExtracted?.url, playbackScope, rate, selectedVoiceId]);

  useEffect(() => {
    if (playbackScope !== 'page' || !activePlaybackEntry || !lastExtracted?.segments.length) return;
    const focusKey = focusMode === 'word'
      ? `${focusMode}:${activeSourceSegmentIndex}:${activeSourceWordIndex}`
      : `${focusMode}:${activeSourceSegmentIndex}`;
    if (focusKey === lastFocusKeyRef.current) return;
    lastFocusKeyRef.current = focusKey;
    webRef.current?.injectJavaScript(`window.__floentlyReadBridge && window.__floentlyReadBridge.highlightFocus(${activeSourceSegmentIndex}, '${focusMode}', ${activeSourceWordIndex}, true); true;`);
  }, [activePlaybackEntry, activeSourceSegmentIndex, activeSourceWordIndex, focusMode, lastExtracted?.segments.length, playbackScope]);

  const voiceLabel = selectedVoice ? selectedVoice.name : 'Loading voices…';
  const visibleVoices = voices.filter((voice) => voiceFilter === 'all' || voice.accent === voiceFilter);
  const status = narrator.error
    ? narrator.error
    : narrator.buffering
      ? `Preparing audio ${Math.min(narrator.currentSegment + 1, Math.max(narrator.totalSegments, 1))} of ${Math.max(narrator.totalSegments, 1)}…`
      : narrator.interSegmentPause
        ? `Natural pause · next section ${Math.min(narrator.currentSegment + 2, narrator.totalSegments)} of ${narrator.totalSegments}`
        : narrator.active
          ? `${narrator.paused ? 'Paused' : 'Reading'}${activeSourceSegmentIndex >= 0 && lastExtracted?.segments.length ? ` ${activeSourceSegmentIndex + 1} of ${lastExtracted.segments.length}` : ''} · ${formatReadTime(narrator.currentTime)} / ${formatReadTime(narrator.duration)}${focusMode === 'word' && narrator.currentWord ? ` · ${narrator.currentWord}` : ''}`
        : narrator.totalSegments > 0 && narrator.progress >= 0.999
          ? 'Finished reading this page.'
          : manualStatus;

  const readPage = () => {
    narrator.stop();
    setPlaybackScope('none');
    setManualStatus('Finding the main readable content…');
    webRef.current?.injectJavaScript(EXTRACT_SCRIPT);
  };

  const handleDetectedRoute = (url: string, authLike: boolean) => {
    const nextCanonical = canonicalizeReadUrl(url);
    const previousCanonical = canonicalizeReadUrl(lastNavigationUrlRef.current);
    lastNavigationUrlRef.current = url;
    setAddress(url);
    if (authLike || isSensitiveAuthUrl(url)) {
      persistCurrentContinuityNow();
      routeAutoContinueRef.current = false;
      narrator.stop();
      setPlaybackScope('none');
      setPlaybackChunks([]);
      setLastExtracted(null);
      setManualStatus('Sign-in page detected. Floently reading is suspended until you return to content.');
      return;
    }
    if (nextCanonical === previousCanonical) return;
    let sameOrigin = false;
    try { sameOrigin = new URL(nextCanonical).origin === new URL(previousCanonical).origin; } catch { sameOrigin = false; }
    const shouldContinue = sameOrigin && narrator.active && playbackScope === 'page' && Boolean(lastExtracted);
    if (lastExtracted) persistCurrentContinuityNow();
    routeAutoContinueRef.current = sameOrigin && (routeAutoContinueRef.current || shouldContinue);
    narrator.stop();
    setPlaybackScope('none');
    setPlaybackChunks([]);
    setLastExtracted(null);
    lastFocusKeyRef.current = '';
    setManualStatus(shouldContinue ? 'Page changed · finding the next readable content…' : 'Page changed. Tap Read page when you are ready.');
  };

  const applyReadModel = async (payload: any, extracted: BrowserReadModel, segments: BrowserReadSegment[]) => {
    const reason = String(payload?.reason || 'manual');
    const fingerprint = contentFingerprint(extracted.text);
    if (reason === 'content' && fingerprint === currentContentFingerprint) return;
    if (reason === 'content' && !narrator.active) return;

    let startSegmentIndex = 0;
    let startWordIndex = 0;
    let resumeFocusMode: ReadFocusMode = focusMode;
    let resumeLabel = '';

    if (reason === 'content' && lastExtracted && canonicalizeReadUrl(lastExtracted.url) === canonicalizeReadUrl(extracted.url) && activeSourceSegment) {
      const anchor = activeSourceSegment.text.replace(/\s+/g, ' ').trim().toLowerCase();
      const mapped = segments.findIndex((segment) => segment.text.replace(/\s+/g, ' ').trim().toLowerCase() === anchor);
      if (mapped >= 0) {
        startSegmentIndex = mapped;
        startWordIndex = activeSourceWordIndex;
        resumeLabel = 'Updated page · continuing from the current sentence';
      }
    } else {
      const saved = await loadReadWebContinuity(extracted.url);
      if (saved && saved.contentFingerprint === fingerprint && saved.segmentIndex < segments.length) {
        startSegmentIndex = Math.max(0, saved.segmentIndex);
        startWordIndex = Math.max(0, saved.wordIndex);
        resumeFocusMode = saved.focusMode;
        resumeLabel = `Resuming sentence ${startSegmentIndex + 1} · word ${startWordIndex + 1}`;
        if (Number.isFinite(saved.rate)) setRate(Math.min(2, Math.max(0.5, saved.rate)));
      }
    }

    const chunks = buildPlaybackChunks(segments.slice(startSegmentIndex), startSegmentIndex, 1800, startWordIndex);
    setLastExtracted(extracted);
    setPlaybackChunks(chunks);
    setFocusMode(resumeFocusMode);
    lastFocusKeyRef.current = '';
    lastContinuityFingerprintRef.current = fingerprint;
    const shouldStart = reason === 'manual' || routeAutoContinueRef.current || (reason === 'content' && narrator.active);
    routeAutoContinueRef.current = false;
    if (!shouldStart) {
      setManualStatus(`Ready · ${extracted.title} · ${segments.length} sentences`);
      return;
    }
    setPlaybackScope('page');
    webRef.current?.injectJavaScript("window.__floentlyReadBridge && window.__floentlyReadBridge.setInteractionMode('jump'); true;");
    setManualStatus(resumeLabel || `Reading · ${extracted.title} · ${segments.length} sentences`);
    void narrator.startSegments(chunks.map((chunk) => ({ text: chunk.text, pauseAfterMs: 0 })));
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'READ_ROUTE') {
        const url = String(payload.url || address).trim();
        handleDetectedRoute(url, Boolean(payload.authLike));
        return;
      }
      if (payload?.type === 'READ_SENSITIVE_ROUTE') {
        handleDetectedRoute(String(payload.url || address).trim(), true);
        return;
      }
      if (payload?.type === 'READ_CONTENT_CHANGED') {
        if (narrator.active) setManualStatus('Readable content changed · remapping your current position…');
        return;
      }
      if (payload?.type === 'READ_ERROR') {
        setManualStatus(payload.message || 'Could not read this page.');
        return;
      }
      if (payload?.type === 'READ_JUMP') {
        const index = Number(payload.index);
        if (Number.isFinite(index) && index >= 0 && index < (lastExtracted?.segments.length ?? 0)) {
          jumpToSection(index);
          setManualStatus(`Jumped to sentence ${index + 1}.`);
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
        setPlaybackChunks([]);
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
        setManualStatus('No readable main content was found on this view.');
        return;
      }
      const extracted: BrowserReadModel = {
        text,
        segments,
        title: String(payload.title || 'Web reading').trim() || 'Web reading',
        url: String(payload.url || address).trim(),
      };
      void applyReadModel(payload, extracted, segments);
    } catch {
      // Ignore messages outside the Read bridge.
    }
  };

  const go = () => {
    Keyboard.dismiss();
    const next = normalizeUrl(address);
    if (lastExtracted) persistCurrentContinuityNow();
    routeAutoContinueRef.current = false;
    narrator.stop();
    setPlaybackScope('none');
    setPlaybackChunks([]);
    setLastExtracted(null);
    lastNavigationUrlRef.current = next;
    setCurrentUrl(next);
    setAddress(next);
    setManualStatus('Opening page. Tap Read page when the content is ready.');
  };

  const changeRate = (delta: number) => {
    const next = Math.min(2, Math.max(0.5, Math.round((rate + delta) * 10) / 10));
    setRate(next);
    setManualStatus(`Speed ${next.toFixed(1)}×.`);
  };

  const revealPlayer = () => {
    if (playerCollapseTimerRef.current) {
      clearTimeout(playerCollapseTimerRef.current);
      playerCollapseTimerRef.current = null;
    }
    setPlayerExpanded(true);
    const shouldRecollapse = playerDockMode === 'minimized' || (playerDockMode === 'auto' && narrator.playing);
    if (shouldRecollapse) {
      playerCollapseTimerRef.current = setTimeout(() => {
        setPlayerExpanded(false);
        playerCollapseTimerRef.current = null;
      }, PLAYER_TEMP_REVEAL_MS);
    }
  };

  const updatePlayerDockMode = (mode: PlayerDockMode) => {
    setPlayerDockMode(mode);
    setPlayerSettingsOpen(false);
    void AsyncStorage.setItem(PLAYER_DOCK_MODE_KEY, mode).catch(() => undefined);
    if (mode === 'pinned') setPlayerExpanded(true);
    if (mode === 'minimized') setPlayerExpanded(false);
    if (mode === 'auto') setPlayerExpanded(true);
  };

  const readSelection = () => {
    narrator.stop();
    setManualStatus('Reading your selected text…');
    webRef.current?.injectJavaScript(`${INSTALL_READ_BRIDGE_SCRIPT}\nwindow.__floentlyReadBridge && window.__floentlyReadBridge.getSelection(); true;`);
  };

  const chooseFocusMode = (mode: ReadFocusMode) => {
    setFocusMode(mode);
    lastFocusKeyRef.current = '';
    setManualStatus(`${mode === 'word' ? 'Word-by-word' : mode === 'sentence' ? 'Sentence-by-sentence' : 'Chunk'} tracking enabled.`);
  };

  const jumpToSection = (index: number) => {
    if (!lastExtracted?.segments[index]) return;
    setSectionsOpen(false);
    const chunks = buildPlaybackChunks(lastExtracted.segments.slice(index), index);
    setPlaybackChunks(chunks);
    setPlaybackScope('page');
    lastFocusKeyRef.current = '';
    void narrator.startSegments(chunks.map((chunk) => ({ text: chunk.text, pauseAfterMs: 0 })));
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
            if (!nav.url) return;
            setAddress(nav.url);
            if (canonicalizeReadUrl(nav.url) !== canonicalizeReadUrl(lastNavigationUrlRef.current)) {
              handleDetectedRoute(nav.url, isSensitiveAuthUrl(nav.url));
            } else {
              lastNavigationUrlRef.current = nav.url;
            }
          }}
          onLoadEnd={() => {
            const url = lastNavigationUrlRef.current;
            if (!routeAutoContinueRef.current || isSensitiveAuthUrl(url)) return;
            setTimeout(() => {
              if (routeAutoContinueRef.current) webRef.current?.injectJavaScript(ROUTE_EXTRACT_SCRIPT);
            }, 420);
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

      {playerExpanded ? (
        <View style={styles.readerBar}>
          <View style={styles.playerTopRow}>
            <View style={styles.playerBrandMark}><Text style={styles.playerBrandMarkText}>F</Text></View>
            <View style={styles.playerHeadline}>
              <Text style={styles.playerEyebrow}>FLOENTLY READ · MOBILE PLAYER</Text>
              <Text numberOfLines={1} style={styles.playerTitle}>
                {narrator.active && activeSourceSegment?.text ? activeSourceSegment.text : 'Ready to read this page'}
              </Text>
            </View>
            <Pressable onPress={() => setPlayerSettingsOpen(true)} style={styles.playerHeaderButton} accessibilityLabel="Player behavior">
              <Text style={styles.playerHeaderButtonText}>⚙</Text>
            </Pressable>
            <Pressable onPress={() => setPlayerExpanded(false)} style={styles.playerHeaderButton} accessibilityLabel="Minimize player">
              <Text style={styles.playerHeaderButtonText}>⌄</Text>
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
            <Pressable onPress={() => chooseFocusMode('chunk')} style={[styles.selectorButton, focusMode === 'chunk' && styles.selectorButtonActive]}>
              <Text style={[styles.selectorLabel, focusMode === 'chunk' && styles.selectorLabelActive]}>Chunk</Text>
            </Pressable>
            <Pressable onPress={() => chooseFocusMode('sentence')} style={[styles.selectorButton, focusMode === 'sentence' && styles.selectorButtonActive]}>
              <Text style={[styles.selectorLabel, focusMode === 'sentence' && styles.selectorLabelActive]}>Sentence</Text>
            </Pressable>
            <Pressable onPress={() => chooseFocusMode('word')} style={[styles.selectorButton, focusMode === 'word' && styles.selectorButtonActive]}>
              <Text style={[styles.selectorLabel, focusMode === 'word' && styles.selectorLabelActive]}>Word</Text>
            </Pressable>
            <Pressable onPress={readSelection} style={styles.selectorButton}>
              <Text style={styles.selectorLabel}>Selection</Text>
            </Pressable>
          </View>

          <View style={styles.utilityRow}>
            <Pressable disabled={!lastExtracted?.segments.length} onPress={() => setSectionsOpen(true)} style={[styles.utilityButton, !lastExtracted?.segments.length && styles.disabled]}>
              <Text style={styles.utilityButtonText}>Sections</Text>
            </Pressable>
            <Pressable disabled={!lastExtracted || renderingPage || savingPage} onPress={() => void renderCurrentReading()} style={[styles.utilityButton, (!lastExtracted || renderingPage || savingPage) && styles.disabled]}>
              <Text style={styles.utilityButtonText}>{renderingPage ? 'Rendering…' : 'Render'}</Text>
            </Pressable>
            <Pressable disabled={!lastExtracted || savingPage || renderingPage} onPress={() => void saveCurrentReading()} style={[styles.utilityButton, (!lastExtracted || savingPage || renderingPage) && styles.disabled]}>
              <Text style={styles.utilityButtonText}>{savingPage ? 'Saving…' : 'Save'}</Text>
            </Pressable>
            {narrator.active ? <Pressable onPress={narrator.stop} style={styles.stopCompact}><Text style={styles.stopCompactText}>■ Stop</Text></Pressable> : null}
          </View>
        </View>
      ) : (
        <Pressable onPress={revealPlayer} onLongPress={() => setPlayerSettingsOpen(true)} style={styles.playerCollapsedDock} accessibilityLabel="Show Floently Read player">
          <View style={styles.collapsedProgressTrack}>
            <View style={[styles.collapsedProgressFill, { width: `${Math.round(narrator.progress * 100)}%` }]} />
          </View>
          <View style={styles.collapsedDockContent}>
            <View style={styles.collapsedGrip} />
            <Text numberOfLines={1} style={styles.collapsedDockText}>
              {narrator.playing ? 'Playing' : narrator.paused ? 'Paused' : 'Floently Read'} · {Math.round(narrator.progress * 100)}%
            </Text>
            <Text style={styles.collapsedDockChevron}>⌃</Text>
          </View>
        </Pressable>
      )}


      <Modal visible={playerSettingsOpen} transparent animationType="slide" onRequestClose={() => setPlayerSettingsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.playerSettingsSheet}>
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetKicker}>PLAYER BEHAVIOR</Text><Text style={styles.sheetTitle}>How should the player behave?</Text></View>
              <Pressable onPress={() => setPlayerSettingsOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>Done</Text></Pressable>
            </View>
            <Text style={styles.sheetHint}>Choose how much of the website Floently should keep visible while you listen.</Text>
            {[
              { id: 'auto' as const, title: 'Auto-hide while playing', body: 'Recommended. The full player collapses after playback starts. Tap the bottom handle to bring it back temporarily.' },
              { id: 'pinned' as const, title: 'Always open', body: 'Keep all playback, voice, speed, and reading controls visible.' },
              { id: 'minimized' as const, title: 'Keep minimized', body: 'Keep the website as large as possible. Tap the bottom handle whenever you need the controls.' },
            ].map((option) => (
              <Pressable key={option.id} onPress={() => updatePlayerDockMode(option.id)} style={[styles.playerBehaviorOption, playerDockMode === option.id && styles.playerBehaviorOptionActive]}>
                <View style={styles.playerBehaviorCopy}>
                  <Text style={styles.playerBehaviorTitle}>{option.title}</Text>
                  <Text style={styles.playerBehaviorBody}>{option.body}</Text>
                </View>
                <View style={[styles.playerBehaviorRadio, playerDockMode === option.id && styles.playerBehaviorRadioActive]}>
                  {playerDockMode === option.id ? <View style={styles.playerBehaviorRadioDot} /> : null}
                </View>
              </Pressable>
            ))}
            <Text style={styles.playerSettingsFootnote}>Tip: long-press the minimized bottom handle to open these settings directly.</Text>
          </View>
        </View>
      </Modal>

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
                <Pressable key={`${segment.blockId ?? 'section'}-${index}`} onPress={() => jumpToSection(index)} style={[styles.sectionOption, index === activeSourceSegmentIndex && styles.sectionOptionActive]}>
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
            <Text style={styles.sheetHint}>Choose by accent. Provider names are shown so Google, Azure, and ElevenLabs voices are never silently mixed.</Text>
            <View style={styles.voiceFilterRow}>
              {([
                { id: 'all' as const, label: `All ${voices.length}` },
                { id: 'American' as const, label: `US ${voices.filter((voice) => voice.accent === 'American').length}` },
                { id: 'British' as const, label: `UK ${voices.filter((voice) => voice.accent === 'British').length}` },
                { id: 'Finnish' as const, label: `FI ${voices.filter((voice) => voice.accent === 'Finnish').length}` },
              ]).map((filter) => (
                <Pressable key={filter.id} onPress={() => setVoiceFilter(filter.id)} style={[styles.voiceFilterChip, voiceFilter === filter.id && styles.voiceFilterChipActive]}>
                  <Text style={[styles.voiceFilterText, voiceFilter === filter.id && styles.voiceFilterTextActive]}>{filter.label}</Text>
                </Pressable>
              ))}
            </View>
            <ScrollView style={styles.voiceList} contentContainerStyle={styles.voiceListContent}>
              {visibleVoices.map((voice) => (
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
  playerCollapsedDock: { minHeight: 34, backgroundColor: '#0B1320', borderTopWidth: 1, borderTopColor: '#27344A', justifyContent: 'flex-end' },
  collapsedProgressTrack: { height: 3, backgroundColor: '#202C40', overflow: 'hidden' },
  collapsedProgressFill: { height: '100%', backgroundColor: '#7187FF' },
  collapsedDockContent: { minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 9 },
  collapsedGrip: { width: 34, height: 4, borderRadius: 999, backgroundColor: '#3A4961' },
  collapsedDockText: { color: '#AEB9CA', fontSize: 9.5, fontWeight: '800', maxWidth: 150 },
  collapsedDockChevron: { color: '#9AA8FF', fontSize: 16, lineHeight: 18, fontWeight: '900' },
  playerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerBrandMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364FF' },
  playerBrandMarkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  playerHeadline: { flex: 1, minWidth: 0 },
  playerEyebrow: { color: '#7F92FF', fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: 1.2 },
  playerTitle: { color: '#F7F9FF', fontSize: 13.5, lineHeight: 18, fontWeight: '800', marginTop: 2 },
  playerHeaderButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#162237', borderWidth: 1, borderColor: '#283A58' },
  playerHeaderButtonText: { color: '#C9D3E4', fontSize: 16, fontWeight: '900' },
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
  playerSettingsSheet: { backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, borderTopWidth: 1, borderColor: '#273247' },
  playerBehaviorOption: { minHeight: 82, borderRadius: 18, backgroundColor: '#151F31', borderWidth: 1, borderColor: '#26344C', paddingHorizontal: 14, paddingVertical: 13, marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerBehaviorOptionActive: { backgroundColor: '#19294F', borderColor: '#7187FF' },
  playerBehaviorCopy: { flex: 1 },
  playerBehaviorTitle: { color: '#F5F7FD', fontSize: 14, fontWeight: '900' },
  playerBehaviorBody: { color: '#909EB3', fontSize: 11, lineHeight: 16, marginTop: 4 },
  playerBehaviorRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#4C5B73', alignItems: 'center', justifyContent: 'center' },
  playerBehaviorRadioActive: { borderColor: '#7187FF' },
  playerBehaviorRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7187FF' },
  playerSettingsFootnote: { color: '#69778C', fontSize: 10, lineHeight: 15, marginTop: 12 },
  sectionSheet: { maxHeight: '78%', backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18, borderTopWidth: 1, borderColor: '#273247' },
  sectionList: { gap: 7, paddingBottom: 18 },
  sectionOption: { minHeight: 62, borderRadius: 16, backgroundColor: '#162033', borderWidth: 1, borderColor: 'transparent', padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sectionOptionActive: { borderColor: '#5364ff', backgroundColor: '#19294f' },
  sectionNumber: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#223252', alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { color: '#8fa0ff', fontSize: 10, fontWeight: '900' },
  sectionText: { flex: 1, color: '#e7ebf3', fontSize: 11.5, lineHeight: 17 },
  voiceSheet: { maxHeight: '76%', backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, borderTopWidth: 1, borderColor: '#273247' },
  voiceFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  voiceFilterChip: { flex: 1, minHeight: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151F31', borderWidth: 1, borderColor: '#26344C', paddingHorizontal: 5 },
  voiceFilterChipActive: { backgroundColor: '#263A72', borderColor: '#7187FF' },
  voiceFilterText: { color: '#A7B2C3', fontSize: 9.5, fontWeight: '800' },
  voiceFilterTextActive: { color: '#FFFFFF' },
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
