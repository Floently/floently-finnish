import {
  listMissionsForProfession,
  type ProfessionalMission,
  type ProfessionalMissionStep,
  type ProfessionalProfession,
} from '@core/professional/missions.mjs';

export type ProfessionalMissionLaunch = {
  pathname: '/professional/listening' | '/speaking/mission' | '/professional/reading' | '/professional/writing';
  params: Record<string, string>;
};

export type ProfessionalMissionChainStep = {
  id: 'listen' | 'speak' | 'read' | 'write';
  order: number;
  title: string;
  detail: string;
  skills: readonly string[];
  available: boolean;
  availabilityLabel: string;
  launch: ProfessionalMissionLaunch | null;
};

export type ProfessionalMissionChain = {
  mission: ProfessionalMission;
  steps: readonly ProfessionalMissionChainStep[];
  primaryStep: ProfessionalMissionChainStep;
};

function requiredStep(
  mission: ProfessionalMission,
  stage: ProfessionalMissionStep['stage'],
): ProfessionalMissionStep {
  const step = mission.steps.find((candidate) => candidate.stage === stage);
  if (!step) throw new Error(`PROFESSIONAL_MISSION_STEP_MISSING:${mission.missionId}:${stage}`);
  return step;
}

function firstString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function buildProfessionalMissionChain(
  profession: ProfessionalProfession,
): ProfessionalMissionChain {
  const mission = listMissionsForProfession(profession)[0];
  if (!mission) throw new Error(`PROFESSIONAL_MISSION_MISSING:${profession}`);

  const listen = requiredStep(mission, 'receive');
  const speak = requiredStep(mission, 'produce');
  const read = requiredStep(mission, 'interpret');
  const write = requiredStep(mission, 'document');
  const correct = requiredStep(mission, 'correct');

  const roleplayParams = speak.task.launch.params ?? {};
  const scenarioId = firstString(roleplayParams.scenarioId);
  const entryMode = firstString(roleplayParams.entryMode);
  if (!scenarioId || entryMode !== 'workplace') {
    throw new Error(`PROFESSIONAL_MISSION_ROLEPLAY_INVALID:${mission.missionId}`);
  }

  const steps: ProfessionalMissionChainStep[] = [
    {
      id: 'listen',
      order: 1,
      title: listen.content.title,
      detail: listen.objective,
      skills: ['listening'],
      available: true,
      availabilityLabel: 'Ready',
      launch: {
        pathname: '/professional/listening',
        params: {
          taskId: `mission.${mission.missionId}.listening`,
        },
      },
    },
    {
      id: 'speak',
      order: 2,
      title: speak.content.title,
      detail: speak.objective,
      skills: ['speaking', 'listening'],
      available: true,
      availabilityLabel: 'Ready',
      launch: {
        pathname: '/speaking/mission',
        params: {
          missionId: mission.missionId,
          contextId: mission.contextId,
          profession: mission.profession,
          scenarioId,
          entryMode,
        },
      },
    },
    {
      id: 'read',
      order: 3,
      title: read.content.title,
      detail: read.objective,
      skills: ['reading'],
      available: true,
      availabilityLabel: 'Ready',
      launch: {
        pathname: '/professional/reading',
        params: {
          taskId: `mission.${mission.missionId}.reading`,
        },
      },
    },
    {
      id: 'write',
      order: 4,
      title: `${write.content.title} + focused correction`,
      detail: `${write.objective} ${correct.objective}`,
      skills: ['writing', 'grammar'],
      available: true,
      availabilityLabel: 'Ready',
      launch: {
        pathname: '/professional/writing',
        params: {
          taskId: `mission.${mission.missionId}.writing`,
        },
      },
    },
  ];

  const primaryStep = steps.find((step) => step.available);
  if (!primaryStep) throw new Error(`PROFESSIONAL_MISSION_NO_RUNNABLE_STEP:${mission.missionId}`);

  return {
    mission,
    steps,
    primaryStep,
  };
}
