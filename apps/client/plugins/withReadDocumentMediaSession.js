const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const SUPPORTED_EXPO_AUDIO_VERSION = '55.0.14';
const PATCH_MARKER = 'FLOENTLY_LOGICAL_NOW_PLAYING_V1';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(
      `Floently Read media-session patch could not find ${label}. ` +
      `expo-audio ${SUPPORTED_EXPO_AUDIO_VERSION} source may have changed.`
    );
  }
  return source.replace(needle, replacement);
}

function patchAudioPlayerSwift(source) {
  if (source.includes(PATCH_MARKER)) return source;

  let next = source;

  next = replaceRequired(
    next,
    `private enum AudioConstants {
  static let playbackStatus = "playbackStatusUpdate"
  static let audioSample = "audioSampleUpdate"
}

public class AudioPlayer: SharedRef<AVPlayer> {`,
    `private enum AudioConstants {
  static let playbackStatus = "playbackStatusUpdate"
  static let audioSample = "audioSampleUpdate"
  static let logicalSeekRequested = "logicalSeekRequested"
}

// ${PATCH_MARKER}
// The physical AVPlayer item is only a hidden narration segment. This state
// anchors that segment inside Floently's complete logical document timeline.
struct LogicalLockScreenTimeline {
  let duration: Double
  let elapsedAtAnchor: Double
  let mediaTimeAtAnchor: Double
  let playbackSpeed: Double
}

public class AudioPlayer: SharedRef<AVPlayer> {`,
    'AudioPlayer constants'
  );

  next = replaceRequired(
    next,
    `  var currentRate: Float = 0.0
  let interval: Double`,
    `  var currentRate: Float = 0.0
  var logicalLockScreenTimeline: LogicalLockScreenTimeline?
  let interval: Double`,
    'AudioPlayer state'
  );

  next = replaceRequired(
    next,
    `  var currentTime: Double {
    let seconds = ref.currentItem?.currentTime().seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }

  init(_ ref: AVPlayer, interval: Double, source: AudioSource? = nil) {`,
    `  var currentTime: Double {
    let seconds = ref.currentItem?.currentTime().seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }

  func setLogicalLockScreenTimeline(duration: Double, elapsed: Double, playbackSpeed: Double) {
    let safeDuration = max(0.1, duration)
    let safeElapsed = min(max(0.0, elapsed), safeDuration)
    let safeSpeed = max(0.1, playbackSpeed)

    logicalLockScreenTimeline = LogicalLockScreenTimeline(
      duration: safeDuration,
      elapsedAtAnchor: safeElapsed,
      mediaTimeAtAnchor: currentTime,
      playbackSpeed: safeSpeed
    )

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func clearLogicalLockScreenTimeline() {
    logicalLockScreenTimeline = nil
    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func logicalNowPlayingValues() -> (duration: Double, elapsed: Double, playbackRate: Double)? {
    guard let timeline = logicalLockScreenTimeline else {
      return nil
    }

    // AVPlayer.currentTime is source-media time. At 2x it advances two media
    // seconds per wall-clock second, while Floently's document duration is
    // already speed-normalized. Convert the media delta back to listening time.
    let mediaDelta = currentTime - timeline.mediaTimeAtAnchor
    let elapsed = min(
      max(0.0, timeline.elapsedAtAnchor + mediaDelta / timeline.playbackSpeed),
      timeline.duration
    )

    return (
      duration: timeline.duration,
      elapsed: elapsed,
      playbackRate: isPlaying ? 1.0 : 0.0
    )
  }

  func requestLogicalSeek(to positionSeconds: Double) {
    guard let timeline = logicalLockScreenTimeline else {
      return
    }
    let position = min(max(0.0, positionSeconds), timeline.duration)
    self.emit(
      event: AudioConstants.logicalSeekRequested,
      arguments: ["positionSeconds": position]
    )
  }

  init(_ ref: AVPlayer, interval: Double, source: AudioSource? = nil) {`,
    'AudioPlayer logical timeline methods'
  );

  return next;
}

