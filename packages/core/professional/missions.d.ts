import type { ProfessionKey } from '../api/entitlements';
import type { LearningSkill, TaskDescriptor } from '../schemas/learning';

export type ProfessionalProfession = ProfessionKey;
export type ProfessionalWorkDomain = 'healthcare' | 'construction' | 'cleaning' | 'office' | 'hospitality' | 'retail';
export type ProfessionalLevelBand = 'A1-A2' | 'B1-B2' | 'C1-C2';
export type ProfessionalRegister = string;

export type ProfessionalContentProvenance = {
  provenanceId: string;
  origin: 'kielivalmis-original' | 'repository-adapter';
  contentVersion: string;
  authoredOn: string;
  note: string;
  ykiOrigin: false;
  proprietaryOrigin: false;
};

export type ProfessionalSafetyFrame = {
  kind: 'regulated-language-practice';
  notice: string;
  authorityBoundary: string;
};

export type ProfessionalMissionContent = {
  kind: 'audio-script' | 'roleplay-brief' | 'workplace-note' | 'writing-brief' | 'focused-correction';
  title: string;
  finnish: string;
  learnerTask: string;
  languageFocus: readonly string[];
};

export type ProfessionalMissionStage = 'receive' | 'produce' | 'interpret' | 'document' | 'correct';

export type ProfessionalMissionStep = {
  stepId: string;
  order: number;
  stage: ProfessionalMissionStage;
  objective: string;
  audience: string;
  register: ProfessionalRegister;
  content: ProfessionalMissionContent;
  task: TaskDescriptor;
};

export type ProfessionalMission = {
  schemaVersion: 'professional-mission.v1';
  missionId: string;
  contentVersion: string;
  profession: ProfessionalProfession;
  workDomain: ProfessionalWorkDomain;
  levelBand: ProfessionalLevelBand;
  title: string;
  situation: string;
  communicativeGoal: string;
  audience: string;
  register: ProfessionalRegister;
  contextId: string;
  safetyFrame: ProfessionalSafetyFrame;
  provenance: ProfessionalContentProvenance;
  steps: readonly ProfessionalMissionStep[];
};

export type WorkDomainCommunicationProfile = {
  domain: ProfessionalWorkDomain;
  goal: string;
  audience: string;
  register: string;
  fourSkillArc: readonly [string, string, string, string] | readonly string[];
  safetyBoundary: string;
};

export type WorkTrackSource = {
  domain: string;
  title?: string;
  core_tasks?: string[];
  key_language_targets?: string[];
};

export type WorkPathMissionSeed = {
  adapter: 'work-path.v1';
  workDomain: ProfessionalWorkDomain;
  title: string;
  communicativeGoal: string;
  audience: string;
  register: string;
  fourSkillArc: readonly string[];
  repositorySignals: {
    coreTasks: readonly string[];
    languageTargets: readonly string[];
  };
  safetyBoundary: string;
};

export type IncidentScenarioSource = {
  track: string;
  title?: string;
  situation?: string;
  language_targets?: string[];
  response_choices?: string[];
  best_response?: number;
  follow_up_task?: string;
  why?: string;
};

export type IncidentMissionSeed = {
  adapter: 'workplace-incident.v1';
  workDomain: ProfessionalWorkDomain;
  title: string;
  situation: string;
  communicativeGoal: string;
  languageTargets: readonly string[];
  followUpTask: string;
  safetyBoundary: string;
  provenance: ProfessionalContentProvenance;
};

export const PROFESSIONAL_PROFESSIONS: readonly ProfessionalProfession[];
export const PROFESSIONAL_WORK_DOMAINS: readonly ProfessionalWorkDomain[];
export const PROFESSION_WORK_DOMAIN: Readonly<Record<ProfessionalProfession, ProfessionalWorkDomain>>;

export const PROFESSIONAL_LISTENING_FEATURE_FLAG: 'professional-listening-runtime-v1';
export const PROFESSIONAL_READING_FEATURE_FLAG: 'wave1-professional-reading-runtime-v1';
export const PROFESSIONAL_WRITING_FEATURE_FLAG: 'wave1-professional-writing-runtime-v1';
export const PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG: 'professional-mission-roleplay-adapter-v1';

export const CANONICAL_PROFESSIONAL_ROUTES: Readonly<{
  listeningFallback: '/professional';
  roleplay: '/speaking';
  reading: '/professional/reading';
  writing: '/professional/writing';
}>;

export const INTERVIEW_SCENARIO_BY_PROFESSION: Readonly<Record<ProfessionalProfession, string>>;
export const PROFESSIONAL_MISSIONS: readonly ProfessionalMission[];
export const WORK_DOMAIN_COMMUNICATION_PROFILES: Readonly<Record<ProfessionalWorkDomain, WorkDomainCommunicationProfile>>;

export class ProfessionalMissionValidationError extends Error {}

export function validateProfessionalMission(mission: unknown): ProfessionalMission;
export function validateProfessionalMissionCatalog(catalog?: readonly unknown[]): readonly ProfessionalMission[];
export function listMissionsForProfession(profession: ProfessionalProfession): ProfessionalMission[];
export function getMissionById(missionId: string): ProfessionalMission;
export function getWorkDomainCommunicationProfile(domain: ProfessionalWorkDomain): WorkDomainCommunicationProfile;
export function adaptWorkTrackToMissionSeed(track: WorkTrackSource): WorkPathMissionSeed;
export function adaptIncidentScenarioToMissionSeed(scenario: IncidentScenarioSource): IncidentMissionSeed;
export function buildInterviewRoleplayDescriptor(
  profession: ProfessionalProfession,
  options?: { levelBand?: ProfessionalLevelBand; contextId?: string },
): TaskDescriptor & { skills: LearningSkill[] };
