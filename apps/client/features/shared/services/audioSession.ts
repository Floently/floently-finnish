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

function webAudioDebug(event: string, details?: Record<string, unknown>) {
  if (Platform.OS !== 'web') return;
  try {
    const target = globalThis as typeof globalThis & {
      __floentlyAudioDebug?: Array<Record<string, unknown>>;
      console?: Console;
    };
    const entry = {
      at: new Date().toISOString(),
      event,
      ...(details ?? {}),
    };
    target.__floentlyAudioDebug = [...(target.__floentlyAudioDebug ?? []), entry].slice(-80);
    target.console?.log?.('[FloentlyAudio]', entry);
  } catch {
    // Debug logging must never break playback.
  }
}


let activePlayer: AudioPlayer | null = null;
let activeWebAudio: HTMLAudioElement | null = null;
let activeWebAudioContext: AudioContext | null = null;
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

function releaseWebAudio() {
  const audio = activeWebAudio;
  if (!audio) return;

  try { audio.pause(); } catch {}

  // Important for iOS WebKit: keep the user-gesture-unlocked audio element alive.
  // If we remove/null it after the first AI reply, the second reply is played by a
  // fresh element created outside the tap gesture and iPhone browsers can block it.
  if (Platform.OS === 'web') {
    try { audio.currentTime = 0; } catch {}
    webAudioDebug('web.keepUnlockedAudioElement');
    return;
  }

  activeWebAudio = null;
  try { audio.removeAttribute('src'); } catch {}
  try { audio.load(); } catch {}
}

function releaseActivePlayer() {
  clearPlaybackSubscription();
  releaseWebAudio();
  const player = activePlayer;
  activePlayer = null;
  releasePlayer(player);
}

function normalizeAudioSource(source: AudioSource | number | { uri: string }): AudioSource {
  if (typeof source === 'number') return source as AudioSource;
  return source as AudioSource;
}

function webUriFromSource(source: AudioSource | number | { uri: string }): string | null {
  if (typeof source === 'object' && source !== null && 'uri' in source) {
    const uri = String((source as { uri?: unknown }).uri ?? '').trim();
    return uri || null;
  }
  return null;
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

    async primeWebPlayback() {
      if (Platform.OS !== 'web') return true;

      try {
        const win = globalThis as typeof globalThis & {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        };

        const AudioContextCtor = win.AudioContext ?? win.webkitAudioContext;
        if (AudioContextCtor) {
          activeWebAudioContext = activeWebAudioContext ?? new AudioContextCtor();
          if (activeWebAudioContext.state !== 'running') {
            await activeWebAudioContext.resume();
          }

          const oscillator = activeWebAudioContext.createOscillator();
          const gain = activeWebAudioContext.createGain();
          gain.gain.value = 0.00001;
          oscillator.connect(gain);
          gain.connect(activeWebAudioContext.destination);
          oscillator.start();
          oscillator.stop(activeWebAudioContext.currentTime + 0.01);
        }

        const audio = activeWebAudio ?? new Audio();
        activeWebAudio = audio;
        audio.preload = 'auto';
        audio.volume = 0.00001;
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
        }

        audio.pause();
        try { audio.currentTime = 0; } catch {}
        audio.volume = 1;
        webAudioDebug('web.primeResolved');
        return true;
      } catch (error) {
        webAudioDebug('web.primeRejected', {
          name: error instanceof Error ? error.name : null,
          message: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    },
  async playManaged(source: AudioSource | number | { uri: string }, callbacks?: ManagedPlaybackCallbacks) {

    if (Platform.OS === 'web') {
      const webUri = webUriFromSource(source);
      webAudioDebug('playManaged.web.enter', { hasUri: Boolean(webUri), uri: webUri });

      if (webUri) {
        return queueExclusive(async () => {
          setRuntimeStatus('preparing_playback', null);
          activePlaybackToken += 1;
          const token = activePlaybackToken;

          try {
            // Keep one persistent HTMLAudioElement for Safari/iOS browser reliability.
            const audio = activeWebAudio ?? new Audio();
            activeWebAudio = audio;

            audio.pause();
            audio.onended = null;
            audio.onerror = null;

            audio.preload = 'auto';
            audio.volume = 1;
            audio.src = webUri;

            audio.onloadedmetadata = () => {
              webAudioDebug('web.loadedmetadata', {
                token,
                duration: Number.isFinite(audio.duration) ? audio.duration : null,
                src: audio.currentSrc || audio.src,
              });
            };

            audio.onplaying = () => {
              webAudioDebug('web.playing', {
                token,
                currentTime: audio.currentTime,
                src: audio.currentSrc || audio.src,
              });
            };

            audio.onended = () => {
              if (token !== activePlaybackToken) return;
              webAudioDebug('web.ended', { token });
              callbacks?.onEnd?.();
              void queueExclusive(async () => {
                setRuntimeStatus('idle', null);
              });
            };

            audio.onerror = () => {
              if (token !== activePlaybackToken) return;
              webAudioDebug('web.error', {
                token,
                code: audio.error?.code ?? null,
                message: audio.error?.message ?? null,
                src: audio.currentSrc || audio.src,
              });
              callbacks?.onFail?.();
              void queueExclusive(async () => {
                setRuntimeStatus('error', 'VOICE_PLAYBACK_UNAVAILABLE');
                setRuntimeStatus('idle', 'VOICE_PLAYBACK_UNAVAILABLE');
              });
            };

            callbacks?.onStart?.();
            webAudioDebug('web.beforePlay', { token, src: audio.src });

            const playPromise = audio.play();
            if (playPromise && typeof playPromise.then === 'function') {
              await playPromise;
            }

            webAudioDebug('web.playResolved', { token, paused: audio.paused, currentTime: audio.currentTime });
            setRuntimeStatus('playing', null);
            return true;
          } catch (error) {
            webAudioDebug('web.playRejected', {
              token,
              name: error instanceof Error ? error.name : null,
              message: error instanceof Error ? error.message : String(error),
            });
            callbacks?.onFail?.();
            setRuntimeStatus('error', 'VOICE_PLAYBACK_UNAVAILABLE');
            setRuntimeStatus('idle', 'VOICE_PLAYBACK_UNAVAILABLE');
            return false;
          }
        });
      }
    }



      return queueExclusive(async () => {
        setRuntimeStatus('preparing_playback', null);
        activePlaybackToken += 1;
        const token = activePlaybackToken;

        clearPlaybackSubscription();
        const normalizedSource = normalizeAudioSource(source);

        try {
          await applyAudioMode(playbackMode);

          const player = createAudioPlayer(normalizedSource, {
            updateInterval: 250,
          });

          activePlayer = player;

          const subscription = (
            player as unknown as {
              addListener: (
                event: 'playbackStatusUpdate',
                listener: (status: AudioStatus) => void,
              ) => { remove: () => void };
            }
          ).addListener('playbackStatusUpdate', (status: AudioStatus) => {
            if (token !== activePlaybackToken) return;

            if (status.didJustFinish) {
              callbacks?.onEnd?.();
              void queueExclusive(async () => {
                releaseActivePlayer();
                setRuntimeStatus('idle', null);
              });
            }
          });

          activePlaybackSubscription = subscription;

          callbacks?.onStart?.();
          player.play();
          setRuntimeStatus('playing', null);

          return true;
        } catch {
          callbacks?.onFail?.();

          releaseActivePlayer();
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
