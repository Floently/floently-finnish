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


function patchAudioPlayerKotlin(source) {
  if (source.includes(PATCH_MARKER)) return source;

  let next = source;

  next = replaceRequired(
    next,
    `private const val AUDIO_SAMPLE_UPDATE = "audioSampleUpdate"
private const val SEEK_JUMP_INTERVAL_MS: Long = 10_000

@UnstableApi
class AudioPlayer(`,
    `private const val AUDIO_SAMPLE_UPDATE = "audioSampleUpdate"
private const val SEEK_JUMP_INTERVAL_MS: Long = 10_000

// ${PATCH_MARKER}
// The ExoPlayer source is a hidden narration segment. Android's MediaSession
// receives a virtual document timeline through LogicalTimelinePlayer.
internal data class LogicalLockScreenTimeline(
  val durationMs: Long,
  val elapsedAtAnchorMs: Long,
  val mediaTimeAtAnchorMs: Long,
  val playbackSpeed: Double
)

@UnstableApi
class AudioPlayer(`,
    'Android AudioPlayer logical timeline model'
  );

  next = replaceRequired(
    next,
    `  internal var lockScreenOptions: AudioLockScreenOptions? = null
  internal var mediaSession: MediaSession = buildBasicMediaSession(context, ref)
  val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), appContext)`,
    `  internal var lockScreenOptions: AudioLockScreenOptions? = null
  internal var logicalLockScreenTimeline: LogicalLockScreenTimeline? = null
  internal var mediaSession: MediaSession = buildBasicMediaSession(context, ref)
  val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), appContext)`,
    'Android AudioPlayer lock-screen state'
  );

  next = replaceRequired(
    next,
    `  fun setActiveForLockScreen(active: Boolean, metadata: Metadata? = null, options: AudioLockScreenOptions? = null) {`,
    `  fun setLogicalLockScreenTimeline(durationSeconds: Double, elapsedSeconds: Double, playbackSpeed: Double) {
    val safeDurationMs = (durationSeconds.coerceAtLeast(0.1) * 1000.0).toLong().coerceAtLeast(100L)
    val safeElapsedMs = (elapsedSeconds.coerceAtLeast(0.0) * 1000.0).toLong().coerceIn(0L, safeDurationMs)
    val safeSpeed = playbackSpeed.coerceIn(0.1, 2.0)

    logicalLockScreenTimeline = LogicalLockScreenTimeline(
      durationMs = safeDurationMs,
      elapsedAtAnchorMs = safeElapsedMs,
      mediaTimeAtAnchorMs = ref.currentPosition.coerceAtLeast(0L),
      playbackSpeed = safeSpeed
    )
    serviceConnection.playbackServiceBinder?.service?.refreshLogicalTimeline(this)
  }

  fun clearLogicalLockScreenTimeline() {
    logicalLockScreenTimeline = null
    serviceConnection.playbackServiceBinder?.service?.refreshLogicalTimeline(this)
  }

  internal fun logicalDurationMs(): Long {
    return logicalLockScreenTimeline?.durationMs ?: ref.duration.coerceAtLeast(0L)
  }

  internal fun logicalCurrentPositionMs(): Long {
    val timeline = logicalLockScreenTimeline ?: return ref.currentPosition.coerceAtLeast(0L)
    val mediaDeltaMs = (ref.currentPosition - timeline.mediaTimeAtAnchorMs).toDouble()
    val logicalDeltaMs = mediaDeltaMs / timeline.playbackSpeed
    return (timeline.elapsedAtAnchorMs + logicalDeltaMs.toLong())
      .coerceIn(0L, timeline.durationMs)
  }

  internal fun requestLogicalSeek(positionMs: Long) {
    val timeline = logicalLockScreenTimeline ?: return
    val bounded = positionMs.coerceIn(0L, timeline.durationMs)
    emit(
      "logicalSeekRequested",
      mapOf("positionSeconds" to bounded / 1000.0)
    )
  }

  fun setActiveForLockScreen(active: Boolean, metadata: Metadata? = null, options: AudioLockScreenOptions? = null) {`,
    'Android AudioPlayer logical timeline methods'
  );

  next = replaceRequired(
    next,
    `  fun clearLockScreenControls() {
    if (isActiveForLockScreen) {
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayer()
    }
  }`,
    `  fun clearLockScreenControls() {
    if (isActiveForLockScreen) {
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayer()
    }
    logicalLockScreenTimeline = null
  }`,
    'Android AudioPlayer clear lock-screen controls'
  );

  return next;
}

