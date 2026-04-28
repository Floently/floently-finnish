import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder as useExpoAudioRecorder } from 'expo-audio';
import { transcribeVoiceAudio } from '@core/api/voice';
import { audioSession } from '../../shared/services/audioSession';
import { uiSounds } from '../services/roleplayAudio';
import type { RecorderPhase } from '../types';

function inferNativeAudioAttempts(uri: string) {
  const lower = String(uri || '').toLowerCase();
  if (lower.endsWith('.mp4')) {
    return [
      { mimeType: 'audio/mp4', fileName: 'roleplay.mp4' },
      { mimeType: 'audio/m4a', fileName: 'roleplay.m4a' },
    ];
  }
  if (lower.endsWith('.wav')) {
    return [{ mimeType: 'audio/wav', fileName: 'roleplay.wav' }];
  }
  return [
    { mimeType: 'audio/m4a', fileName: 'roleplay.m4a' },
    { mimeType: 'audio/mp4', fileName: 'roleplay.mp4' },
  ];
}

function normalizeRecorderError(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message) return 'Voice transcription failed.';
  if (/permission/i.test(message)) return message;
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
      })) ?? '';
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Voice transcription failed.');
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

  const recordingRef = useRef<typeof nativeRecorder | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const phaseRef = useRef<RecorderPhase>('idle');
  const pendingStopRef = useRef(false);
  const stopRecordingRef = useRef<() => Promise<string | null>>(async () => null);
  const amplitudePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    await uiSounds.micOn();

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
          throw new Error('Microphone recording is not supported on this device/browser');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        if (durationMs < 700) {
          setPhaseSafe('idle');
          setError('Hold the mic a little longer, then speak clearly.');
          return null;
        }
        const apiMimeType = mimeType.split(';')[0];
        const transcript = await transcribeRoleplayRecording({
          uriOrBlob: blob,
          attempts: [{ mimeType: apiMimeType, fileName: apiMimeType.includes('mp4') ? 'roleplay.mp4' : 'roleplay.webm' }],
          locale,
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
      if (durationMs < 700) {
        setPhaseSafe('idle');
        setError('Hold the mic a little longer, then speak clearly.');
        return null;
      }

      const transcript = await transcribeRoleplayRecording({
        uriOrBlob: uri,
        attempts: inferNativeAudioAttempts(uri),
        locale,
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
