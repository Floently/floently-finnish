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
  source: 'professional-mission-reading' | 'professional-mission-writing';
};

function isMissionProfession(value?: string): value is 'doctor' | 'nurse' | 'practical_nurse' {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

/**
 * Practice-facing mission seam.
 *
 * Reading and Writing are resolvable because their canonical Wave-1 owners are
 * integrated. Mission Roleplay intentionally stays out of this adapter until
 * the protected `/speaking` route has a separately reviewed profession/scenario
 * parameter bridge. The existing protected Professional Roleplay fixture remains
 * available in Practice, so this deferral does not remove speaking practice.
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
