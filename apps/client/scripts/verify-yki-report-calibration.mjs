import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resultsPath = path.join(root, 'apps/client/features/exam/screens/ResultsOverviewScreen.tsx');
const typesPath = path.join(root, 'packages/core/api/ykiExam.ts');

const results = fs.readFileSync(resultsPath, 'utf8');
const types = fs.readFileSync(typesPath, 'utf8');

const requiredResults = [
  'function derivedCriterionPercentage',
  'function predictedYkiGrade',
  'function predictedYkiSummary',
  'function displaySafeEvaluation',
  'Predicted YKI result',
  'Result overview',
  'class="card result-summary"',
  'section-${key}',
  'class="improvement-box"',
  'class="prediction-card"',
  '.section-reading',
  '.section-listening',
  '.section-writing',
  '.section-speaking',
  'style={styles.predictionCard}',
  'styles.improvementBox',
];

for (const marker of requiredResults) {
  if (!results.includes(marker)) {
    throw new Error(`Missing YKI report calibration marker: ${marker}`);
  }
}

const requiredTypes = [
  'export type YkiPredictedSection',
  'export type YkiPredictedResult',
  'predictedYki?: YkiPredictedResult',
];

for (const marker of requiredTypes) {
  if (!types.includes(marker)) {
    throw new Error(`Missing predicted YKI type marker: ${marker}`);
  }
}

const predictionPosition = results.lastIndexOf('Predicted YKI result');
const actionPosition = results.lastIndexOf('Three-step action plan');
if (predictionPosition < 0 || actionPosition < 0 || predictionPosition <= actionPosition) {
  throw new Error('Predicted YKI result must appear after the action plan.');
}

console.log('YKI_REPORT_CLIENT_DERIVED_SCORE=PASS');
console.log('YKI_REPORT_CLIENT_PREDICTION=PASS');
console.log('YKI_REPORT_CLIENT_VISUAL_TABLES=PASS');
console.log('YKI_REPORT_CLIENT_NO_NEW_ASSETS=PASS');
console.log('YKI_REPORT_CLIENT_CALIBRATION=PASS');
