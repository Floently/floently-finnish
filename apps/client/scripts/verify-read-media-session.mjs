import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const plugin = require('../plugins/withReadDocumentMediaSession.js');

const clientRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const packageRoot = plugin.resolveExpoAudioPackageRoot(clientRoot);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);

assert.equal(
  packageJson.version,
  plugin.SUPPORTED_EXPO_AUDIO_VERSION,
  'whole-document media-session patch must stay pinned to the installed expo-audio source',
);

const iosSourceFor = (name) =>
  fs.readFileSync(path.join(packageRoot, 'ios', name), 'utf8');
const androidSourceFor = (...parts) =>
  fs.readFileSync(
    path.join(
      packageRoot,
      'android',
      'src',
      'main',
      'java',
      'expo',
      'modules',
      'audio',
      ...parts,
    ),
    'utf8',
  );

const audioPlayerSource = iosSourceFor('AudioPlayer.swift');
const audioModuleSource = iosSourceFor('AudioModule.swift');
const mediaControllerSource = iosSourceFor('MediaController.swift');
const androidAudioPlayerSource = androidSourceFor('AudioPlayer.kt');
const androidAudioModuleSource = androidSourceFor('AudioModule.kt');
const androidControlsSource = androidSourceFor('service', 'AudioControlsService.kt');

const patchedPlayer = plugin.patchAudioPlayerSwift(audioPlayerSource);
const patchedModule = plugin.patchAudioModuleSwift(audioModuleSource);
const patchedController = plugin.patchMediaControllerSwift(mediaControllerSource);
const patchedAndroidPlayer = plugin.patchAudioPlayerKotlin(androidAudioPlayerSource);
const patchedAndroidModule = plugin.patchAudioModuleKotlin(androidAudioModuleSource);
const patchedAndroidControls = plugin.patchAudioControlsServiceKotlin(androidControlsSource);

for (const [name, patched] of [
  ['AudioPlayer.swift', patchedPlayer],
  ['AudioModule.swift', patchedModule],
  ['MediaController.swift', patchedController],
  ['AudioPlayer.kt', patchedAndroidPlayer],
  ['AudioModule.kt', patchedAndroidModule],
  ['AudioControlsService.kt', patchedAndroidControls],
]) {
  assert.ok(
    patched.includes(plugin.PATCH_MARKER),
    `${name} must contain the Floently logical Now Playing patch marker`,
  );
}

for (const marker of [
  'logicalSeekRequested',
  'LogicalLockScreenTimeline',
  'setLogicalLockScreenTimeline',
  'logicalNowPlayingValues',
  'mediaDelta / timeline.playbackSpeed',
  'playbackRate: isPlaying ? 1.0 : 0.0',
]) {
  assert.ok(
    patchedPlayer.includes(marker),
    `AudioPlayer logical-document contract missing: ${marker}`,
  );
}

for (const marker of [
  'Function("setLogicalLockScreenTimeline")',
  'Function("clearLogicalLockScreenTimeline")',
  'MediaController.shared.updateNowPlayingInfo(for: player)',
  'player.clearLogicalLockScreenTimeline()',
]) {
  assert.ok(
    patchedModule.includes(marker),
    `AudioModule logical-document bridge missing: ${marker}`,
  );
}

for (const marker of [
  'MPMediaItemPropertyPlaybackDuration] = logical.duration',
  'MPNowPlayingInfoPropertyElapsedPlaybackTime] = logical.elapsed',
  'MPNowPlayingInfoPropertyPlaybackRate] = logical.playbackRate',
  'MPNowPlayingInfoPropertyDefaultPlaybackRate] = 1.0',
  'player.requestLogicalSeek(to: event.positionTime)',
  'player.requestLogicalSeek(to: logical.elapsed + event.interval)',
  'player.requestLogicalSeek(to: logical.elapsed - event.interval)',
  'remoteCommandCenter.playCommand.removeTarget(nil)',
  'remoteCommandCenter.changePlaybackPositionCommand.removeTarget(nil)',
]) {
  assert.ok(
    patchedController.includes(marker),
    `MediaController whole-document Now Playing contract missing: ${marker}`,
  );
}

