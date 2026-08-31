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
const examRuntime = read('apps/client/features/exam/screens/ExamRuntimeScreen.tsx');
const cardPractice = read('apps/client/features/cards/hooks/useCardPractice.ts');
const practiceBackend = read('apps/backend/app/routers/yki_practice.py');

// Current YKI runtime paths must still send generated listening scripts through
// the protected audio helper. The helper owns the compatibility dialogue split.
requireInvariant(
  practiceRoute.includes('audioPlayer.playTextAsync(audioScript'),
  'YkiPracticeRoute no longer sends listening scripts through audioPlayer.playTextAsync',
);
requireInvariant(
  practiceRoute.includes("task.skill === 'listening'"),
  'listening tasks are no longer explicitly routed through the listening audio block',
);
requireInvariant(
  examRuntime.includes('audioPlayer.playTextAsync(t.audioText'),
  'formal YKI runtime no longer sends generated listening text through the protected helper',
);

// The helper is also shared by card fallback audio. KV-VOICE-004 must not turn
// ordinary card text into YKI mode or multi-speaker playback.
requireInvariant(
  cardPractice.includes('audioPlayer.playTextAsync(text'),
  'card fallback no longer uses the protected shared text-audio helper',
);
requireInvariant(
  audioPlayer.includes('async function synthesizeDefaultText'),
  'backwards-compatible default text synthesis path is missing',
);
requireInvariant(
  audioPlayer.includes("mode: 'cards'"),
  'historical card/default text mode was not preserved',
);

// There must be real two-speaker material in the current practice bank. These
// are the two protected dialogue examples as of 2026-08-16.
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

// The compatibility parser must be narrow enough that ordinary card text,
// bullet lists, and single-speaker narration do not become dialogues.
requireInvariant(
  audioPlayer.includes('export function parseYkiDialogueTurns'),
  'dialogue parser is missing',
);
requireInvariant(
  audioPlayer.includes('lines.length < 4'),
  'dialogue parser no longer requires the protected minimum turn count',
);
requireInvariant(
  audioPlayer.includes("lines.every((line) => /^—\\s*/.test(line))"),
  'dialogue parser no longer requires an em-dash marker on every turn',
);
requireInvariant(
  !audioPlayer.includes('/^[—–-]'),
  'dialogue parser became broad enough to treat ordinary hyphen lists as speaker turns',
);

// Turn parity preserves one stable voice per speaker for the current two-speaker
// dash-formatted bank.
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
  audioPlayer.includes('async function synthesizeYkiSegment'),
  'dedicated YKI dialogue synthesis path is missing',
);
requireInvariant(
  audioPlayer.includes("mode: 'yki'"),
  'generated YKI dialogue segments are not identified as YKI to the voice backend',
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
requireInvariant(
  audioPlayer.includes('playbackSequence += 1'),
  'dialogue cancellation does not invalidate the active sequence',
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
console.log('SHARED_CARD_AUDIO_COMPATIBILITY=PASS');
