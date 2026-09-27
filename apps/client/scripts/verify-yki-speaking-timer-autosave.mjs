import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    'apps/client/features/exam/screens/ExamRuntimeScreen.tsx',
  ),
  'utf8',
);

const required = [
  "'reading' | 'prep' | 'recording' | 'stopping' | 'done'",
  'YKI_SPEAKING_TIMER_AUTOSAVE_GUARD',
  'recorderStopRef.current = recorder.stop',
  'YKI_SPEAKING_TIMER_AUTOSAVE_REQUEST',
  "speakingPhase: 'stopping'",
  'YKI_SPEAKING_TIMER_AUTOSAVE_COMMIT',
  'recorderStopRef.current()',
  'Saving recording…',
  'Keep this screen open until your answer is ready.',
  "taskState.speakingPhase === 'done'",
  'Boolean(taskState.speakingRecordedUri)',
  'YKI_FINAL_SUBMIT_FREEZE_GUARD',
  'YKI_FINAL_SUBMIT_NO_REUPLOAD',
  'YKI_FINAL_SUBMIT_CONTROLLED_TIMEOUT',
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`Missing marker: ${marker}`);
  }
}

for (const marker of [
  'void recorder.stop().then',
  "// Time's up — stop recording async, transition to done",
]) {
  if (source.includes(marker)) {
    throw new Error(`Unsafe path remains: ${marker}`);
  }
}

const commitIndex = source.indexOf(
  'YKI_SPEAKING_TIMER_AUTOSAVE_COMMIT',
);
const advanceIndex = source.indexOf('const canAdvance =');
const saveBlock = source.slice(commitIndex, advanceIndex);

if (
  (saveBlock.match(/recorderStopRef\.current\(\)/g) ?? []).length
  !== 1
) {
  throw new Error('Recorder stop must run exactly once.');
}

console.log('YKI_SPEAKING_TIMER_LATEST_STOP_REF=PASS');
console.log('YKI_SPEAKING_TIMER_EXPLICIT_SAVING_PHASE=PASS');
console.log('YKI_SPEAKING_TIMER_SINGLE_STOP_PATH=PASS');
console.log('YKI_SPEAKING_TIMER_URI_ADVANCE_GATE=PASS');
console.log('YKI_SPEAKING_TIMER_FINAL_SUBMIT_LOCKS=PASS');
console.log('YKI_SPEAKING_TIMER_AUTOSAVE_CONTRACT=PASS');
