#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireInvariant(condition, message) {
  if (!condition) {
    throw new Error(`YKI_MULTIVOICE_INVARIANT_FAILED: ${message}`);
  }
}

const audioPlayer = read('apps/client/features/exam/services/audioPlayer.ts');
const practiceRoute = read('apps/client/state/YkiPracticeRoute.tsx');
const practiceBackend = read('apps/backend/app/routers/yki_practice.py');

// Current runtime path: YkiPracticeRoute must still send its listening script
// through the protected audio helper. The helper owns dialogue detection so
// the large screen and current backend task shapes remain backward-compatible.
requireInvariant(
  practiceRoute.includes('audioPlayer.playTextAsync(audioScript'),
  'YkiPracticeRoute no longer sends listening scripts through audioPlayer.playTextAsync',
);
requireInvariant(
  practiceRoute.includes("task.skill === 'listening'"),
  'listening tasks are no longer explicitly routed through the listening audio block',
);

// There must be real two-speaker material in the current practice bank. These
// are the two known protected dialogue examples as of 2026-08-16.
for (const taskId of ['listen_b1_workplace_01', 'listen_b2_interview_01']) {
  requireInvariant(
    practiceBackend.includes(`\"id\": \"${taskId}\"`),
    `protected YKI dialogue task disappeared: ${taskId}`,
  );
}
requireInvariant(
  (practiceBackend.match(/\"— /g) ?? []).length >= 8,
  'current YKI practice bank no longer contains the expected multi-turn dialogue markers',
);

// The helper must detect a dialogue instead of synthesizing every text blob as
// one voice. Turn parity preserves one stable voice per speaker for the current
// two-speaker dash-formatted bank.
requireInvariant(
  audioPlayer.includes('export function parseYkiDialogueTurns'),
  'dialogue parser is missing',
);
requireInvariant(
  audioPlayer.includes("speakerId: speakerA ? 'speaker_a' : 'speaker_b'"),
  'stable two-speaker identity assignment is missing',
);
requireInvariant(
  audioPlayer.includes("voiceProfile: speakerA ? 'yki_standard_female' : 'yki_standard_male'"),
  'dialogue does not bind explicit female/male voice profiles',
);
requireInvariant(
  audioPlayer.includes("voicePreference: speakerA ? 'female' : 'male'"),
  'dialogue does not bind explicit female/male voice preferences',
);
requireInvariant(
  audioPlayer.includes("mode: 'yki'"),
  'generated YKI listening audio is not identified as YKI to the voice backend',
);
requireInvariant(
  !audioPlayer.includes("mode: 'cards'"),
  'YKI generated listening audio regressed to cards mode',
);

// Generate every turn before playback so network latency does not create a TTS
// request pause between each conversational line.
requireInvariant(
  audioPlayer.includes('Promise.all(turns.map(synthesizeYkiSegment))'),
  'dialogue segments are not pre-generated before playback',
);
requireInvariant(
  audioPlayer.includes('await playManagedUntilEnd('),
  'dialogue playback is not sequenced by actual segment completion',
);
requireInvariant(
  audioPlayer.includes('setTimeout(resolve, 180)'),
  'natural inter-speaker pause contract is missing',
);

// New playback must still use the one canonical audio-session owner. Direct
// Audio/HTMLAudio construction here would reintroduce overlapping playback and
// recording bugs that the roleplay audio invariant suite already eliminated.
requireInvariant(
  audioPlayer.includes('audioSession.playManaged'),
  'YKI multi-voice playback bypasses the canonical audio session',
);
requireInvariant(
  audioPlayer.includes('audioSession.stopManagedPlayback'),
  'YKI multi-voice cancellation bypasses the canonical audio session',
);
requireInvariant(
  !audioPlayer.includes('new Audio('),
  'YKI multi-voice helper directly constructs HTML audio instead of using audioSession',
);

// Preserve the existing reveal-after-answer learning behavior. Multi-voice is
// an audio identity fix, not authorization to expose transcripts before answer.
requireInvariant(
  practiceRoute.includes('revealed && !transcriptVisible'),
  'transcript reveal no longer waits for answer reveal state',
);
requireInvariant(
  practiceRoute.includes('const shouldShowTranscript = transcriptVisible'),
  'transcript visibility contract changed unexpectedly',
);

console.log('YKI_MULTIVOICE_CONTRACT=PASS');
console.log('YKI_DIALOGUE_SPEAKER_COUNT=2');
console.log('YKI_DIALOGUE_VOICE_GENDERS=female,male');
