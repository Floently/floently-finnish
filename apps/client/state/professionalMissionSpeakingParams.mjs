import { PROFESSIONAL_MISSIONS } from '../../../packages/core/professional/missions.mjs';

const MAX_PARAM_LENGTH = 160;
const SAFE_IDENTIFIER = /^[A-Za-z0-9._:-]+$/;

function singleIdentifier(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_PARAM_LENGTH) return null;
  if (!SAFE_IDENTIFIER.test(normalized)) return null;
  return normalized;
}

function isProfession(value) {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function isEntryMode(value) {
  return value === 'workplace' || value === 'interview';
}

/**
 * Parse a Professional Mission deep launch by validating the complete URL
 * tuple against Agent F's accepted mission catalog. Arbitrary URL values must
 * never be able to mix a profession, mission, context or scenario.
 */
export function parseProfessionalMissionSpeakingParams(params) {
  const missionId = singleIdentifier(params?.missionId);
  if (!missionId) return null;

  const mission = PROFESSIONAL_MISSIONS.find((candidate) => candidate.missionId === missionId);
  if (!mission || !isProfession(mission.profession)) return null;

  const profession = singleIdentifier(params?.profession);
  const contextId = singleIdentifier(params?.contextId);
  const scenarioId = singleIdentifier(params?.scenarioId);
  const entryMode = singleIdentifier(params?.entryMode);
  if (!profession || !contextId || !scenarioId || !entryMode) return null;
  if (!isProfession(profession) || profession !== mission.profession) return null;
  if (contextId !== mission.contextId) return null;
  if (!isEntryMode(entryMode)) return null;

  const roleplayStep = mission.steps.find(
    (step) => step.stage === 'produce' && step.task.runtime === 'roleplay',
  );
  if (!roleplayStep || roleplayStep.task.launch.route !== '/speaking') return null;

  const launchParams = roleplayStep.task.launch.params ?? {};
  const canonicalScenarioId = singleIdentifier(launchParams.scenarioId);
  const canonicalEntryMode = singleIdentifier(launchParams.entryMode);
  const canonicalMissionId = singleIdentifier(launchParams.missionId);
  const canonicalContextId = singleIdentifier(launchParams.contextId);
  const canonicalProfession = singleIdentifier(launchParams.profession);

  if (
    canonicalScenarioId !== scenarioId
    || canonicalEntryMode !== entryMode
    || canonicalMissionId !== missionId
    || canonicalContextId !== contextId
    || canonicalProfession !== profession
  ) {
    return null;
  }

  return Object.freeze({
    initialLevelBand: mission.levelBand,
    initialSurface: 'conversation',
    initialProfession: profession,
    initialScenarioId: scenarioId,
    lockProfession: true,
    entryMode,
    contextLabel: mission.title,
  });
}

/**
 * Speaking is shared by Everyday, YKI and Professional access. A valid
 * mission tuple therefore still requires a real Professional entitlement for
 * the exact profession before the integration-owned mission route may render
 * the Professional mission preset.
 */
export function canUseProfessionalMissionSpeakingPreset(preset, status) {
  if (!preset || !status) return false;
  if (status.isInternalAllAccess) return true;
  if (status.isPreview) return false;
  if (!status.entitlements?.professionalAccess) return false;
  return Boolean(status.entitlements.professions?.includes(preset.initialProfession));
}
