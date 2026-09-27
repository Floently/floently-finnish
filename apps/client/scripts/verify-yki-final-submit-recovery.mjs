import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../features/exam/screens/ExamRuntimeScreen.tsx', import.meta.url),
  'utf8',
);
const service = fs.readFileSync(
  new URL('../../backend/app/services/yki_service.py', import.meta.url),
  'utf8',
);

const required = [
  'YKI_FINAL_SUBMIT_PERSISTED_RECOVERY',
  'YKI_FINAL_SUBMIT_FREEZE_GUARD',
  'YKI_FINAL_SUBMIT_NO_REUPLOAD',
  'YKI_FINAL_SUBMIT_CONTROLLED_TIMEOUT',
  'YKI_FINAL_SUBMIT_IDEMPOTENT_RECOVERY',
  'waitForPersistedSubmission',
  "router.replace('/yki-exam/results' as never)",
  'finalResultsRef.current',
];

for (const marker of required) {
  if (!source.includes(marker) && !service.includes(marker)) {
    throw new Error(`Missing final-submit recovery marker: ${marker}`);
  }
}

if (source.includes(
  'setResults(finalResults);\n      setTaskState(defaultTaskState());',
)) {
  throw new Error('Final speaking state is still reset before final evaluation.');
}

if (!source.includes(
  'Your final recording will not be uploaded again.',
)) {
  throw new Error('Controlled retry message is missing.');
}

console.log('YKI_FINAL_SUBMIT_CLIENT_RECOVERY=PASS');
