import type { TaskDescriptor } from '@core/schemas/learning';
import type { HealthcareReportScenario } from '../professional/data/healthcareReportWriting';

export type HealthcareWritingMigrationCandidate = {
  activation: 'integration_required';
  legacyOwnerPath: 'apps/client/features/professional/screens/HealthcareReportWritingScreen.tsx';
  legacySourceId: string;
  descriptor: TaskDescriptor;
  taskSeed: {
    title: string;
    situation: string;
    prompt: string;
    planningFacts: string[];
    reviewPrompts: string[];
    optionalPhraseSupport: string[];
    privacyNotice: string;
  };
  excludedLegacyFields: readonly ['modelAnswer'];
};

export function describeHealthcareWritingMigration(
  scenario: HealthcareReportScenario,
): HealthcareWritingMigrationCandidate;

