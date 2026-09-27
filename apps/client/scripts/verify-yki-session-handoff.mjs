import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function requireText(source, value, label) {
  if (!source.includes(value)) {
    throw new Error(`Missing ${label}: ${value}`);
  }
}

function forbidText(source, value, label) {
  if (source.includes(value)) {
    throw new Error(`Forbidden ${label}: ${value}`);
  }
}

const api = read('packages/core/api/ykiExam.ts');
const service = read(
  'apps/client/features/yki-exam/services/ykiExamService.ts',
);
const startScreen = read(
  'apps/client/features/yki-exam/screens/YkiExamScreen.tsx',
);
const runtime = read(
  'apps/client/features/exam/screens/ExamRuntimeScreen.tsx',
);
const results = read(
  'apps/client/features/exam/screens/ResultsOverviewScreen.tsx',
);

requireText(
  api,
  'data.runtime?.session_id',
  'nested runtime session-ID resolution',
);

requireText(
  service,
  "throw new Error('YKI_SESSION_ID_MISSING')",
  'missing-session rejection',
);

requireText(
  startScreen,
  "router.push('/yki-exam/runtime' as never);",
  'navigation after successful session creation',
);

forbidText(
  startScreen,
  'navigate to runtime regardless',
  'best-effort navigation',
);

requireText(
  runtime,
  'await startExamSession(storedBand)',
  'runtime session recovery',
);

forbidText(
  runtime,
  'startYkiPracticeSession',
  'complete-exam practice fallback',
);

requireText(
  runtime,
  'if (!examSessionId)',
  'final session requirement',
);

requireText(
  runtime,
  'if (!evaluationReport)',
  'returned evaluation requirement',
);

requireText(
  results,
  'Evaluation failed: this attempt was not connected',
  'honest evaluation-failure message',
);

forbidText(
  results,
  'A detailed evaluation was not available for this older result.',
  'false older-result message',
);

console.log('YKI_SESSION_HANDOFF_AND_EVALUATION_GATE=PASS');
