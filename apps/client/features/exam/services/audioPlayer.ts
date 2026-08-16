import { requestVoiceTts } from '@core/api/voice';
import { resolveApiUrl } from '@core/api/apiConfig';
import { audioSession } from '../../shared/services/audioSession';

type PlaybackCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onFail?: () => void;
};

type YkiDialogueTurn = {
  speakerId: 'speaker_a' | 'speaker_b';
  voicePreference: 'female' | 'male';
  voiceProfile: 'yki_standard_female' | 'yki_standard_male';
  text: string;
};

let playbackSequence = 0;
let cancelActiveSegmentWait: (() => void) | null = null;

function stripDialogueMarker(line: string): string {
  return line.replace(/^[\s]*[—–-][\s]*/, '').trim();
}

/**
 * Compatibility parser for the current YKI practice bank.
 *
 * Existing multi-speaker tasks are stored as one `audio_script` string where
 * each speaker turn starts on a new line with an em dash. Until the backend
 * task contract gains explicit speaker objects, turn parity is a stable
 * two-speaker contract: A speaks turns 1/3/5..., B speaks 2/4/6....
 *
 * Single-speaker narration returns null and keeps the normal narrator path.
 */
export function parseYkiDialogueTurns(text: string): YkiDialogueTurn[] | null {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !lines.every((line) => /^[—–-]\s*/.test(line))) {
    return null;
  }

  const turns = lines
    .map(stripDialogueMarker)
    .filter(Boolean)
    .map<YkiDialogueTurn>((turnText, index) => {
      const speakerA = index % 2 === 0;
      return {
        speakerId: speakerA ? 'speaker_a' : 'speaker_b',
        voicePreference: speakerA ? 'female' : 'male',
        voiceProfile: speakerA ? 'yki_standard_female' : 'yki_standard_male',
        text: turnText,
      };
    });

  return turns.length >= 2 ? turns : null;
}

async function synthesizeYkiSegment(turn: YkiDialogueTurn) {
  return requestVoiceTts({
    text: turn.text,
    mode: 'yki',
    voicePreference: turn.voicePreference,
    voiceProfile: turn.voiceProfile,
    replayable: true,
    speed: 0.9,
  });
}

async function synthesizeYkiNarration(text: string) {
  return requestVoiceTts({
    text,
    mode: 'yki',
    voicePreference: 'female',
    voiceProfile: 'yki_standard_female',
    replayable: true,
    speed: 0.9,
  });
}

async function playManagedUntilEnd(
  uri: string,
  onStart?: () => void,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;

    const finish = (completed: boolean) => {
      if (settled) return;
      settled = true;
      if (cancelActiveSegmentWait === cancel) {
        cancelActiveSegmentWait = null;
      }
      resolve(completed);
    };

    const cancel = () => finish(false);
    cancelActiveSegmentWait = cancel;

    void audioSession
      .playManaged(
        { uri: resolveApiUrl(uri) },
        {
          onStart,
          onEnd: () => finish(true),
          onFail: () => finish(false),
        },
      )
      .then((started) => {
        if (!started) finish(false);
      })
      .catch(() => finish(false));
  });
}

async function playYkiDialogueSequence(
  turns: YkiDialogueTurn[],
  callbacks: PlaybackCallbacks | undefined,
  sequenceId: number,
): Promise<void> {
  // Generate all speaker segments before playback. This avoids a network/TTS
  // pause between every conversational turn while retaining ordered playback.
  const generated = await Promise.all(turns.map(synthesizeYkiSegment));

  if (sequenceId !== playbackSequence) return;
  if (generated.some((item) => !item?.url)) {
    callbacks?.onFail?.();
    return;
  }

  for (let index = 0; index < generated.length; index += 1) {
    if (sequenceId !== playbackSequence) return;
    const audio = generated[index];
    if (!audio?.url) {
      callbacks?.onFail?.();
      return;
    }

    const played = await playManagedUntilEnd(
      audio.url,
      index === 0 ? callbacks?.onStart : undefined,
    );

    if (!played) {
      if (sequenceId === playbackSequence) callbacks?.onFail?.();
      return;
    }

    if (index < generated.length - 1) {
      // A short turn boundary sounds natural while remaining clearly one task.
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
  }

  if (sequenceId === playbackSequence) callbacks?.onEnd?.();
}

export const audioPlayer = {
  async playAsync(
    uri: string,
    callbacks?: PlaybackCallbacks,
  ) {
    const resolvedUri = resolveApiUrl(uri);
    const started = await audioSession.playManaged({ uri: resolvedUri }, callbacks);
    if (!started) {
      throw new Error('AUDIO_PLAYBACK_UNAVAILABLE');
    }
  },

  /**
   * Generate YKI listening audio via the backend and play it.
   *
   * Multi-speaker dash-formatted scripts use stable alternating female/male
   * voices. Single-speaker scripts retain one narrator. The original text is
   * not modified, so answer keys and transcript reveal behavior are unchanged.
   */
  async playTextAsync(
    text: string,
    callbacks?: PlaybackCallbacks,
  ): Promise<void> {
    const sequenceId = ++playbackSequence;
    cancelActiveSegmentWait?.();
    cancelActiveSegmentWait = null;

    try {
      const dialogueTurns = parseYkiDialogueTurns(text);
      if (dialogueTurns) {
        await playYkiDialogueSequence(dialogueTurns, callbacks, sequenceId);
        return;
      }

      const tts = await synthesizeYkiNarration(text);
      if (!tts?.url || sequenceId !== playbackSequence) {
        if (sequenceId === playbackSequence) callbacks?.onFail?.();
        return;
      }

      const played = await playManagedUntilEnd(
        tts.url,
        callbacks?.onStart,
      );

      if (!played) {
        if (sequenceId === playbackSequence) callbacks?.onFail?.();
        return;
      }

      if (sequenceId === playbackSequence) callbacks?.onEnd?.();
    } catch {
      if (sequenceId === playbackSequence) callbacks?.onFail?.();
    }
  },

  async stopAsync() {
    playbackSequence += 1;
    cancelActiveSegmentWait?.();
    cancelActiveSegmentWait = null;
    await audioSession.stopManagedPlayback();
  },
};
