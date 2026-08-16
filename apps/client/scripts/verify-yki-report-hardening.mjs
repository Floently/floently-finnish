import fs from 'node:fs';

const screen = fs.readFileSync(
  'apps/client/features/exam/screens/ResultsOverviewScreen.tsx',
  'utf8',
);

const runtime = fs.readFileSync(
  'apps/client/features/exam/screens/ExamRuntimeScreen.tsx',
  'utf8',
);

const persistence = fs.readFileSync(
  'apps/client/features/exam/state/examResultsPersistence.ts',
  'utf8',
);

const api = fs.readFileSync(
  'packages/core/api/ykiExam.ts',
  'utf8',
);

const requirements = [
  [screen, 'sectionPracticeScore'],
  [screen, 'displayCriterionScore'],
  [screen, 'persistedEvaluation'],
  [screen, 'getYkiExamSession'],
  [screen, 'saveExamResults(refreshed)'],
  [screen, 'section.corrections ?? []'],
  [screen, 'Improved Finnish'],
  [screen, 'criterion.scoreMax'],
  [runtime, 'sessionId: examSessionId'],
  [persistence, 'sessionId?: string'],
  [api, 'YkiEvaluationCorrection'],
  [api, 'scoreMax?: number'],
  [api, 'corrections?: YkiEvaluationCorrection[]'],
  [api, 'YkiPersistedSessionResult'],
  [api, 'submittedAt?: string'],
];

for (const [source, token] of requirements) {
  if (!source.includes(token)) {
    throw new Error(
      `Missing YKI hardening token: ${token}`,
    );
  }
}

const forbidden = [
  'displayNumber(section.score)}/100',
  'Practice score: ${displayNumber(section.score)}/100',
  'criterion.score,\\n                    )}/100',
];

for (const token of forbidden) {
  if (screen.includes(token)) {
    throw new Error(
      `Legacy score presentation remains: ${token}`,
    );
  }
}

console.log(
  'YKI_REPORT_CLIENT_SCORING_CORRECTIONS_RECOVERY=PASS',
);
