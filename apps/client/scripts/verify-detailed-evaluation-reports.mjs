import fs from 'node:fs';

const files = {
  yki: fs.readFileSync(
    'apps/client/features/exam/screens/ResultsOverviewScreen.tsx',
    'utf8',
  ),
  roleplay: fs.readFileSync(
    'apps/client/features/speaking/screens/RoleplayConversationScreen.tsx',
    'utf8',
  ),
  roleplayApi: fs.readFileSync(
    'packages/core/api/roleplay.ts',
    'utf8',
  ),
};

const requirements = {
  yki: [
    'Detailed YKI practice report',
    'AI-estimated practice level',
    'Not an official YKI result',
    'Pronunciation was not assessed',
    'objectiveScores',
    'evaluation.sections',
    "'reading'",
    "'listening'",
    "'writing'",
    "'speaking'",
    'Print.printToFileAsync',
    'FileSystem.Paths.cache',
    'Export detailed PDF',
    'Export text report',
  ],
  roleplay: [
    'type FeedbackReport = RoleplayFinishResponse',
    'buildRoleplayEvaluationMarkdown',
    'buildRoleplayEvaluationPlainText',
    'buildRoleplayEvaluationHtml',
    'AI-arvioitu harjoittelutaso',
    'Ei virallinen YKI-tulos',
    'Ääntämistä ei arvioitu',
    'detailedEvaluation.criteria.map',
    'detailedEvaluation.corrections.map',
    'detailedEvaluation.actionPlan.map',
    'Print.printToFileAsync',
  ],
  roleplayApi: [
    'RoleplayEvaluationCriterion',
    'RoleplayEvaluationCorrection',
    'RoleplayEvaluationReport',
    'evaluation?: RoleplayEvaluationReport',
    'evaluationReport?: RoleplayEvaluationReport',
    'pronunciationAssessed: false',
  ],
};

for (
  const [name, tokens]
  of Object.entries(requirements)
) {
  for (const token of tokens) {
    if (!files[name].includes(token)) {
      throw new Error(
        `${name} is missing required token: ${token}`,
      );
    }
  }
}

const forbiddenClaims = [
  'Pronunciation score',
  'Ääntämispisteet',
  'accent score',
  'voice quality score',
];

for (
  const [name, source]
  of Object.entries(files)
) {
  for (const token of forbiddenClaims) {
    if (source.includes(token)) {
      throw new Error(
        `${name} contains forbidden acoustic claim: ${token}`,
      );
    }
  }
}

if (
  files.yki.includes(
    'Download / Share result',
  )
) {
  throw new Error(
    'Legacy basic YKI export button remains.',
  );
}

console.log(
  'DETAILED_EVALUATION_REPORTS=PASS',
);
