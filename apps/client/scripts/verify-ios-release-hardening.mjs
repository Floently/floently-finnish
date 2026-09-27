import fs from 'node:fs';

const voice = fs.readFileSync(
  'packages/core/api/voice.ts',
  'utf8',
);

const recorder = fs.readFileSync(
  'apps/client/features/speaking/hooks/useRoleplayRecorder.ts',
  'utf8',
);

const voiceTokens = [
  'audio_ref?: string | null',
  'voice_ref?: string | null',
  'data.audio_ref',
  '|| data.voice_ref',
];

for (const token of voiceTokens) {
  if (!voice.includes(token)) {
    throw new Error(
      `Voice compatibility token missing: ${token}`,
    );
  }
}

const recorderTokens = [
  'const startingRef = useRef(false)',
  'startingRef.current',
  'startingRef.current = true',
  '} finally {',
  'startingRef.current = false',
];

for (const token of recorderTokens) {
  if (!recorder.includes(token)) {
    throw new Error(
      `Recorder guard token missing: ${token}`,
    );
  }
}

const guardIndex = recorder.indexOf(
  "startingRef.current\n"
  + "      || phaseRef.current === 'recording'",
);

const cueIndex = recorder.indexOf(
  'await uiSounds.micOnBeforeRecording()',
);

const nativeStartIndex = recorder.indexOf(
  'nativeRecorder.record()',
);

const releaseIndex = recorder.indexOf(
  "} finally {\n"
  + "      startingRef.current = false;",
);

if (
  guardIndex < 0
  || cueIndex < 0
  || nativeStartIndex < 0
  || releaseIndex < 0
) {
  throw new Error(
    'Recorder guard ordering markers are incomplete.',
  );
}

if (!(
  guardIndex
  < cueIndex
  && cueIndex
  < nativeStartIndex
  && nativeStartIndex
  < releaseIndex
)) {
  throw new Error(
    'Recorder guard does not cover cue and native startup.',
  );
}

if (
  recorder.match(
    /const startingRef = useRef\(false\)/g,
  )?.length !== 1
) {
  throw new Error(
    'Recorder must contain exactly one start guard ref.',
  );
}

console.log(
  'IOS_RELEASE_HARDENING=PASS',
);
