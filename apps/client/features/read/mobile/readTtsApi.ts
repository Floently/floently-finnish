import { getAuthToken } from '@core/api/apiClient';

const DEFAULT_READ_API_BASE_URL = 'https://flowreader-api.onrender.com';
const DEFAULT_TTS_VOICE_ID = 'google:en-US-Neural2-C';

export type ReadTtsResult = {
  audioPath?: string | null;
  audioUrl: string;
  cacheHit?: boolean;
  cacheKey?: string | null;
  duration?: number | null;
  fastResponse?: boolean;
  logicalGeneratedAt?: string | null;
  timeProviderMode?: string | null;
  timeScaleFactor?: number | null;
  voiceId?: string | null;
  wordTimings?: unknown[];
};

export type ReadVoice = {
  id: string;
  name: string;
  language: string;
  locale: string;
  gender?: string | null;
  accent?: string | null;
  description?: string | null;
  previewUrl?: string | null;
};

export type ReadVoiceCatalog = {
  defaultVoiceId: string;
  voices: ReadVoice[];
};

type PrerenderReadingInput = {
  text: string;
  language?: string | null;
  voiceId?: string | null;
};

function getReadApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_READ_API_BASE_URL?.trim();
  return fromEnv || DEFAULT_READ_API_BASE_URL;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pickVoiceId(input?: string | null): string {
  const value = String(input || '').trim();
  return value || DEFAULT_TTS_VOICE_ID;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function normalizeTtsResult(payload: unknown): ReadTtsResult {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  const source = Object.keys(data).length ? data : record;
  const audioUrl = typeof source.audioUrl === 'string' ? source.audioUrl : typeof source.audio_url === 'string' ? source.audio_url : '';

  if (!audioUrl.trim()) {
    throw new Error('Render TTS did not return an audio URL.');
  }

  return {
    audioPath: typeof source.audioPath === 'string' ? source.audioPath : typeof source.audio_path === 'string' ? source.audio_path : null,
    audioUrl: audioUrl.trim(),
    cacheHit: Boolean(source.cacheHit ?? source.cache_hit),
    cacheKey: typeof source.cacheKey === 'string' ? source.cacheKey : typeof source.cache_key === 'string' ? source.cache_key : null,
    duration: typeof source.duration === 'number' ? source.duration : Number(source.duration || 0) || null,
    fastResponse: Boolean(source.fastResponse ?? source.fast_response),
    logicalGeneratedAt: typeof source.logicalGeneratedAt === 'string' ? source.logicalGeneratedAt : null,
    timeProviderMode: typeof source.timeProviderMode === 'string' ? source.timeProviderMode : null,
    timeScaleFactor: typeof source.timeScaleFactor === 'number' ? source.timeScaleFactor : null,
    voiceId: typeof source.voiceId === 'string' ? source.voiceId : typeof source.voice_id === 'string' ? source.voice_id : null,
    wordTimings: Array.isArray(source.wordTimings) ? source.wordTimings : [],
  };
}

async function postReadApi(path: string, body: Record<string, unknown>): Promise<unknown> {
  const token = getAuthToken();
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getReadApiBaseUrl()}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const record = asRecord(payload);
    const errorRecord = asRecord(record.error);
    const message =
      typeof errorRecord.message === 'string'
        ? errorRecord.message
        : typeof record.detail === 'string'
          ? record.detail
          : typeof record.message === 'string'
            ? record.message
            : `Render TTS request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function getReadApi(path: string): Promise<unknown> {
  const token = getAuthToken();
  const headers = new Headers({ Accept: 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${getReadApiBaseUrl()}${path}`, { headers });
  const payload = await readJson(response);
  if (!response.ok) {
    const record = asRecord(payload);
    const message =
      typeof record.detail === 'string'
        ? record.detail
        : typeof record.message === 'string'
          ? record.message
          : `Read voice request failed with ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function normalizeVoice(value: unknown): ReadVoice | null {
  const record = asRecord(value);
  const id = String(record.id || '').trim();
  const name = String(record.name || record.voiceName || id).trim();
  const language = String(record.language || '').trim().toLowerCase();
  const locale = String(record.locale || '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    language,
    locale,
    gender: typeof record.gender === 'string' ? record.gender : null,
    accent: typeof record.accent === 'string' ? record.accent : null,
    description: typeof record.description === 'string' ? record.description : null,
    previewUrl: typeof record.previewUrl === 'string' ? record.previewUrl : null,
  };
}

export const readTtsApi = {
  async listVoices(): Promise<ReadVoiceCatalog> {
    const payload = asRecord(await getReadApi('/api/voices/unified'));
    const rawVoices = Array.isArray(payload.voices)
      ? payload.voices
      : Array.isArray(payload.available)
        ? payload.available
        : [];
    const voices = rawVoices
      .map(normalizeVoice)
      .filter((voice): voice is ReadVoice => Boolean(voice));
    return {
      defaultVoiceId: String(payload.default || voices[0]?.id || DEFAULT_TTS_VOICE_ID),
      voices,
    };
  },

  async prerenderReading(input: PrerenderReadingInput): Promise<ReadTtsResult> {
    const text = input.text.trim();
    if (!text) {
      throw new Error('No readable text was available for TTS.');
    }

    const payload = await postReadApi('/api/tts/prerender', {
      text,
      language: input.language ?? 'auto',
      voiceId: pickVoiceId(input.voiceId),
    });

    return normalizeTtsResult(payload);
  },
};

export default readTtsApi;
