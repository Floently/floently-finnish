import { useCallback, useState } from 'react';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder as useExpoAudioRecorder } from 'expo-audio';
import { audioSession } from '../../shared/services/audioSession';

export function useAudioRecorder() {
  const nativeRecorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState<typeof nativeRecorder | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission is required to record');
      }
      await audioSession.prepareForRecording();
      await nativeRecorder.prepareToRecordAsync();
      nativeRecorder.record();
      setRecording(nativeRecorder);
    } catch {
      await audioSession.finishRecording('VOICE_RECORDING_UNAVAILABLE');
      throw new Error('VOICE_RECORDING_UNAVAILABLE');
    }
  }, [nativeRecorder]);

  const stop = useCallback(async () => {
    if (!recording) return null;
    await audioSession.beginRecordingStop();
    try {
      await recording.stop();
      const nextUri = recording.uri ?? null;
      setUri(nextUri);
      return nextUri;
    } finally {
      setRecording(null);
      await audioSession.finishRecording();
    }
  }, [recording]);

  return { recording, uri, start, stop };
}
