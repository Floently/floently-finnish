const DEFAULT_READ_API_BASE_URL = 'https://flowreader-api.onrender.com';

function readApiBaseUrl(): string {
  const configured = typeof process !== 'undefined'
    ? String(process.env?.EXPO_PUBLIC_READ_API_BASE_URL ?? '').trim()
    : '';
  return (configured || DEFAULT_READ_API_BASE_URL).replace(/\/+$/, '');
}

function resolveReadUrl(value: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) return readApiBaseUrl();
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${readApiBaseUrl()}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

export type ReadVoice = {
  id: string;
  name: string;
  provider: string;
  voiceName?: string;
  locale: string;
  language: string;
  gender?: string;
  accent?: string;
  category?: string;
  description?: string;
};

export type ReadWordTiming = {
  word: string;
  start: number;
  end: number;
};

export type ReadAudioSegment = {
  audioUrl: string;
  cacheKey: string | null;
  duration: number;
  wordTimings: ReadWordTiming[];
};

export type ReadProject = {
  id: string;
  title: string;
  kind: string;
  status: string;
  sourceType: string;
  sourceUrl: string | null;
  wordCount: number;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
  progress: {
    progressPercent: number;
    currentSegmentIndex: number;
    voiceId?: string | null;
    playbackRate?: number | null;
  } | null;
  rawText?: string;
};

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function errorMessage(payload: any, fallback: string): string {
  if (typeof payload?.detail === 'string' && payload.detail.trim()) return payload.detail.trim();
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error.trim();
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message.trim();
  return fallback;
}

