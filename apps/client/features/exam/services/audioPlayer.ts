import { requestVoiceTts } from '@core/api/voice';
import { resolveApiUrl } from '@core/api/apiConfig';
import { audioSession } from '../../shared/services/audioSession';

export const audioPlayer = {
  async playAsync(
    uri: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onFail?: () => void;
    },
  ) {
    const resolvedUri = resolveApiUrl(uri);
    const started = await audioSession.playManaged({ uri: resolvedUri }, callbacks);
    if (!started) {
      throw new Error('AUDIO_PLAYBACK_UNAVAILABLE');
    }
  },

  /**
   * Generate TTS audio for `text` via the backend and play it.
   * Optional callbacks mirror the lifecycle of the playback.
   */
  async playTextAsync(
    text: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onFail?: () => void;
    },
  ): Promise<void> {
    try {
      const tts = await requestVoiceTts({
        text,
        mode: 'cards',
        voicePreference: 'female',
        replayable: true,
        speed: 0.9,
      });
      if (!tts?.url) {
        callbacks?.onFail?.();
        return;
      }
      const resolvedUrl = resolveApiUrl(tts.url);
      const started = await audioSession.playManaged({ uri: resolvedUrl }, {
        onStart: callbacks?.onStart,
        onEnd: callbacks?.onEnd,
        onFail: callbacks?.onFail,
      });
      if (!started) return;
    } catch {
      callbacks?.onFail?.();
    }
  },

  async stopAsync() {
    await audioSession.stopManagedPlayback();
  },
};
