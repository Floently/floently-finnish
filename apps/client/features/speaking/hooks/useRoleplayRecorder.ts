import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { transcribeVoiceAudio } from '@core/api/voice';
import { audioSession } from '../../shared/services/audioSession';
import { uiSounds } from '../services/roleplayAudio';
import type { RecorderPhase } from '../types';

function inferNativeAudioAttempts(uri: string) {
  const lower = String(uri || '').toLowerCase();
  if (lower.endsWith('.wav')) {
    return [{ mimeType: 'audio/wav', fileName: 'roleplay.wav' }];
  }
  if (lower.endsWith('.mp4')) {
    return [
      { mimeType: 'audio/mp4', fileName: 'roleplay.mp4' },
      { mimeType: 'audio/m4a', fileName: 'roleplay.m4a' },
    ];
  }
  return [
    { mimeType: 'audio/m4a', fileName: 'roleplay.m4a' },
    { mimeType: 'audio/mp4', fileName: 'roleplay.mp4' },
  ];
}

function browserMicErrorMessage(error: unknown, details?: string): string {
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String((error as { name?: unknown }).name || '')
      : '';
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const suffix = details ? ` (${details})` : '';

  if (/NotAllowedError|PermissionDeniedError/i.test(name)) {
    return `Microphone permission was denied. Allow microphone access for this site, then try again.${suffix}`;
  }

  if (/NotFoundError|DevicesNotFoundError/i.test(name) || /requested device is not available/i.test(rawMessage)) {
    return `No available microphone was found by the browser. Check that a microphone is connected, not blocked by the browser, and not disabled in system settings.${suffix}`;
  }

  if (/NotReadableError|TrackStartError/i.test(name)) {
    return `The microphone is already in use or cannot be started. Close other apps using the microphone and try again.${suffix}`;
  }

  if (/OverconstrainedError|ConstraintNotSatisfiedError/i.test(name)) {
    return `The selected microphone settings are not supported. Trying a simpler microphone mode may help.${suffix}`;
  }

  if (/SecurityError/i.test(name)) {
    return `Microphone access requires a secure HTTPS page. Open the live HTTPS site and try again.${suffix}`;
  }

  return rawMessage
    ? `Microphone could not be started: ${rawMessage}${suffix}`
    : `Microphone could not be started.${suffix}`;
}

async function getWebMicrophoneStream(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone recording is not supported in this browser.');
  }

  let audioInputCount = 0;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    audioInputCount = devices.filter((device) => device.kind === 'audioinput').length;
  } catch {
    audioInputCount = -1;
  }

  const attempts: MediaStreamConstraints[] = [
    {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
    { audio: true },
  ];

  let lastError: unknown = null;

  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(browserMicErrorMessage(lastError, `audioInputs=${audioInputCount}`));
}


function normalizeRecorderError(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message) return 'Voice transcription failed.';
  if (/permission/i.test(message)) return message;
  if (/too short|hold the microphone|at least one second|3 seconds/i.test(message)) return 'I could not hear enough clear speech. Record at least 3 seconds, speak close to the microphone, or type your response.';
  if (/unsupported audio mime type/i.test(message)) return 'This recording format is not supported.';
  if (/authentication failed|invalid api key|provider auth/i.test(message)) return 'Transcription provider authentication failed.';
  if (/missing permissions|api enablement|permission/i.test(message)) return 'Transcription service is not enabled for the current backend project.';
  if (/transcription service is unavailable/i.test(message)) return 'Voice transcription service is unavailable.';
  if (/request failed|network/i.test(message)) return 'Voice transcription request failed.';
  return message;
}

