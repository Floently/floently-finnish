import { PROFESSIONAL_MISSIONS } from '@core/professional/missions.mjs';

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

const MAX_PARAM_LENGTH = 160;
const SAFE_IDENTIFIER = /^[A-Za-z0-9._:-]+$/;

function singleIdentifier(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_PARAM_LENGTH) return null;
  if (!SAFE_IDENTIFIER.test(normalized)) return null;
  return normalized;
}

function isProfession(value: string): value is ProfessionalMissionSpeakingProfession {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function isEntryMode(value: string): value is ProfessionalMissionSpeakingEntryMode {
  return value === 'workplace' || value === 'interview';
}

/**
 * Parse a Professional Mission deep launch by validating the complete URL
 * tuple against Agent F's accepted mission catalog. Arbitrary URL values must
 * never be able to mix a profession, mission, context or scenario.
 */
export function parseProfessionalMissionSpeakingParams(
  params: ProfessionalMissionSpeakingSearchParams,
): ProfessionalMissionSpeakingPreset | null {
  const missionId = singleIdentifier(params.missionId);
  if (!missionId) return null;

  const mission = PROFESSIONAL_MISSIONS.find((candidate) => candidate.missionId === missionId);
  if (!mission || !isProfession(mission.profession)) return null;

  const profession = singleIdentifier(params.profession);
  const contextId = singleIdentifier(params.contextId);
  const scenarioId = singleIdentifier(params.scenarioId);
  const entryMode = singleIdentifier(params.entryMode);
  if (!profession || !contextId || !scenarioId || !entryMode) return null;
  if (!isProfession(profession) || profession !== mission.profession) return null;
  if (contextId !== mission.contextId) return null;
  if (!isEntryMode(entryMode)) return null;

  const roleplayStep = mission.steps.find(
    (step) => step.stage === 'produce' && step.task.runtime === 'roleplay',
  );
  if (!roleplayStep || roleplayStep.task.launch.route !== '/speaking') return null;

  const launchParams = roleplayStep.task.launch.params ?? {};
  const canonicalScenarioId = singleIdentifier(
    typeof launchParams.scenarioId === 'string' ? launchParams.scenarioId : undefined,
  );
  const canonicalEntryMode = singleIdentifier(
    typeof launchParams.entryMode === 'string' ? launchParams.entryMode : undefined,
  );
  const canonicalMissionId = singleIdentifier(
    typeof launchParams.missionId === 'string' ? launchParams.missionId : undefined,
  );
  const canonicalContextId = singleIdentifier(
    typeof launchParams.contextId === 'string' ? launchParams.contextId : undefined,
  );
  const canonicalProfession = singleIdentifier(
    typeof launchParams.profession === 'string' ? launchParams.profession : undefined,
  );

  if (
    canonicalScenarioId !== scenarioId
    || canonicalEntryMode !== entryMode
    || canonicalMissionId !== missionId
    || canonicalContextId !== contextId
    || canonicalProfession !== profession
  ) {
    return null;
  }

  return {
    initialLevelBand: mission.levelBand,
    initialSurface: 'conversation',
    initialProfession: profession,
    initialScenarioId: scenarioId,
    lockProfession: true,
    entryMode,
    contextLabel: mission.title,
  };
}

/**
 * `/speaking` is shared by Everyday, YKI and Professional access. A valid
 * mission tuple therefore still requires a real Professional entitlement for
 * the exact profession before AppShell may apply the mission preset.
 */
export function canUseProfessionalMissionSpeakingPreset(
  preset: ProfessionalMissionSpeakingPreset | null,
  status: ProfessionalMissionAccessStatus,
): boolean {
  if (!preset || !status) return false;
  if (status.isInternalAllAccess) return true;
  if (status.isPreview) return false;
  if (!status.entitlements?.professionalAccess) return false;
  return Boolean(status.entitlements.professions?.includes(preset.initialProfession));
}
