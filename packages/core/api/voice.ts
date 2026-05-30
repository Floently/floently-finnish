import { getAuthToken } from './apiClient';
import { getClientDeviceHeaders } from './deviceIdentity';
import { getApiBaseUrl, resolveApiUrl } from './apiConfig';

export type VoiceProvider = 'google' | 'openai' | 'azure' | 'elevenlabs';
export type VoicePreference = 'male' | 'female' | 'neutral';

export type VoiceTtsRequest = {
  text: string;
  mode?: 'system' | 'conversation' | 'roleplay' | 'cards' | 'speaking_practice' | 'yki';
  voicePreference?: VoicePreference;
  voiceProfile?: string | null;
  provider?: VoiceProvider | string | null;
  replayable?: boolean;
  speed?: number;
};

export type VoiceTtsResult = {
  url: string;
  durationSeconds: number;
  provider: string;
  replayable: boolean;
  voiceProfile: string;
  cacheKey?: string;
  cached?: boolean;
  requestedProvider?: string | null;
  audio: {
    url: string;
    duration_seconds?: number | null;
    provider?: string | null;
    replayable?: boolean | null;
    voice_profile?: string | null;
  };
};

type VoiceResponsePayload = {
  detail?: string | { message?: string; code?: string };
  error?: string | { message?: string; code?: string };
  message?: string;
  data?: unknown;
  stt_available?: boolean;
  transcript?: string | null;
  text?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  failure_reasons?: string[] | null;
};

async function readVoiceJson(response: Response): Promise<VoiceResponsePayload | null> {
  return response.json().catch(() => null) as Promise<VoiceResponsePayload | null>;
}

function unwrapData(payload: unknown): any {
  if (!payload || typeof payload !== 'object') {
    return payload ?? null;
  }
  return ('data' in (payload as { data?: unknown }) ? (payload as { data?: unknown }).data : payload) ?? null;
}

function extractVoiceErrorMessage(payload: VoiceResponsePayload | null, fallback: string): string {
  const detail = payload?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  if (detail && typeof detail === 'object' && typeof detail.message === 'string' && detail.message.trim()) return detail.message.trim();
  const error = payload?.error;
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error && typeof error === 'object' && typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message.trim();
  return fallback;
}

export async function requestVoiceTts(input: VoiceTtsRequest): Promise<VoiceTtsResult | null> {
  const payload = {
    text: input.text,
    voice_profile: input.voiceProfile ?? null,
    voice_preference: input.voicePreference ?? (String(input.voiceProfile || '').toLowerCase().includes('male') ? 'male' : 'female'),
    speed: typeof input.speed === 'number' ? input.speed : 1,
    provider: input.provider ?? null,
    replayable: input.replayable ?? true,
    mode: input.mode ?? 'roleplay',
  };

  const headers = new Headers({ 'Content-Type': 'application/json' });
  const deviceHeaders = await getClientDeviceHeaders();
  for (const [key, value] of Object.entries(deviceHeaders)) {
    headers.set(key, value);
  }
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/voice/tts/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const json = await readVoiceJson(response) as {
    data?: {
      audio?: VoiceTtsResult['audio'];
      cache_key?: string;
      cached?: boolean;
      requested_provider?: string | null;
    };
    audio?: VoiceTtsResult['audio'];
    cache_key?: string;
    cached?: boolean;
    requested_provider?: string | null;
  } | null;
  if (!response.ok) {
    throw new Error(extractVoiceErrorMessage(json, 'Voice synthesis request failed.'));
  }
  const data = unwrapData(json);
  const audio = data?.audio ?? json?.audio;
  if (!audio?.url) {
    throw new Error('Voice synthesis returned no audio URL.');
  }
  const resolvedUrl = resolveApiUrl(audio.url);
  return {
    url: resolvedUrl,
    durationSeconds: Number(audio.duration_seconds ?? 0),
    provider: String(audio.provider ?? 'unknown'),
    replayable: Boolean(audio.replayable ?? true),
    voiceProfile: String(audio.voice_profile ?? input.voiceProfile ?? ''),
    cacheKey: data?.cache_key ?? json?.cache_key,
    cached: data?.cached ?? json?.cached,
    requestedProvider: data?.requested_provider ?? json?.requested_provider ?? input.provider ?? null,
    audio: {
      ...audio,
      url: resolvedUrl,
    },
  };
}

function buildFilePart(uriOrBlob: Blob | string, fileName: string, mimeType: string): any {
  return typeof uriOrBlob === 'string'
    ? ({ uri: uriOrBlob, name: fileName, type: mimeType } as any)
    : uriOrBlob;
}