function patchAudioModuleSwift(source) {
  if (source.includes(PATCH_MARKER)) return source;

  let next = source;

  next = replaceRequired(
    next,
    `      Function("clearLockScreenControls") { (player: AudioPlayer) in
        if player.isActiveForLockScreen {
          player.metadata = nil
          player.isActiveForLockScreen = false
          MediaController.shared.setActivePlayer(nil)
        }
      }

      AsyncFunction("seekTo") {`,
    `      Function("clearLockScreenControls") { (player: AudioPlayer) in
        if player.isActiveForLockScreen {
          player.metadata = nil
          player.isActiveForLockScreen = false
          MediaController.shared.setActivePlayer(nil)
        }
        player.clearLogicalLockScreenTimeline()
      }

      // ${PATCH_MARKER}
      // Expose a complete-document virtual Now Playing timeline while AVPlayer
      // continues to consume bounded hidden TTS segments.
      Function("setLogicalLockScreenTimeline") {
        (player: AudioPlayer, duration: Double, elapsed: Double, playbackSpeed: Double) in
        player.setLogicalLockScreenTimeline(
          duration: duration,
          elapsed: elapsed,
          playbackSpeed: playbackSpeed
        )
      }

      Function("clearLogicalLockScreenTimeline") { (player: AudioPlayer) in
        player.clearLogicalLockScreenTimeline()
      }

      AsyncFunction("seekTo") {`,
    'AudioModule lock-screen methods'
  );

  next = replaceRequired(
    next,
    `      Function("pause") { player in
        player.ref.pause()
        if !player.keepAudioSessionActive {
          deactivateSession()
        }
      }`,
    `      Function("pause") { player in
        player.ref.pause()
        if player.isActiveForLockScreen {
          MediaController.shared.updateNowPlayingInfo(for: player)
        }
        if !player.keepAudioSessionActive {
          deactivateSession()
        }
      }`,
    'AudioModule pause function'
  );

  return next;
}

function patchMediaControllerSwift(source) {
  if (source.includes(PATCH_MARKER)) return source;

  let next = source;

  next = replaceRequired(
    next,
    `    nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = player.duration
    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player.currentTime
    nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player.isPlaying ? player.ref.rate : 1.0
    nowPlayingInfo[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue`,
    `    // ${PATCH_MARKER}
    // When Floently supplies a logical document timeline, never leak the
    // duration/currentTime of the hidden physical TTS segment to iOS.
    if let logical = player.logicalNowPlayingValues() {
      nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = logical.duration
      nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = logical.elapsed
      nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = logical.playbackRate
      nowPlayingInfo[MPNowPlayingInfoPropertyDefaultPlaybackRate] = 1.0
    } else {
      nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = player.duration
      nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player.currentTime
      nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player.isPlaying ? player.ref.rate : 0.0
      nowPlayingInfo.removeValue(forKey: MPNowPlayingInfoPropertyDefaultPlaybackRate)
    }
    nowPlayingInfo[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue`,
    'MediaController Now Playing values'
  );

  next = replaceRequired(
    next,
    `  private func enableRemoteCommands(options: LockScreenOptions?) {
    remoteCommandCenter.playCommand.addTarget { [weak self] _ in`,
    `  private func enableRemoteCommands(options: LockScreenOptions?) {
    // setActiveForLockScreen can be called at every hidden segment boundary.
    // Clear the old closure targets first so one lock-screen tap can never fan
    // out into multiple play/pause/seek operations.
    remoteCommandCenter.playCommand.removeTarget(nil)
    remoteCommandCenter.pauseCommand.removeTarget(nil)
    remoteCommandCenter.togglePlayPauseCommand.removeTarget(nil)
    remoteCommandCenter.changePlaybackPositionCommand.removeTarget(nil)
    remoteCommandCenter.skipForwardCommand.removeTarget(nil)
    remoteCommandCenter.skipBackwardCommand.removeTarget(nil)

    remoteCommandCenter.playCommand.addTarget { [weak self] _ in`,
    'MediaController remote-command reset'
  );

  next = replaceRequired(
    next,
    `    remoteCommandCenter.pauseCommand.addTarget { [weak self] _ in
      guard let player = self?.activePlayer else {
        return .commandFailed
      }

      player.ref.pause()
      return .success
    }`,
    `    remoteCommandCenter.pauseCommand.addTarget { [weak self] _ in
      guard let player = self?.activePlayer else {
        return .commandFailed
      }

      player.ref.pause()
      self?.updateNowPlayingInfo(for: player)
      return .success
    }`,
    'MediaController pause command'
  );

  next = replaceRequired(
    next,
    `      if player.isPlaying {
        player.ref.pause()
      } else {
        player.play(at: Float(player.currentRate > 0 ? player.currentRate : 1.0))
      }
      return .success`,
    `      if player.isPlaying {
        player.ref.pause()
        self?.updateNowPlayingInfo(for: player)
      } else {
        player.play(at: Float(player.currentRate > 0 ? player.currentRate : 1.0))
      }
      return .success`,
    'MediaController toggle command'
  );

  next = replaceRequired(
    next,
    `      let seekTime = CMTime(seconds: event.positionTime, preferredTimescale: 1)
      player.ref.seek(to: seekTime)

      return .success`,
    `      if player.logicalLockScreenTimeline != nil {
        player.requestLogicalSeek(to: event.positionTime)
      } else {
        let seekTime = CMTime(seconds: event.positionTime, preferredTimescale: 1)
        player.ref.seek(to: seekTime)
      }

      return .success`,
    'MediaController absolute seek command'
  );

  next = replaceRequired(
    next,
    `      let currentTime = player.ref.currentTime()
      let seekTime = currentTime + CMTime(seconds: event.interval, preferredTimescale: 1)
      player.ref.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)

      return .success`,
    `      if let logical = player.logicalNowPlayingValues() {
        player.requestLogicalSeek(to: logical.elapsed + event.interval)
      } else {
        let currentTime = player.ref.currentTime()
        let seekTime = currentTime + CMTime(seconds: event.interval, preferredTimescale: 1)
        player.ref.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)
      }

      return .success`,
    'MediaController forward skip command'
  );

  next = replaceRequired(
    next,
    `      let currentTime = player.ref.currentTime()
      let seekTime = currentTime - CMTime(seconds: event.interval, preferredTimescale: 1)
      player.ref.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)

      return .success`,
    `      if let logical = player.logicalNowPlayingValues() {
        player.requestLogicalSeek(to: logical.elapsed - event.interval)
      } else {
        let currentTime = player.ref.currentTime()
        let seekTime = currentTime - CMTime(seconds: event.interval, preferredTimescale: 1)
        player.ref.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)
      }

      return .success`,
    'MediaController backward skip command'
  );

  next = next.replaceAll('removeTarget(self)', 'removeTarget(nil)');

  return next;
}

