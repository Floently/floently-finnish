import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioMode,
  type AudioPlayer,
  type AudioSource,
  type AudioStatus,
} from 'expo-audio';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

type ManagedPlaybackCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onFail?: () => void;
};

export type VoiceRuntimeStatus =
  | 'idle'
  | 'preparing_playback'
  | 'playing'
  | 'preparing_recording'
  | 'recording'
  | 'stopping_recording'
  | 'interrupted'
  | 'error';

type VoiceRuntimeSnapshot = {
  canPlay: boolean;
  canRecord: boolean;
  errorCode: string | null;
  status: VoiceRuntimeStatus;
};

type VoiceRuntimeListener = (snapshot: VoiceRuntimeSnapshot) => void;
type PlaybackSubscription = { remove?: () => void } | null;

let activePlayer: AudioPlayer | null = null;
let activePlaybackSubscription: PlaybackSubscription = null;
let activePlaybackToken = 0;
let operationChain: Promise<void> = Promise.resolve();
let runtimeStatus: VoiceRuntimeStatus = 'idle';
let runtimeErrorCode: string | null = null;
const listeners = new Set<VoiceRuntimeListener>();

const playbackMode: Partial<AudioMode> = {
  allowsRecording: false,
  playsInSilentMode: true,
  interruptionModeAndroid: 'duckOthers',
  shouldRouteThroughEarpiece: false,
};

const recordingMode: Partial<AudioMode> = {
  allowsRecording: true,
  playsInSilentMode: true,
  interruptionModeAndroid: 'duckOthers',
  shouldRouteThroughEarpiece: false,
};

function snapshot(): VoiceRuntimeSnapshot {
  return {
    canPlay: runtimeStatus !== 'preparing_recording' && runtimeStatus !== 'recording' && runtimeStatus !== 'stopping_recording',
    canRecord: runtimeStatus !== 'preparing_playback' && runtimeStatus !== 'playing',
    errorCode: runtimeErrorCode,
    status: runtimeStatus,
  };
}

function publish() {
  const next = snapshot();
  for (const listener of listeners) {
    listener(next);
  }
}

function setRuntimeStatus(status: VoiceRuntimeStatus, errorCode: string | null = runtimeErrorCode) {
  runtimeStatus = status;
  runtimeErrorCode = errorCode;
  publish();
}

function queueExclusive<T>(work: () => Promise<T>): Promise<T> {
  const run = operationChain.then(work, work);
  operationChain = run.then(() => undefined, () => undefined);
  return run;
}

async function applyAudioMode(mode: Partial<AudioMode>) {
  if (Platform.OS === 'web') return;
  await setAudioModeAsync(mode);
}

function clearPlaybackSubscription() {
  try { activePlaybackSubscription?.remove?.(); } catch {}
  activePlaybackSubscription = null;
}

function releasePlayer(player: AudioPlayer | null) {
  if (!player) return;
  try { player.pause(); } catch {}
  try { player.remove(); } catch {}
}

function releaseActivePlayer() {
  clearPlaybackSubscription();
  const player = activePlayer;
  activePlayer = null;
  releasePlayer(player);
}

function normalizeAudioSource(source: AudioSource | number | { uri: string }): AudioSource {
  if (typeof source === 'number') return source as AudioSource;
  return source as AudioSource;
}

export const audioSession = {
  subscribe(listener: VoiceRuntimeListener) {
    listeners.add(listener);
    listener(snapshot());
    return () => listeners.delete(listener);
  },

  getSnapshot() {
    return snapshot();
  },

  async prepareForRecording() {
    await queueExclusive(async () => {
      setRuntimeStatus('preparing_recording', null);
      activePlaybackToken += 1;
      releaseActivePlayer();
      await applyAudioMode(recordingMode);
      setRuntimeStatus('recording', null);
    });
  },

  async beginRecordingStop() {
    await queueExclusive(async () => {
      setRuntimeStatus('stopping_recording', null);
    });
  },

  async finishRecording(errorCode: string | null = null) {
    await queueExclusive(async () => {
      await applyAudioMode(playbackMode);
      setRuntimeStatus('idle', errorCode);
    });
  },

  async stopManagedPlayback() {
    await queueExclusive(async () => {
      activePlaybackToken += 1;
      releaseActivePlayer();
      await applyAudioMode(playbackMode);
      setRuntimeStatus('idle', null);
    });
  },

  async releaseAll(reason: 'background' | 'manual' = 'manual') {
    await queueExclusive(async () => {
      activePlaybackToken += 1;
      releaseActivePlayer();
      await applyAudioMode(playbackMode);
      setRuntimeStatus(reason === 'background' ? 'interrupted' : 'idle', reason === 'background' ? 'VOICE_INTERRUPTED' : null);
    });
  },

  async playManaged(source: AudioSource | number | { uri: string }, callbacks?: ManagedPlaybackCallbacks) {
    return queueExclusive(async () => {
      setRuntimeStatus('preparing_playback', null);
      activePlaybackToken += 1;
      const token = activePlaybackToken;
      releaseActivePlayer();
      await applyAudioMode(playbackMode);

      let player: AudioPlayer | null = null;

      try {
        player = createAudioPlayer(normalizeAudioSource(source), { updateInterval: 150 });
        activePlayer = player;
        activePlaybackSubscription = (player as unknown as { addListener: (event: 'playbackStatusUpdate', listener: (status: AudioStatus) => void) => { remove: () => void } }).addListener('playbackStatusUpdate', (status: AudioStatus) => {
          if (token !== activePlaybackToken) return;
          if (!status.didJustFinish) return;
          callbacks?.onEnd?.();
          void queueExclusive(async () => {
            if (activePlayer === player) {
              releaseActivePlayer();
            } else {
              releasePlayer(player);
            }
            await applyAudioMode(playbackMode);
            setRuntimeStatus('idle', null);
          });
        });
        callbacks?.onStart?.();
        player.play();
        setRuntimeStatus('playing', null);
        return true;
      } catch {
        if (activePlayer === player) activePlayer = null;
        callbacks?.onFail?.();
        releasePlayer(player);
        clearPlaybackSubscription();
        await applyAudioMode(playbackMode);
        setRuntimeStatus('error', 'VOICE_PLAYBACK_UNAVAILABLE');
        setRuntimeStatus('idle', 'VOICE_PLAYBACK_UNAVAILABLE');
        return false;
      }
    });
  },

  async playTransientAsset(moduleId: number) {
    if (runtimeStatus === 'preparing_recording' || runtimeStatus === 'recording' || runtimeStatus === 'stopping_recording') {
      return;
    }
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return;
    await applyAudioMode(playbackMode);
    let player: AudioPlayer | null = null;
    let subscription: PlaybackSubscription = null;
    try {
      player = createAudioPlayer({ uri }, { updateInterval: 150 });
      subscription = (player as unknown as { addListener: (event: 'playbackStatusUpdate', listener: (status: AudioStatus) => void) => { remove: () => void } }).addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (!status.didJustFinish) return;
        try { subscription?.remove?.(); } catch {}
        releasePlayer(player);
      });
      player.play();
    } catch {
      try { subscription?.remove?.(); } catch {}
      releasePlayer(player);
    }
  },
};
