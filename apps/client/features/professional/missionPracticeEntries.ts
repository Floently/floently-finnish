import type { TaskDescriptor } from '@core/schemas/learning';
import { PROFESSIONAL_MISSIONS } from '@core/professional/missions.mjs';

import { toReadingTaskDescriptor } from '../reading/readingEngine';
import { buildWritingTaskDescriptor } from '../writing/engine';
import {
  buildProfessionalMissionReadingTask,
  buildProfessionalMissionWritingTask,
} from './missionRuntimeAdapters';

export type ProfessionalMissionPracticeEntry = {
  descriptor: TaskDescriptor;
  title: string;
  summary: string;
  missionId: string;
  source:
    | 'professional-mission-roleplay'
    | 'professional-mission-reading'
    | 'professional-mission-writing';
};

function isMissionProfession(value?: string): value is 'doctor' | 'nurse' | 'practical_nurse' {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function missionRoleplayPracticeEntry(
  mission: (typeof PROFESSIONAL_MISSIONS)[number],
): ProfessionalMissionPracticeEntry {
  const roleplayStep = mission.steps.find(
    (step) => step.stage === 'produce' && step.task.runtime === 'roleplay',
  );
  if (!roleplayStep) {
    throw new Error(`MISSION_ROLEPLAY_STEP_MISSING:${mission.missionId}`);
  }

  return {
    descriptor: {
      ...roleplayStep.task,
      // Agent F's accepted source remains degraded and still targets the
      // ordinary protected `/speaking` route. Only this integration-owned
      // Practice clone becomes available and targets the separately reviewed
      // mission adapter, which validates tuple + entitlement before rendering
      // the existing SpeakingRoute.
      launch: {
        ...roleplayStep.task.launch,
        route: '/speaking/mission',
      },
      health: 'available',
      featureFlag: undefined,
    },
    title: roleplayStep.content.title,
    summary: roleplayStep.objective,
    missionId: mission.missionId,
    source: 'professional-mission-roleplay',
  };
}

/**
 * Practice-facing mission seam.
 *
 * Reading and Writing use their canonical Wave-1 adapters. Mission Roleplay
 * preserves Agent F's canonical launch params but routes the Practice clone
 * through `/speaking/mission`, where the exact mission/profession/context/
 * scenario tuple and Professional entitlement are validated. Agent F's source
 * descriptor remains byte-identical, degraded, and routed to `/speaking`.
 * Professional Listening remains unavailable because no canonical owner exists.
 */
export function getProfessionalMissionPracticeEntries(profession?: string): ProfessionalMissionPracticeEntry[] {
  if (!isMissionProfession(profession)) return [];

  return PROFESSIONAL_MISSIONS
    .filter((mission) => mission.profession === profession)
    .flatMap((mission) => {
      const readingTask = buildProfessionalMissionReadingTask(mission);
      const writingTask = buildProfessionalMissionWritingTask(mission);
      return [
        missionRoleplayPracticeEntry(mission),
        {
          descriptor: {
            ...toReadingTaskDescriptor(readingTask),
            requiredEntitlements: ['professionalAccess', `profession:${mission.profession}`],
            contextId: mission.contextId,
            topic: mission.missionId,
          },
          title: readingTask.title,
          summary: readingTask.readingGoal,
          missionId: mission.missionId,
          source: 'professional-mission-reading' as const,
        },
        {
          descriptor: {
            ...buildWritingTaskDescriptor(writingTask, mission.profession),
            contextId: mission.contextId,
            topic: mission.missionId,
          },
          title: writingTask.title,
          summary: writingTask.communicativeGoal,
          missionId: mission.missionId,
          source: 'professional-mission-writing' as const,
        },
      ];
    });
}
