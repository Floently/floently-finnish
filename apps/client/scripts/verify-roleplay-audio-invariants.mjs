import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(
  fileURLToPath(import.meta.url),
);

const clientRoot = path.resolve(
  scriptDirectory,
  '..',
);

const readText = (relativePath) =>
  fs.readFileSync(
    path.join(clientRoot, relativePath),
    'utf8',
  );

const requireCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }

  console.log(`PASS: ${message}`);
};

const readWavDurationMs = (filePath) => {
  const buffer = fs.readFileSync(filePath);

  requireCondition(
    buffer.toString('ascii', 0, 4) === 'RIFF',
    'safe cue is a RIFF file',
  );

  requireCondition(
    buffer.toString('ascii', 8, 12) === 'WAVE',
    'safe cue is a WAVE file',
  );

  let byteRate = null;
  let dataSize = null;
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString(
      'ascii',
      offset,
      offset + 4,
    );

    const chunkSize = buffer.readUInt32LE(
      offset + 4,
    );

    const chunkData = offset + 8;

    if (chunkId === 'fmt ' && chunkSize >= 12) {
      byteRate = buffer.readUInt32LE(
        chunkData + 8,
      );
    }

    if (chunkId === 'data') {
      dataSize = chunkSize;
    }

    offset = chunkData + chunkSize + (chunkSize % 2);
  }

  requireCondition(
    Number.isFinite(byteRate) && byteRate > 0,
    'safe cue has a valid WAV byte rate',
  );

  requireCondition(
    Number.isFinite(dataSize) && dataSize > 0,
    'safe cue has non-empty WAV audio data',
  );

  return (dataSize / byteRate) * 1000;
};

const session = readText(
  'features/shared/services/audioSession.ts',
);

const recorder = readText(
  'features/speaking/hooks/useRoleplayRecorder.ts',
);

const roleplayAudio = readText(
  'features/speaking/services/roleplayAudio.ts',
);

const screen = readText(
  'features/speaking/screens/RoleplayConversationScreen.tsx',
);

const cuePath = path.join(
  clientRoot,
  'components/public/sounds/ui/mic_start_safe.wav',
);

const cueDurationMs = readWavDurationMs(cuePath);

console.log(
  `Safe cue duration: ${cueDurationMs.toFixed(2)} ms`,
);

requireCondition(
  cueDurationMs >= 80 && cueDurationMs <= 350,
  'safe cue duration is between 80 ms and 350 ms',
);

requireCondition(
  session.includes(
    'async playRecordingStartCue(',
  ),
  'dedicated awaited recording-start cue method exists',
);

requireCondition(
  session.includes(
    'return await new Promise<boolean>',
  ),
  'recording-start cue awaits native playback completion',
);

requireCondition(
  session.includes(
    'releaseTransientPlayers();\n\n      await applyAudioMode(recordingMode);',
  ),
  'all transient players are released before recording mode',
);

requireCondition(
  session.includes(
    "if (isRecordingRuntime()) {\n          return false;\n        }\n\n        setRuntimeStatus('preparing_playback'",
  ),
  'managed playback cannot take over during recording',
);

requireCondition(
  session.includes(
    "if (isRecordingRuntime()) {\n        return;\n      }\n\n      activePlaybackToken",
  ),
  'playback-stop cannot change audio mode during recording',
);

requireCondition(
  roleplayAudio.includes(
    'mic_start_safe.wav',
  ),
  'roleplay audio service uses the dedicated safe cue asset',
);

requireCondition(
  roleplayAudio.includes(
    'audioSession.playRecordingStartCue(',
  ),
  'safe cue is routed through the awaited cue method',
);

const cueIndex = recorder.indexOf(
  'await uiSounds.micOnBeforeRecording();',
);

const prepareIndex = recorder.indexOf(
  'await audioSession.prepareForRecording();',
);

const nativeRecordIndex = recorder.indexOf(
  'nativeRecorder.record();',
);

const timerIndex = recorder.indexOf(
  'startedAtRef.current = Date.now();',
  nativeRecordIndex,
);

requireCondition(
  cueIndex >= 0 &&
    prepareIndex > cueIndex &&
    nativeRecordIndex > prepareIndex,
  'safe cue completes before recording mode and native record start',
);

requireCondition(
  timerIndex > nativeRecordIndex,
  'recording timer begins after native recording starts',
);

const stopIndex = recorder.indexOf(
  'await recording.stop();',
);

const stopCueIndex = recorder.indexOf(
  'await uiSounds.micOff();',
  stopIndex,
);

requireCondition(
  stopIndex >= 0 && stopCueIndex > stopIndex,
  'stop cue remains after native recording finalization',
);

requireCondition(
  screen.includes(
    "if (Platform.OS === 'web') {\n            await uiSounds.tap();\n          }",
  ),
  'native screen does not start a second overlapping tap sound',
);

requireCondition(
  recorder.includes(
    'const diagnosticAttempt = {',
  ),
  'client timing diagnostics remain attached to native uploads',
);

console.log(
  'ROLEPLAY_AUDIO_INVARIANTS=PASS',
);
