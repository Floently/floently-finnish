import { requestVoiceTts } from '@core/api/voice';
import { audioSession } from '../../shared/services/audioSession';

const tapSound = require('../../../components/public/sounds/ui/tap_soft.wav');
const micOnSound = require('../../../components/public/sounds/ui/mic_on.wav');
const micStartSafeSound = require('../../../components/public/sounds/ui/mic_start_safe.wav');
const micOffSound = require('../../../components/public/sounds/ui/mic_off.wav');
const errorSound = require('../../../components/public/sounds/ui/error.wav');
const successSound = require('../../../components/public/sounds/ui/success_chime.wav');

export const uiSounds = {
  tap: () => audioSession.playTransientAsset(tapSound),
  micOn: () => audioSession.playTransientAsset(micOnSound),
  micOnBeforeRecording: () =>
    audioSession.playRecordingStartCue(
      micStartSafeSound,
      900,
    ),
  micOff: () => audioSession.playTransientAsset(micOffSound),
  error: () => audioSession.playTransientAsset(errorSound),
  success: () => audioSession.playTransientAsset(successSound),
};

export async function stopRoleplayAudioPlayback() {
  await audioSession.stopManagedPlayback();
}

function voicePreferenceForProfile(voiceProfile?: string): 'male' | 'female' | undefined {
  const normalized = String(voiceProfile ?? '').toLowerCase();

  // Important: check female before male because "female" contains "male".
  if (
    normalized.includes('female') ||
    normalized.includes('standard_female') ||
    normalized.includes('-f-') ||
    normalized.includes('_f_')
  ) {
    return 'female';
  }

  if (
    normalized.includes('male') ||
    normalized.includes('standard_male') ||
    normalized.includes('-m-') ||
    normalized.includes('_m_')
  ) {
    return 'male';
  }

  return undefined;
}

export async function primeRoleplayAudioPlayback() {
  const sessionWithPrime = audioSession as typeof audioSession & {
    primeWebPlayback?: () => Promise<boolean> | boolean;
  };

  if (typeof sessionWithPrime.primeWebPlayback !== 'function') {
    return true;
  }

  return sessionWithPrime.primeWebPlayback();
}

export async function speakRoleplayText(args: {
  text: string;
  voiceProfile?: string;
  speed?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onUnavailable?: () => void;
}) {
  try {
    const audio = await requestVoiceTts({
      text: args.text,
      mode: 'roleplay',
      voiceProfile: args.voiceProfile,
      voicePreference: voicePreferenceForProfile(args.voiceProfile),
      replayable: true,
      speed: args.speed,
    });

    if (!audio?.url) {
      args.onUnavailable?.();
      return false;
    }

    const source = { uri: audio.url };

    // Backend TTS exists here. If playback fails after this point, it is a
    // browser playback/autoplay issue, not a missing TTS issue.
    for (const delayMs of [0, 180, 420, 800]) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const played = await audioSession.playManaged(source, {
        onStart: args.onStart,
        onEnd: args.onFinish,
        onFail: undefined,
      });

      if (played) {
        return true;
      }
    }

    return false;
  } catch {
    args.onUnavailable?.();
    return false;
  }
}
