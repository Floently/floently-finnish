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

const sourceFor = (name) =>
  fs.readFileSync(path.join(packageRoot, 'ios', name), 'utf8');

const audioPlayerSource = sourceFor('AudioPlayer.swift');
const audioModuleSource = sourceFor('AudioModule.swift');
const mediaControllerSource = sourceFor('MediaController.swift');

const patchedPlayer = plugin.patchAudioPlayerSwift(audioPlayerSource);
const patchedModule = plugin.patchAudioModuleSwift(audioModuleSource);
const patchedController = plugin.patchMediaControllerSwift(mediaControllerSource);

for (const [name, patched] of [
  ['AudioPlayer.swift', patchedPlayer],
  ['AudioModule.swift', patchedModule],
  ['MediaController.swift', patchedController],
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

const appConfig = fs.readFileSync(path.join(clientRoot, 'app.config.ts'), 'utf8');
const appBase = JSON.parse(fs.readFileSync(path.join(clientRoot, 'app.base.json'), 'utf8'));
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(clientRoot, 'package.json'), 'utf8'),
);

assert.ok(
  appConfig.includes("'./plugins/withReadDocumentMediaSession'"),
  'iOS prebuild must install the logical document media-session patch',
);
assert.equal(
  packageManifest.dependencies?.['expo-audio'],
  plugin.SUPPORTED_EXPO_AUDIO_VERSION,
  'expo-audio must be exactly pinned while native Swift source is patched',
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
  '1.0.4',
  'iOS media-session work must not unnecessarily strand existing Android OTA compatibility',
);

console.log('READ_DOCUMENT_MEDIA_SESSION_SOURCE_GATE=PASS');