function patchExpoAudioAt(packageRoot) {
  const iosRoot = path.join(packageRoot, 'ios');
  const files = [
    ['AudioPlayer.swift', patchAudioPlayerSwift],
    ['AudioModule.swift', patchAudioModuleSwift],
    ['MediaController.swift', patchMediaControllerSwift],
  ];

  for (const [fileName, transform] of files) {
    const filePath = path.join(iosRoot, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Floently Read media-session patch missing expo-audio file: ${filePath}`);
    }
    const before = fs.readFileSync(filePath, 'utf8');
    const after = transform(before);
    if (after !== before) {
      fs.writeFileSync(filePath, after);
    }
  }
}

function resolveExpoAudioPackageRoot(projectRoot) {
  const packageJson = require.resolve('expo-audio/package.json', {
    paths: [projectRoot],
  });
  const packageRoot = path.dirname(packageJson);
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));

  if (pkg.version !== SUPPORTED_EXPO_AUDIO_VERSION) {
    throw new Error(
      `Floently Read logical media-session patch is pinned to expo-audio ` +
      `${SUPPORTED_EXPO_AUDIO_VERSION}, found ${pkg.version || 'unknown'}.`
    );
  }

  return packageRoot;
}

function withReadDocumentMediaSession(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageRoot = resolveExpoAudioPackageRoot(projectRoot);
      patchExpoAudioAt(packageRoot);
      return config;
    },
  ]);
}

module.exports = withReadDocumentMediaSession;
module.exports.PATCH_MARKER = PATCH_MARKER;
module.exports.SUPPORTED_EXPO_AUDIO_VERSION = SUPPORTED_EXPO_AUDIO_VERSION;
module.exports.patchAudioPlayerSwift = patchAudioPlayerSwift;
module.exports.patchAudioModuleSwift = patchAudioModuleSwift;
module.exports.patchMediaControllerSwift = patchMediaControllerSwift;
module.exports.patchExpoAudioAt = patchExpoAudioAt;
module.exports.resolveExpoAudioPackageRoot = resolveExpoAudioPackageRoot;
