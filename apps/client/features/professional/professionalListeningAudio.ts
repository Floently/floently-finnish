import { requestVoiceTts } from '@core/api/voice';

import { audioSession } from '../shared/services/audioSession';

type ProfessionalListeningAudioCallbacks = {
  onStart?: () => void;
  onFinish?: () => void;
  onUnavailable?: () => void;
};

export async function primeProfessionalListeningAudio() {
  const sessionWithPrime = audioSession as typeof audioSession & {
    primeWebPlayback?: () => Promise<boolean> | boolean;
  };
  if (typeof sessionWithPrime.primeWebPlayback !== 'function') return true;
  return sessionWithPrime.primeWebPlayback();
}

export async function stopProfessionalListeningAudio() {
  await audioSession.stopManagedPlayback();
}

export async function playProfessionalListeningText(
  text: string,
  callbacks?: ProfessionalListeningAudioCallbacks,
): Promise<boolean> {
  try {
    const audio = await requestVoiceTts({
      text,
      mode: 'speaking_practice',
      voicePreference: 'female',
      replayable: true,
      speed: 0.92,
    });

    if (!audio?.url) {
      callbacks?.onUnavailable?.();
      return false;
    }

    const started = await audioSession.playManaged(
      { uri: audio.url },
      {
        onStart: callbacks?.onStart,
        onEnd: callbacks?.onFinish,
        onFail: callbacks?.onUnavailable,
      },
    );

    if (!started) {
      callbacks?.onUnavailable?.();
      return false;
    }

    return true;
  } catch {
    callbacks?.onUnavailable?.();
    return false;
  }
}
