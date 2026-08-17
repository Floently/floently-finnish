'use strict';

const LEARNING_SCHEMA_VERSION = 'learning.v1';
const LEGACY_OWNER_PATH = 'apps/client/features/professional/screens/HealthcareReportWritingScreen.tsx';

function assertScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') throw new Error('INVALID_HEALTHCARE_SCENARIO');
  for (const field of ['id', 'profession', 'title', 'workplaceContext', 'taskInstruction']) {
    if (typeof scenario[field] !== 'string' || !scenario[field].trim()) {
      throw new Error(`INVALID_HEALTHCARE_SCENARIO_${field.toUpperCase()}`);
    }
  }
}

function describeHealthcareWritingMigration(scenario) {
  assertScenario(scenario);
  const taskId = `writing.professional.healthcare-report.${scenario.id}`;

  return {
    activation: 'integration_required',
    legacyOwnerPath: LEGACY_OWNER_PATH,
    legacySourceId: scenario.id,
    descriptor: {
      schemaVersion: LEARNING_SCHEMA_VERSION,
      taskId,
      contentVersion: 'legacy-healthcare-adapter.1',
      runtime: 'writing',
      pathway: 'professional',
      skills: ['writing'],
      levelBand: 'B1-B2',
      estimatedMinutes: 15,
      modality: { keyboard: true },
      requiredEntitlements: ['professionalAccess', `profession:${scenario.profession}`],
      launch: {
        route: '/professional/writing',
        params: { taskId, migration: 'integration_required' },
      },
      health: 'degraded',
      featureFlag: 'writing_healthcare_task_family',
      profession: scenario.profession,
      topic: `healthcare_report:${scenario.reportType}`,
      tags: ['legacy_adapter', 'language_practice', 'fictional_details_only'],
    },
    taskSeed: {
      title: scenario.title,
      situation: scenario.workplaceContext,
      prompt: scenario.taskInstruction,
      planningFacts: Array.isArray(scenario.keyFacts) ? [...scenario.keyFacts] : [],
      reviewPrompts: Array.isArray(scenario.checklist) ? [...scenario.checklist] : [],
      optionalPhraseSupport: Array.isArray(scenario.usefulPhrases) ? [...scenario.usefulPhrases] : [],
      privacyNotice: 'Use only fictional practice details. Never enter real patient or other personal data.',
    },
    excludedLegacyFields: ['modelAnswer'],
  };
}

module.exports = {
  describeHealthcareWritingMigration,
};