export async function transcribeVoiceAudio(input: {
  uriOrBlob: Blob | string;
  mimeType: string;
  fileName: string;
  locale?: string;
  mode?: string;
  sessionId?: string;
  speakingSessionId?: string;
  durationMs?: number;
  fileSizeBytes?: number;
}): Promise<string | null> {
  const form = new FormData();
  form.append('file', buildFilePart(input.uriOrBlob, input.fileName, input.mimeType));
  form.append('mime_type', input.mimeType.split(';')[0]);
  form.append('locale', input.locale ?? 'fi-FI');
  form.append('mode', input.mode ?? 'speaking_practice');
  form.append('session_id', input.sessionId ?? 'voice-session');
  form.append('speaking_session_id', input.speakingSessionId ?? input.sessionId ?? 'voice-session');
  if (typeof input.durationMs === 'number' && Number.isFinite(input.durationMs)) {
    form.append('duration_ms', String(Math.max(0, Math.round(input.durationMs))));
  }
  if (typeof input.fileSizeBytes === 'number' && Number.isFinite(input.fileSizeBytes)) {
    form.append('client_file_size_bytes', String(Math.max(0, Math.round(input.fileSizeBytes))));
  }

  const headers = new Headers();
  const deviceHeaders = await getClientDeviceHeaders();
  for (const [key, value] of Object.entries(deviceHeaders)) {
    headers.set(key, value);
  }
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/voice/stt/transcriptions`, {
    method: 'POST',
    headers,
    body: form,
  });
  const json = await readVoiceJson(response);
  if (!response.ok) {
    throw new Error(extractVoiceErrorMessage(json, 'Voice transcription request failed.'));
  }
  const data = unwrapData(json) as {
    stt_available?: boolean;
    transcript?: string | null;
    text?: string | null;
    error_code?: string | null;
    error_message?: string | null;
    failure_reasons?: string[] | null;
  } | null;
  if (!data) {
    throw new Error('Voice transcription returned no payload.');
  }
  const transcript = String(data.transcript || data.text || '').trim();
  if (transcript) {
    return transcript;
  }
  // No transcript. Surface the server's specific reason so the UI can show a useful message
  // rather than the generic "No speech detected" fallback.
  if (data.error_message) {
    throw new Error(data.error_message);
  }
  if (data.error_code === 'STT_PROVIDER_AUTH_FAILED') {
    throw new Error('Transcription provider authentication failed.');
  }
  if (data.error_code === 'STT_PROVIDER_PERMISSION_FAILED') {
    throw new Error('Transcription service is not enabled for the current backend project.');
  }
  if (data.error_code === 'AUDIO_TOO_SHORT') {
    throw new Error('Recording was too short. Please hold the microphone for at least one second.');
  }
  if (data.error_code === 'SILENCE_DETECTED') {
    return null;
  }
  if (data.stt_available === false) {
    throw new Error('Voice transcription service is unavailable.');
  }
  // Configured providers returned empty → most likely genuine silence. Return null so the caller
  // can show "No speech detected" honestly.
  return null;
}

export async function getVoiceHealth(): Promise<Record<string, unknown> | null> {
  const headers = new Headers();
  const deviceHeaders = await getClientDeviceHeaders();
  for (const [key, value] of Object.entries(deviceHeaders)) {
    headers.set(key, value);
  }
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/voice/tts/health`, { headers });
    const json = await response.json().catch(() => null) as { data?: Record<string, unknown> } | Record<string, unknown> | null;
    const data = json && typeof json === 'object' && 'data' in json ? json.data : json;
    return response.ok && data ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export type VoiceTtsResponse = {
  audio: {
    url: string;
    duration_seconds: number;
    provider: string;
    replayable: boolean;
    voice_profile: string;
  };
  cache_key?: string;
  cached?: boolean;
  requested_provider?: string | null;
};

export async function createVoiceTtsRequest(payload: VoiceTtsRequest): Promise<VoiceTtsResponse> {
  const result = await requestVoiceTts(payload);
  if (!result) {
    throw new Error('VOICE_TTS_UNAVAILABLE');
  }
  return {
    audio: {
      url: result.url,
      duration_seconds: result.durationSeconds,
      provider: result.provider,
      replayable: result.replayable,
      voice_profile: result.voiceProfile,
    },
    cache_key: result.cacheKey,
    cached: result.cached,
    requested_provider: result.requestedProvider,
  };
}

