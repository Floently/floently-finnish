export type ProfessionalMissionSpeakingProfession = 'doctor' | 'nurse' | 'practical_nurse';
export type ProfessionalMissionSpeakingEntryMode = 'workplace' | 'interview';

export type ProfessionalMissionSpeakingSearchParams = {
  missionId?: string | string[];
  contextId?: string | string[];
  profession?: string | string[];
  scenarioId?: string | string[];
  entryMode?: string | string[];
};

export type ProfessionalMissionSpeakingPreset = {
  initialLevelBand: 'A1-A2' | 'B1-B2' | 'C1-C2';
  initialSurface: 'conversation';
  initialProfession: ProfessionalMissionSpeakingProfession;
  initialScenarioId: string;
  lockProfession: true;
  entryMode: ProfessionalMissionSpeakingEntryMode;
  contextLabel: string;
};

export type ProfessionalMissionAccessStatus = {
  isInternalAllAccess?: boolean;
  isPreview?: boolean;
  entitlements?: {
    professionalAccess?: boolean;
    professions?: readonly string[];
  };
} | null | undefined;

export function parseProfessionalMissionSpeakingParams(
  params: ProfessionalMissionSpeakingSearchParams,
): ProfessionalMissionSpeakingPreset | null;

export function canUseProfessionalMissionSpeakingPreset(
  preset: ProfessionalMissionSpeakingPreset | null,
  status: ProfessionalMissionAccessStatus,
): boolean;