for (const marker of [
  'LogicalLockScreenTimeline',
  'setLogicalLockScreenTimeline',
  'logicalCurrentPositionMs',
  'mediaDeltaMs / timeline.playbackSpeed',
  'requestLogicalSeek',
  '"logicalSeekRequested"',
]) {
  assert.ok(
    patchedAndroidPlayer.includes(marker),
    `Android AudioPlayer logical-document contract missing: ${marker}`,
  );
}

for (const marker of [
  'Function("setLogicalLockScreenTimeline")',
  'Function("clearLogicalLockScreenTimeline")',
]) {
  assert.ok(
    patchedAndroidModule.includes(marker),
    `Android AudioModule logical-document bridge missing: ${marker}`,
  );
}

for (const marker of [
  'class LogicalTimelinePlayer',
  'ForwardingPlayer(audioPlayer.ref)',
  'override fun getDuration(): Long = audioPlayer.logicalDurationMs()',
  'override fun getCurrentPosition(): Long = audioPlayer.logicalCurrentPositionMs()',
  'override fun getBufferedPosition(): Long = audioPlayer.logicalCurrentPositionMs()',
  'override fun getTotalBufferedDuration(): Long = 0L',
  'override fun getPlaybackParameters(): PlaybackParameters = PlaybackParameters(1.0f)',
  'override fun seekToDefaultPosition()',
  'audioPlayer.requestLogicalSeek(positionMs)',
  'if (player.logicalLockScreenTimeline != null)',
  'return LogicalTimelinePlayer(player)',
  'MediaSession.Builder(context, sessionPlayer)',
  'fun refreshLogicalTimeline(player: AudioPlayer)',
  'session.setPlayer(resolveSessionPlayer(player, currentOptions))',
  'if (player.logicalLockScreenTimeline != null) {',
  'mediaSession?.setPlayer(resolveSessionPlayer(player, options))',
  'Keep the existing Android MediaSession alive',
  'removePlayerListener()',
  'val player = currentPlayer',
  'val listener = playbackListener',
  'player.ref.removeListener(listener)',
  'player?.assignBasicMediaSession()',
]) {
  assert.ok(
    patchedAndroidControls.includes(marker),
    `Android MediaSession logical-document contract missing: ${marker}`,
  );
}

assert.equal(
  plugin.patchAudioPlayerSwift(patchedPlayer),
  patchedPlayer,
  'AudioPlayer patch must be idempotent',
);
assert.equal(
  plugin.patchAudioModuleSwift(patchedModule),
  patchedModule,
  'AudioModule patch must be idempotent',
);
assert.equal(
  plugin.patchMediaControllerSwift(patchedController),
  patchedController,
  'MediaController patch must be idempotent',
);

assert.equal(
  plugin.patchAudioPlayerKotlin(patchedAndroidPlayer),
  patchedAndroidPlayer,
  'Android AudioPlayer patch must be idempotent',
);
assert.equal(
  plugin.patchAudioModuleKotlin(patchedAndroidModule),
  patchedAndroidModule,
  'Android AudioModule patch must be idempotent',
);
assert.equal(
  plugin.patchAudioControlsServiceKotlin(patchedAndroidControls),
  patchedAndroidControls,
  'Android AudioControlsService patch must be idempotent',
);

const appConfig = fs.readFileSync(path.join(clientRoot, 'app.config.ts'), 'utf8');
const appBase = JSON.parse(fs.readFileSync(path.join(clientRoot, 'app.base.json'), 'utf8'));
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(clientRoot, 'package.json'), 'utf8'),
);

assert.ok(
  appConfig.includes("'./plugins/withReadDocumentMediaSession'"),
  'native prebuild must install the logical document media-session patch',
);
assert.equal(
  packageManifest.dependencies?.['expo-audio'],
  plugin.SUPPORTED_EXPO_AUDIO_VERSION,
  'expo-audio must be exactly pinned while native iOS/Android source is patched',
);
assert.equal(
  appBase.expo?.runtimeVersion,
  '1.0.4',
  'Android/general runtime must remain compatible with the existing 1.0.4 binary family',
);
assert.equal(
  appBase.expo?.ios?.runtimeVersion,
  '1.0.5',
  'native iOS media-session capability requires iOS OTA runtime 1.0.5',
);
assert.equal(
  appBase.expo?.android?.runtimeVersion,
  '1.0.5',
  'native Android logical media-session capability requires Android OTA runtime 1.0.5',
);

console.log('READ_DOCUMENT_MEDIA_SESSION_SOURCE_GATE=PASS');
