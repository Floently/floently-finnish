import type { TaskDescriptor } from '@core/schemas/learning';

import { getProfessionalMissionRuntimeEntries } from '../professional/missionRuntimeAdapters';
import { toReadingTaskDescriptor } from '../reading/readingEngine';
import { READING_TASKS } from '../reading/readingTasks';
import { buildWritingTaskDescriptor } from '../writing/engine';
import { WRITING_TASKS } from '../writing/tasks';
import { PRACTICE_FIXTURES } from './fixtureRegistry';

export type IntegratedPracticeProfession = 'doctor' | 'nurse' | 'practical_nurse';

export type IntegratedPracticeEntry = {
  descriptor: TaskDescriptor;
  title: string;
  summary: string;
  source:
    | 'protected-launch'
    | 'reading'
    | 'writing'
    | 'professional-mission-roleplay'
    | 'professional-mission-reading'
    | 'professional-mission-writing';
};

function isIntegratedProfession(value?: string): value is IntegratedPracticeProfession {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function protectedLaunchEntries(profession?: string): IntegratedPracticeEntry[] {
  const hasMissionProfession = isIntegratedProfession(profession);
  return PRACTICE_FIXTURES
    .filter(({ descriptor }) => descriptor.runtime !== 'reading' && descriptor.runtime !== 'writing')
    .filter(({ descriptor }) => {
      if (!hasMissionProfession) return true;
      return !(descriptor.pathway === 'professional' && descriptor.runtime === 'roleplay');
    })
    .map((fixture) => ({
      descriptor: fixture.descriptor,
      title: fixture.title,
      summary: fixture.summary,
      source: 'protected-launch' as const,
    }));
}

function readingEntries(): IntegratedPracticeEntry[] {
  return READING_TASKS.map((task) => ({
    descriptor: toReadingTaskDescriptor(task),
    title: task.title,
    summary: task.context,
    source: 'reading' as const,
  }));
}

function writingEntries(profession?: string): IntegratedPracticeEntry[] {
  const canonicalProfession = isIntegratedProfession(profession) ? profession : undefined;

  return WRITING_TASKS
    .filter((task) => {
      if (task.pathway !== 'professional' || !canonicalProfession || !task.allowedProfessions) return true;
      return task.allowedProfessions.includes(canonicalProfession);
    })
    .map((task) => ({
      descriptor: buildWritingTaskDescriptor(
        task,
        task.pathway === 'professional' ? canonicalProfession : undefined,
      ),
      title: task.title,
      summary: task.situation,
      source: 'writing' as const,
    }));
}

export function getIntegratedPracticeEntries(profession?: string): IntegratedPracticeEntry[] {
  const missionEntries = isIntegratedProfession(profession)
    ? getProfessionalMissionRuntimeEntries(profession)
    : [];

  return [
    ...protectedLaunchEntries(profession),
    ...missionEntries,
    ...readingEntries(),
    ...writingEntries(profession),
  ];
}

export function findIntegratedPracticeEntry(
  entries: readonly IntegratedPracticeEntry[],
  taskId: string,
): IntegratedPracticeEntry | undefined {
  return entries.find((entry) => entry.descriptor.taskId === taskId);
}

export function getIntegratedPracticeTaskLabel(
  entries: readonly IntegratedPracticeEntry[],
  taskId: string,
): string {
  return findIntegratedPracticeEntry(entries, taskId)?.title ?? taskId;
}