async function transcribeRoleplayRecording(input: {
  uriOrBlob: Blob | string;
  attempts: Array<{ mimeType: string; fileName: string }>;
  locale: string;
  durationMs?: number;
    fileSizeBytes?: number;
}): Promise<string> {
  let lastError: unknown = null;
  for (const attempt of input.attempts) {
    try {
      return (await transcribeVoiceAudio({
        uriOrBlob: input.uriOrBlob,
        mimeType: attempt.mimeType,
        fileName: attempt.fileName,
        locale: input.locale,
        sessionId: 'roleplay-session',
        speakingSessionId: 'roleplay-session',
        mode: 'roleplay',
        durationMs: input.durationMs,
          fileSizeBytes: input.fileSizeBytes,
      })) ?? '';
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Voice transcription failed.');
}

const MIN_ROLEPLAY_RECORDING_MS = 3000;

const MIN_ROLEPLAY_AUDIO_BYTES = 2048;

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nativeAudioFileInfo(uri: string): Promise<{ exists: boolean; size?: number }> {
  if (Platform.OS === 'web') return { exists: true };
  try {
    const info = await FileSystem.getInfoAsync(uri);
    const record = info as { exists?: boolean; size?: number };
    return {
      exists: Boolean(record.exists),
      size: typeof record.size === 'number' ? record.size : undefined,
    };
  } catch {
    return { exists: false };
  }
}


const nativeRecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function useRoleplayRecorder(locale = 'fi-FI') {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [amplitude, setAmplitude] = useState(0);

  const nativeRecorder = useExpoAudioRecorder(nativeRecordingOptions as typeof RecordingPresets.HIGH_QUALITY, (status) => {
    if (!status || status.hasError || status.isFinished) return;
    const metering = (status as { metering?: number }).metering;
    const db = typeof metering === 'number' ? metering : -60;
    const normalized = Math.max(0, Math.min(1, (db + 50) / 50));
    setAmplitude(normalized);
  });

  const nativeRecorderState = useAudioRecorderState(nativeRecorder, 100);
  const nativeDurationMsRef = useRef(0);

  const recordingRef = useRef<typeof nativeRecorder | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const phaseRef = useRef<RecorderPhase>('idle');
  const pendingStopRef = useRef(false);
  const stopRecordingRef = useRef<() => Promise<string | null>>(async () => null);
  const amplitudePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const duration = Number(nativeRecorderState?.durationMillis ?? 0);
    if (Number.isFinite(duration) && duration > 0) {
      nativeDurationMsRef.current = duration;
      setElapsedMs(duration);
    }
  }, [nativeRecorderState?.durationMillis]);

  useEffect(() => {
    if (phase !== 'recording') {
      if (amplitudePollRef.current) {
        clearInterval(amplitudePollRef.current);
        amplitudePollRef.current = null;
      }
      setAmplitude(0);
    }
  }, [phase]);

  const setPhaseSafe = useCallback((next: RecorderPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    if (phaseRef.current === 'recording' || phaseRef.current === 'uploading') return;
    pendingStopRef.current = false;
    startedAtRef.current = Date.now();
    nativeDurationMsRef.current = 0;
    await uiSounds.micOn();

    try {
      if (Platform.OS === 'web') {
        if (typeof MediaRecorder === 'undefined') {
          throw new Error('Microphone recording is not supported in this browser.');
        }
        const stream = await getWebMicrophoneStream();
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        chunkRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunkRef.current.push(event.data);
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;

        try {
          const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioContextCtor) {
            const ctx: AudioContext = new AudioContextCtor();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            const buffer = new Uint8Array(analyser.fftSize);
            amplitudePollRef.current = setInterval(() => {
              analyser.getByteTimeDomainData(buffer);
              let sumSq = 0;
              for (let i = 0; i < buffer.length; i += 1) {
                const v = (buffer[i] - 128) / 128;
                sumSq += v * v;
              }
              const rms = Math.sqrt(sumSq / buffer.length);
              const normalized = Math.min(1, Math.pow(rms * 4, 0.7));
              setAmplitude(normalized);
            }, 80);
          }
        } catch {
          // Recording can continue without visible amplitude metering.
        }
      } else {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Microphone permission is required to record');
        }
        await audioSession.prepareForRecording();
        await nativeRecorder.prepareToRecordAsync();
        nativeRecorder.record();
        recordingRef.current = nativeRecorder;
          await pause(120);
      }
      setPhaseSafe('recording');
      if (pendingStopRef.current) {
        pendingStopRef.current = false;
        void stopRecordingRef.current();
      }
    } catch (err) {
      if (Platform.OS !== 'web') {
        await audioSession.finishRecording('VOICE_RECORDING_UNAVAILABLE');
      }
      setPhaseSafe('error');
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      await uiSounds.error();
    }
  }, [nativeRecorder, setPhaseSafe]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const currentPhase = phaseRef.current;
    if (currentPhase !== 'recording') {
      if (currentPhase === 'uploading') return null;
      if (!mediaRecorderRef.current && !recordingRef.current) {
        pendingStopRef.current = true;
        return null;
      }
    }
    pendingStopRef.current = false;
    setPhaseSafe('uploading');
    const durationMs = Date.now() - startedAtRef.current;
    setElapsedMs(durationMs);

    try {
      if (Platform.OS === 'web') {
        const recorder = mediaRecorderRef.current;
        if (!recorder) throw new Error('Recorder not ready');
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = await new Promise<Blob>((resolve, reject) => {
          recorder.onerror = () => reject(new Error('Recording failed'));
          recorder.onstop = () => resolve(new Blob(chunkRef.current, { type: mimeType }));
          recorder.stop();
          recorder.stream.getTracks().forEach((track) => track.stop());
        });
        mediaRecorderRef.current = null;
        await uiSounds.micOff();
        if (durationMs < MIN_ROLEPLAY_RECORDING_MS) {
          setPhaseSafe('idle');
          setError('Record at least 3 seconds. Speak one full sentence, then tap the mic again. You can also type your answer.');
          return null;
        }
        const apiMimeType = mimeType.split(';')[0];
        const transcript = await transcribeRoleplayRecording({
          uriOrBlob: blob,
          attempts: [{ mimeType: apiMimeType, fileName: apiMimeType.includes('mp4') ? 'roleplay.mp4' : 'roleplay.webm' }],
          locale,
          durationMs,
            fileSizeBytes: blob.size,
        });
        setPhaseSafe('idle');
        if (!transcript) {
          setError('No speech detected — try again or type your response.');
          return null;
        }
        return transcript;
      }

      const recording = recordingRef.current;
      if (!recording) throw new Error('Recorder missing');
      let uri: string | null = null;
      await audioSession.beginRecordingStop();
      try {
        await recording.stop();
        uri = recording.uri ?? null;
      } finally {
        recordingRef.current = null;
        await audioSession.finishRecording();
      }
      await uiSounds.micOff();
      if (!uri) throw new Error('No recording URI returned');

        // iOS can report a long UI duration even when the saved native file is
        // missing, tiny, or not fully finalized yet. Wait briefly, then verify
        // the actual file before sending it to STT.
        await pause(350);
        const fileInfo = await nativeAudioFileInfo(uri);
        const rawFileSizeBytes = typeof fileInfo.size === 'number' ? fileInfo.size : 0;
        const verifiedFileSizeBytes = fileInfo.exists && rawFileSizeBytes > 0 ? rawFileSizeBytes : undefined;

        if (!fileInfo.exists || rawFileSizeBytes < MIN_ROLEPLAY_AUDIO_BYTES) {
          console.warn('[roleplay-recorder] Native file metadata was not reliable; attempting STT upload anyway.', {
            exists: fileInfo.exists,
            size: rawFileSizeBytes,
            uri,
          });
        }

      const nativeDurationMs = Math.max(
        durationMs,
        nativeDurationMsRef.current,
        Math.round(Number((recording as { currentTime?: number }).currentTime ?? 0) * 1000),
      );

      if (nativeDurationMs < MIN_ROLEPLAY_RECORDING_MS) {
        setPhaseSafe('idle');
        setError(`I only captured ${(nativeDurationMs / 1000).toFixed(1)}s of speech. Record at least 3 seconds, speak one full sentence, then tap the mic again. You can also type your answer.`);
        return null;
      }

      const transcript = await transcribeRoleplayRecording({
        uriOrBlob: uri,
        attempts: inferNativeAudioAttempts(uri),
        locale,
        durationMs: nativeDurationMs,
          fileSizeBytes: verifiedFileSizeBytes,
      });

      setPhaseSafe('idle');
      if (!transcript) {
        setError('No speech detected — try again or type your response.');
        return null;
      }
      return transcript;
    } catch (error) {
      if (Platform.OS !== 'web') {
        await audioSession.finishRecording('VOICE_RECORDING_UNAVAILABLE');
      }
      recordingRef.current = null;
      setPhaseSafe('idle');
      setError(normalizeRecorderError(error));
      await uiSounds.error();
      return null;
    }
  }, [locale, setPhaseSafe]);

  stopRecordingRef.current = stopRecording;

  const cancelRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current = null;
      } else if (recordingRef.current) {
        try { await recordingRef.current.stop(); } catch {}
        recordingRef.current = null;
        await audioSession.finishRecording();
      }
    } finally {
      pendingStopRef.current = false;
      setPhaseSafe('idle');
      chunkRef.current = [];
    }
  }, [setPhaseSafe]);

  const isRecording = useMemo(() => phase === 'recording', [phase]);

  return {
    cancelRecording,
    elapsedMs,
    error,
    isRecording,
    phase,
    startRecording,
    stopRecording,
    amplitude,
  };
}
