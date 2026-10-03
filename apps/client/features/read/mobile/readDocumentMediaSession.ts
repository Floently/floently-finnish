import { Platform } from 'react-native';

type LockScreenMetadata = {
  title: string;
  artist?: string;
  albumTitle?: string;
  artworkUrl?: string;
};

type Subscription = { remove(): void };

type PatchedReadAudioPlayer = {
  setActiveForLockScreen(
    active: boolean,
    metadata?: LockScreenMetadata,
    options?: { showSeekForward?: boolean; showSeekBackward?: boolean },
  ): void;
  clearLockScreenControls(): void;
  addListener?: (
    eventName: string,
    listener: (event: { positionSeconds?: number }) => void,
  ) => Subscription;
  setLogicalLockScreenTimeline?: (
    duration: number,
    elapsed: number,
    playbackSpeed: number,
  ) => void;
  clearLogicalLockScreenTimeline?: () => void;
};

export type ReadDocumentMediaSessionInput = {
  durationSeconds: number;
  elapsedSeconds: number;
  playbackSpeed: number;
  metadata: LockScreenMetadata;
};

function patchedPlayer(player: unknown): PatchedReadAudioPlayer {
  return player as PatchedReadAudioPlayer;
}

function boundedTimeline(input: ReadDocumentMediaSessionInput) {
  const duration = Math.max(
    0.1,
    Number.isFinite(input.durationSeconds) ? input.durationSeconds : 0.1,
  );
  const elapsed = Math.max(
    0,
    Math.min(
      duration,
      Number.isFinite(input.elapsedSeconds) ? input.elapsedSeconds : 0,
    ),
  );
  const speed = Math.max(
    0.1,
    Math.min(
      2,
      Number.isFinite(input.playbackSpeed) ? input.playbackSpeed : 1,
    ),
  );

  return { duration, elapsed, speed };
}

/**
 * Activates one logical Read document as the operating-system media item.
 *
 * On iOS runtime 1.0.5+, the config-plugin-patched expo-audio player publishes
 * the whole document duration/elapsed position while AVPlayer continues to
 * consume hidden TTS segments. Android retains expo-audio's native lock-screen
 * controls; its platform media-session implementation can evolve separately.
 */
export function activateReadDocumentMediaSession(
  player: unknown,
  input: ReadDocumentMediaSessionInput,
) {
  const nativePlayer = patchedPlayer(player);
  const timeline = boundedTimeline(input);

  // Establish the virtual timeline before activating Now Playing so iOS never
  // briefly advertises the duration of the current hidden physical segment.
  if (
    Platform.OS === 'ios' &&
    typeof nativePlayer.setLogicalLockScreenTimeline === 'function'
  ) {
    nativePlayer.setLogicalLockScreenTimeline(
      timeline.duration,
      timeline.elapsed,
      timeline.speed,
    );
  }

  nativePlayer.setActiveForLockScreen(
    true,
    input.metadata,
    {
      showSeekBackward: true,
      showSeekForward: true,
    },
  );
}

/**
 * Re-anchors the logical media timeline after an in-clip seek or speed change
 * without reinstalling OS remote-command handlers.
 */
export function syncReadDocumentMediaTimeline(
  player: unknown,
  input: Omit<ReadDocumentMediaSessionInput, 'metadata'>,
) {
  if (Platform.OS !== 'ios') return;
  const nativePlayer = patchedPlayer(player);
  if (typeof nativePlayer.setLogicalLockScreenTimeline !== 'function') return;

  const timeline = boundedTimeline({
    ...input,
    metadata: { title: '' },
  });
  nativePlayer.setLogicalLockScreenTimeline(
    timeline.duration,
    timeline.elapsed,
    timeline.speed,
  );
}

export function clearReadDocumentMediaSession(player: unknown) {
  const nativePlayer = patchedPlayer(player);

  // Clear Now Playing first. Clearing only the virtual timeline while the
  // player is still active would briefly expose the hidden physical clip's
  // short duration on the lock screen — the exact leak NR-16 forbids.
  try {
    nativePlayer.clearLockScreenControls();
  } catch {}

  // Current runtime 1.0.5 clears the logical timeline inside
  // clearLockScreenControls(). Keep this best-effort call for safety and for
  // any future platform implementation that separates those responsibilities.
  try {
    nativePlayer.clearLogicalLockScreenTimeline?.();
  } catch {}
}

/**
 * Maps iOS lock-screen scrubbing / ±10 second commands back to Floently's
 * logical document timeline. Older runtime binaries simply never emit this
 * event, so the subscription is safe while runtime 1.0.5 is staged.
 */
export function subscribeReadDocumentMediaSeek(
  player: unknown,
  onSeekToSeconds: (positionSeconds: number) => void,
): Subscription {
  if (Platform.OS !== 'ios') return { remove() {} };

  const nativePlayer = patchedPlayer(player);
  if (typeof nativePlayer.addListener !== 'function') {
    return { remove() {} };
  }

  try {
    return nativePlayer.addListener('logicalSeekRequested', (event) => {
      const position = Number(event?.positionSeconds);
      if (!Number.isFinite(position)) return;
      onSeekToSeconds(Math.max(0, position));
    });
  } catch {
    // Old installed binaries do not have the patched native event. They remain
    // runnable, but runtime 1.0.5 is required before the new media-session
    // contract is considered release-qualified.
    return { remove() {} };
  }
}
