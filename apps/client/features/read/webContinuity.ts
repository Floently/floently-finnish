import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'floently.read.webContinuity.v2:';
const INDEX_KEY = 'floently.read.webContinuity.v2:index';
const MAX_SAVED_PAGES = 80;

export type ReadWebContinuitySnapshot = {
  version: 2;
  canonicalUrl: string;
  title: string;
  contentFingerprint: string;
  segmentIndex: number;
  wordIndex: number;
  focusMode: 'chunk' | 'sentence' | 'word';
  voiceId: string | null;
  rate: number;
  savedAt: number;
};

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'mc_cid', 'mc_eid', 'ref', 'source',
]);

export function canonicalizeReadUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    const sorted = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    url.search = '';
    for (const [key, val] of sorted) url.searchParams.append(key, val);
    url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function isSensitiveAuthUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const target = `${url.pathname} ${url.search}`.toLowerCase();
    return /(?:^|[\/_-])(login|log-in|signin|sign-in|signup|sign-up|oauth|authorize|authorization|sso|saml|auth|account)(?:[\/_-]|$)/i.test(target);
  } catch {
    return false;
  }
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
export function contentFingerprint(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'empty';
  const sample = `${normalized.length}|${normalized.slice(0, 1200)}|${normalized.slice(-1200)}`;
  return `${normalized.length.toString(36)}-${hashText(sample)}`;
}

function storageKey(canonicalUrl: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(canonicalUrl)}`;
}

export async function loadReadWebContinuity(url: string): Promise<ReadWebContinuitySnapshot | null> {
  const canonicalUrl = canonicalizeReadUrl(url);
  try {
    const raw = await AsyncStorage.getItem(storageKey(canonicalUrl));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReadWebContinuitySnapshot>;
    if (parsed.version !== 2 || parsed.canonicalUrl !== canonicalUrl) return null;
    if (!Number.isFinite(parsed.segmentIndex) || !Number.isFinite(parsed.wordIndex)) return null;
    return parsed as ReadWebContinuitySnapshot;
  } catch {
    return null;
  }
}

async function updateIndex(canonicalUrl: string): Promise<void> {
  let existing: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    existing = raw ? JSON.parse(raw) : [];
  } catch {
    existing = [];
  }
  const next = [canonicalUrl, ...existing.filter((item) => item !== canonicalUrl)];
  const evicted = next.slice(MAX_SAVED_PAGES);
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(next.slice(0, MAX_SAVED_PAGES)));
  if (evicted.length) {
    await Promise.all(evicted.map((item) => AsyncStorage.removeItem(storageKey(item))));
  }
}

export async function saveReadWebContinuity(snapshot: ReadWebContinuitySnapshot): Promise<void> {
  const canonicalUrl = canonicalizeReadUrl(snapshot.canonicalUrl);
  const normalized: ReadWebContinuitySnapshot = {
    ...snapshot,
    version: 2,
    canonicalUrl,
    segmentIndex: Math.max(0, Math.floor(snapshot.segmentIndex)),
    wordIndex: Math.max(0, Math.floor(snapshot.wordIndex)),
    rate: Math.min(4, Math.max(0.25, Number(snapshot.rate) || 1)),
    savedAt: Number(snapshot.savedAt) || Date.now(),
  };
  try {
    await AsyncStorage.setItem(storageKey(canonicalUrl), JSON.stringify(normalized));
    await updateIndex(canonicalUrl);
  } catch {
    // Continuity is best-effort and must never interrupt narration.
  }
}