function patchAudioModuleKotlin(source) {
  if (source.includes(PATCH_MARKER)) return source;

  let next = source;

  next = replaceRequired(
    next,
    `      Function("clearLockScreenControls") { ref: AudioPlayer ->
        runOnMain {
          ref.clearLockScreenControls()
        }
      }

      Function("setAudioSamplingEnabled")`,
    `      Function("clearLockScreenControls") { ref: AudioPlayer ->
        runOnMain {
          ref.clearLockScreenControls()
        }
      }

      // ${PATCH_MARKER}
      Function("setLogicalLockScreenTimeline") {
        ref: AudioPlayer,
        duration: Double,
        elapsed: Double,
        playbackSpeed: Double ->
        runOnMain {
          ref.setLogicalLockScreenTimeline(duration, elapsed, playbackSpeed)
        }
      }

      Function("clearLogicalLockScreenTimeline") { ref: AudioPlayer ->
        runOnMain {
          ref.clearLogicalLockScreenTimeline()
        }
      }

      Function("setAudioSamplingEnabled")`,
    'Android AudioModule logical timeline bridge'
  );

  return next;
}

function patchAudioControlsServiceKotlin(source) {
  if (source.includes(PATCH_MARKER)) return source;

  let next = source;

  next = replaceRequired(
    next,
    `import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi`,
    `import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi`,
    'Android AudioControlsService ForwardingPlayer import'
  );

  next = replaceRequired(
    next,
    `@OptIn(UnstableApi::class)
class AudioControlsService : MediaSessionService() {`,
    `// ${PATCH_MARKER}
// Media3 remains connected to the physical ExoPlayer for playback, while this
// wrapper exposes Floently's complete reading as one logical media item.
private class LogicalTimelinePlayer(
  private val audioPlayer: AudioPlayer
) : ForwardingPlayer(audioPlayer.ref) {
  override fun getDuration(): Long = audioPlayer.logicalDurationMs()

  override fun getContentDuration(): Long = audioPlayer.logicalDurationMs()

  override fun getCurrentPosition(): Long = audioPlayer.logicalCurrentPositionMs()

  override fun getContentPosition(): Long = audioPlayer.logicalCurrentPositionMs()

  override fun seekTo(positionMs: Long) {
    audioPlayer.requestLogicalSeek(positionMs)
  }

  override fun seekTo(mediaItemIndex: Int, positionMs: Long) {
    audioPlayer.requestLogicalSeek(positionMs)
  }

  override fun seekBack() {
    audioPlayer.requestLogicalSeek(
      audioPlayer.logicalCurrentPositionMs() - AudioControlsService.SEEK_INTERVAL_MS
    )
  }

  override fun seekForward() {
    audioPlayer.requestLogicalSeek(
      audioPlayer.logicalCurrentPositionMs() + AudioControlsService.SEEK_INTERVAL_MS
    )
  }
}

@OptIn(UnstableApi::class)
class AudioControlsService : MediaSessionService() {`,
    'Android logical MediaSession player'
  );

  next = replaceRequired(
    next,
    `        ACTION_SEEK_FORWARD -> currentPlayerRef.seekTo(currentPlayerRef.currentPosition + SEEK_INTERVAL_MS)
        ACTION_SEEK_BACKWARD -> currentPlayerRef.seekTo(currentPlayerRef.currentPosition - SEEK_INTERVAL_MS)`,
    `        ACTION_SEEK_FORWARD -> {
          val player = currentPlayer
          if (player?.logicalLockScreenTimeline != null) {
            player.requestLogicalSeek(player.logicalCurrentPositionMs() + SEEK_INTERVAL_MS)
          } else {
            currentPlayerRef.seekTo(currentPlayerRef.currentPosition + SEEK_INTERVAL_MS)
          }
        }
        ACTION_SEEK_BACKWARD -> {
          val player = currentPlayer
          if (player?.logicalLockScreenTimeline != null) {
            player.requestLogicalSeek(player.logicalCurrentPositionMs() - SEEK_INTERVAL_MS)
          } else {
            currentPlayerRef.seekTo(currentPlayerRef.currentPosition - SEEK_INTERVAL_MS)
          }
        }`,
    'Android legacy notification logical seek'
  );

  next = replaceRequired(
    next,
    `        val session = MediaSession.Builder(context, player.ref)
          .setCallback(AudioMediaSessionCallback())
          .build()`,
    `        val sessionPlayer: Player = if (player.logicalLockScreenTimeline != null) {
          LogicalTimelinePlayer(player)
        } else {
          player.ref
        }
        val session = MediaSession.Builder(context, sessionPlayer)
          .setCallback(AudioMediaSessionCallback())
          .build()`,
    'Android MediaSession logical player binding'
  );

  next = replaceRequired(
    next,
    `  fun setPlayerMetadata(player: AudioPlayer, metadata: Metadata?) {
    updateMetadataInternal(player, metadata)
  }

  fun setPlayerOptions(`,
    `  fun setPlayerMetadata(player: AudioPlayer, metadata: Metadata?) {
    updateMetadataInternal(player, metadata)
  }

  fun refreshLogicalTimeline(player: AudioPlayer) {
    if (player != currentPlayer) {
      return
    }

    appContext?.mainQueue?.launch {
      val session = mediaSession ?: return@launch
      val sessionPlayer: Player = if (player.logicalLockScreenTimeline != null) {
        LogicalTimelinePlayer(player)
      } else {
        player.ref
      }
      session.setPlayer(sessionPlayer)
      updateSessionCustomLayout(player.ref.isPlaying)
      postOrStartForegroundNotification(startInForeground = false)
    }
  }

  fun setPlayerOptions(`,
    'Android media-session logical timeline refresh'
  );

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

function patchExpoAudioAndroidAt(packageRoot) {
  const androidRoot = path.join(
    packageRoot,
    'android',
    'src',
    'main',
    'java',
    'expo',
    'modules',
    'audio'
  );
  const files = [
    ['AudioPlayer.kt', patchAudioPlayerKotlin],
    ['AudioModule.kt', patchAudioModuleKotlin],
    [path.join('service', 'AudioControlsService.kt'), patchAudioControlsServiceKotlin],
  ];

  for (const [relativePath, transform] of files) {
    const filePath = path.join(androidRoot, relativePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Floently Read Android media-session patch missing expo-audio file: ${filePath}`);
    }
    const before = fs.readFileSync(filePath, 'utf8');
    const after = transform(before);
    if (after !== before) {
      fs.writeFileSync(filePath, after);
    }
  }
}

function withReadDocumentMediaSession(config) {
  let next = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageRoot = resolveExpoAudioPackageRoot(projectRoot);
      patchExpoAudioAt(packageRoot);
      return config;
    },
  ]);

  next = withDangerousMod(next, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageRoot = resolveExpoAudioPackageRoot(projectRoot);
      patchExpoAudioAndroidAt(packageRoot);
      return config;
    },
  ]);

  return next;
}

module.exports = withReadDocumentMediaSession;
module.exports.PATCH_MARKER = PATCH_MARKER;
module.exports.SUPPORTED_EXPO_AUDIO_VERSION = SUPPORTED_EXPO_AUDIO_VERSION;
module.exports.patchAudioPlayerSwift = patchAudioPlayerSwift;
module.exports.patchAudioModuleSwift = patchAudioModuleSwift;
module.exports.patchMediaControllerSwift = patchMediaControllerSwift;
module.exports.patchExpoAudioAt = patchExpoAudioAt;
module.exports.resolveExpoAudioPackageRoot = resolveExpoAudioPackageRoot;

module.exports.patchAudioPlayerKotlin = patchAudioPlayerKotlin;
module.exports.patchAudioModuleKotlin = patchAudioModuleKotlin;
module.exports.patchAudioControlsServiceKotlin = patchAudioControlsServiceKotlin;
module.exports.patchExpoAudioAndroidAt = patchExpoAudioAndroidAt;