async function request(token: string, path: string, init: RequestInit = {}, fallback = 'Read request failed.') {
  const headers = new Headers(init.headers);
  if (token.trim()) headers.set('Authorization', `Bearer ${token.trim()}`);
  const response = await fetch(`${readApiBaseUrl()}${path}`, { ...init, headers });
  const payload = await readJson(response);
  if (!response.ok) {
    const detail = errorMessage(payload, fallback);
    const error = new Error(`${detail}${detail.includes(String(response.status)) ? '' : ` (HTTP ${response.status})`}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload;
}

function normalizeProject(value: any): ReadProject | null {
  if (!value || typeof value !== 'object') return null;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!id || !title) return null;
  const progress = value.progress && typeof value.progress === 'object'
    ? {
        progressPercent: Number(value.progress.progressPercent ?? 0) || 0,
        currentSegmentIndex: Number(value.progress.currentSegmentIndex ?? 0) || 0,
        voiceId: typeof value.progress.voiceId === 'string' ? value.progress.voiceId : null,
        playbackRate: typeof value.progress.playbackRate === 'number' ? value.progress.playbackRate : null,
      }
    : null;
  return {
    id,
    title,
    kind: typeof value.kind === 'string' ? value.kind : 'document',
    status: typeof value.status === 'string' ? value.status : 'ready',
    sourceType: typeof value.sourceType === 'string' ? value.sourceType : 'text',
    sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : null,
    wordCount: Number(value.wordCount ?? 0) || 0,
    characterCount: Number(value.characterCount ?? 0) || 0,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    lastOpenedAt: typeof value.lastOpenedAt === 'string' ? value.lastOpenedAt : null,
    progress,
    rawText: typeof value.rawText === 'string' ? value.rawText : undefined,
  };
}

export async function fetchReadVoices(): Promise<{ defaultVoiceId: string; voices: ReadVoice[] }> {
  const response = await fetch(`${readApiBaseUrl()}/api/voices/unified`);
  const payload = await readJson(response);
  if (!response.ok) throw new Error(errorMessage(payload, 'Could not load Read voices.'));
  const raw = Array.isArray(payload?.voices) ? payload.voices : Array.isArray(payload?.available) ? payload.available : [];
  const voices: ReadVoice[] = raw
    .filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.available !== false)
    .map((item: any): ReadVoice => ({
      id: item.id,
      name: item.name,
      provider: typeof item.provider === 'string' ? item.provider : String(item.id).split(':')[0] || 'unknown',
      voiceName: typeof item.voiceName === 'string' ? item.voiceName : undefined,
      locale: typeof item.locale === 'string' ? item.locale : 'en-US',
      language: typeof item.language === 'string' ? item.language : 'en',
      gender: typeof item.gender === 'string' ? item.gender : undefined,
      accent: typeof item.accent === 'string' ? item.accent : undefined,
      category: typeof item.category === 'string' ? item.category : undefined,
      description: typeof item.description === 'string' ? item.description : undefined,
    }));
  const requestedDefault = typeof payload?.default === 'string' ? payload.default : '';
  const defaultVoiceId = voices.some((voice) => voice.id === requestedDefault)
    ? requestedDefault
    : voices.find((voice) => voice.provider.toLowerCase() === 'google')?.id ?? voices[0]?.id ?? 'google:en-US-Neural2-C';
  return { defaultVoiceId, voices };
}

export async function prerenderReadAudio(token: string, input: {
  text: string;
  voiceId: string;
  locale?: string;
  language?: string;
  voiceName?: string;
}): Promise<ReadAudioSegment> {
  const provider = input.voiceId.includes(':') ? input.voiceId.split(':', 1)[0] : undefined;
  let payload: any = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      payload = await request(token, '/api/tts/prerender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input.text,
          voiceId: input.voiceId,
          provider,
          voiceName: input.voiceName,
          locale: input.locale,
          language: input.language,
        }),
      }, 'Could not generate Read audio.');
      break;
    } catch (cause) {
      lastError = cause;
      const status = (cause as { status?: number } | null)?.status;
      const retryable = status === 429 || status === 502 || status === 503 || status === 504;
      if (!retryable || attempt === 2) throw cause;
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  if (!payload) throw (lastError instanceof Error ? lastError : new Error('Could not generate Read audio.'));
  const audioValue = typeof payload?.audioUrl === 'string' && payload.audioUrl.trim()
    ? payload.audioUrl
    : typeof payload?.audioPath === 'string' ? payload.audioPath : '';
  if (!audioValue) throw new Error('Read audio did not return a playable file.');
  const timings = Array.isArray(payload?.wordTimings)
    ? payload.wordTimings.filter((item: any) => item && typeof item.word === 'string' && Number.isFinite(item.start) && Number.isFinite(item.end))
    : [];
  return {
    audioUrl: resolveReadUrl(audioValue),
    cacheKey: typeof payload?.cacheKey === 'string' ? payload.cacheKey : null,
    duration: Number(payload?.duration ?? 0) || 0,
    wordTimings: timings,
  };
}

export async function listReadProjects(token: string, limit = 30): Promise<ReadProject[]> {
  const payload = await request(token, `/api/v1/projects?limit=${encodeURIComponent(String(limit))}&offset=0`, {}, 'Could not load your Read library.');
  const projects = Array.isArray(payload?.projects) ? payload.projects : [];
  return projects.map(normalizeProject).filter((project: ReadProject | null): project is ReadProject => Boolean(project));
}

export async function getReadProject(token: string, projectId: string): Promise<ReadProject> {
  const payload = await request(token, `/api/v1/projects/${encodeURIComponent(projectId)}`, {}, 'Could not open this document.');
  const project = normalizeProject(payload?.project);
  if (!project || typeof project.rawText !== 'string') throw new Error('This document did not include readable text.');
  return project;
}

export async function createReadProjectFromText(token: string, input: { text: string; title?: string }): Promise<ReadProject> {
  const payload = await request(token, '/api/v1/projects/from-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.text, title: input.title, sourceType: 'text' }),
  }, 'Could not save this text.');
  const project = normalizeProject(payload?.project);
  if (!project) throw new Error('The saved document response was invalid.');
  return project;
}

export async function createReadProjectFromUrl(token: string, input: { url: string; title?: string }): Promise<ReadProject> {
  const payload = await request(token, '/api/v1/projects/from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: input.url, title: input.title }),
  }, 'Could not import this website.');
  const project = normalizeProject(payload?.project);
  if (!project) throw new Error('The imported website response was invalid.');
  return project;
}

export async function uploadReadProject(token: string, input: { uri: string; name: string; mimeType?: string; title?: string }): Promise<ReadProject> {
  const form = new FormData();
  form.append('file', { uri: input.uri, name: input.name, type: input.mimeType || 'application/octet-stream' } as any);
  if (input.title?.trim()) form.append('title', input.title.trim());
  const payload = await request(token, '/api/v1/projects/upload', { method: 'POST', body: form }, 'Could not upload this document.');
  const project = normalizeProject(payload?.project);
  if (!project) throw new Error('The uploaded document response was invalid.');
  return project;
}

export async function updateReadProjectProgress(token: string, projectId: string, input: {
  currentSegmentIndex: number;
  progressPercent: number;
  voiceId?: string | null;
  playbackRate?: number | null;
}): Promise<void> {
  await request(token, `/api/v1/projects/${encodeURIComponent(projectId)}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentSegmentIndex: Math.max(0, Math.floor(input.currentSegmentIndex || 0)),
      currentCharacterOffset: 0,
      progressPercent: Math.max(0, Math.min(100, input.progressPercent || 0)),
      voiceId: input.voiceId ?? null,
      playbackRate: input.playbackRate ?? null,
    }),
  }, 'Could not save reading progress.');
}

export async function generateReadInsight(token: string, input: {
  action: 'summarize' | 'key_points' | 'assistant';
  text: string;
  title?: string;
  question?: string;
  language?: string;
}): Promise<string> {
  const payload = await request(token, '/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: input.action,
      text: input.text.slice(0, 12000),
      title: input.title,
      question: input.question,
      language: input.language,
    }),
  }, 'Could not generate this study aid.');
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  if (!text) throw new Error('Floently returned an empty study response.');
  return text;
}
