import type { LearningSkill, TaskDescriptor } from '@core/schemas/learning';

export type PracticeFixture = {
  descriptor: TaskDescriptor;
  title: string;
  summary: string;
};

const descriptor = (
  input: Omit<TaskDescriptor, 'schemaVersion' | 'contentVersion' | 'health'> & {
    contentVersion?: string;
    health?: TaskDescriptor['health'];
  },
): TaskDescriptor => ({
  schemaVersion: 'learning.v1',
  contentVersion: input.contentVersion ?? 'practice-fixture.v1',
  health: input.health ?? 'available',
  ...input,
});

/**
 * Local Wave-1 registry for Agent E development.
 *
 * These entries are launch descriptors only. They intentionally contain no
 * Cards, Roleplay, Reading, Writing, or YKI task-engine business logic.
 * Reading/Writing descriptors stay unavailable until their canonical Wave-1
 * runtimes are integrated by Agent A.
 */
export const PRACTICE_FIXTURES: readonly PracticeFixture[] = [
  {
    title: 'Everyday vocabulary review',
    summary: 'Retrieve useful everyday Finnish from the canonical Cards practice.',
    descriptor: descriptor({
      taskId: 'practice.everyday.cards.vocabulary',
      runtime: 'cards',
      pathway: 'everyday',
      skills: ['vocabulary'],
      levelBand: 'A1-B2',
      estimatedMinutes: 5,
      modality: { visual: true },
      requiredEntitlements: ['learn'],
      launch: { route: '/cards', params: { mode: 'vocabulary', domain: 'general' } },
      topic: 'everyday-communication',
      contextId: 'everyday-basics',
      tags: ['retrieval'],
    }),
  },
  {
    title: 'Everyday grammar review',
    summary: 'Practice a short grammar retrieval block in the canonical Cards surface.',
    descriptor: descriptor({
      taskId: 'practice.everyday.cards.grammar',
      runtime: 'cards',
      pathway: 'everyday',
      skills: ['grammar'],
      levelBand: 'A1-B2',
      estimatedMinutes: 5,
      modality: { visual: true },
      requiredEntitlements: ['learn'],
      launch: { route: '/cards', params: { mode: 'grammar', domain: 'general' } },
      topic: 'everyday-communication',
      contextId: 'everyday-basics',
      tags: ['retrieval'],
    }),
  },
  {
    title: 'Everyday speaking',
    summary: 'Use Finnish in a canonical everyday Roleplay conversation.',
    descriptor: descriptor({
      taskId: 'practice.everyday.roleplay',
      runtime: 'roleplay',
      pathway: 'everyday',
      skills: ['listening', 'speaking'],
      levelBand: 'A2-B2',
      estimatedMinutes: 10,
      modality: { audio: true, microphone: true, visual: true },
      requiredEntitlements: ['learn'],
      launch: { route: '/speaking' },
      topic: 'everyday-communication',
      contextId: 'everyday-basics',
      tags: ['production'],
    }),
  },
  ...(['doctor', 'nurse', 'practical_nurse'] as const).map((profession): PracticeFixture => ({
    title: 'Workplace speaking',
    summary: 'Continue profession-specific Finnish in the canonical speaking runtime.',
    descriptor: descriptor({
      taskId: `practice.professional.${profession}.roleplay`,
      runtime: 'roleplay',
      pathway: 'professional',
      skills: ['listening', 'speaking'],
      levelBand: 'B1-B2',
      estimatedMinutes: 10,
      modality: { audio: true, microphone: true, visual: true },
      requiredEntitlements: ['professional'],
      launch: { route: '/speaking' },
      profession,
      topic: 'workplace-communication',
      contextId: `workplace-${profession}`,
      tags: ['production', 'workplace'],
    }),
  })),
  {
    title: 'YKI short practice',
    summary: 'Open the canonical YKI Practice surface without entering a mock or full exam.',
    descriptor: descriptor({
      taskId: 'practice.yki.short',
      runtime: 'yki',
      pathway: 'yki',
      skills: ['listening', 'reading'],
      levelBand: 'B1-B2',
      estimatedMinutes: 10,
      modality: { audio: true, visual: true },
      requiredEntitlements: ['yki'],
      launch: { route: '/yki-practice' },
      topic: 'yki-practice',
      contextId: 'yki-practice',
      ykiMode: 'practice',
      tags: ['practice'],
    }),
  },
  {
    title: 'Everyday reading',
    summary: 'Reserved for the canonical Wave-1 Reading runtime after integration.',
    descriptor: descriptor({
      taskId: 'practice.everyday.reading.wave1',
      runtime: 'reading',
      pathway: 'everyday',
      skills: ['reading'],
      levelBand: 'A1-B2',
      estimatedMinutes: 5,
      modality: { visual: true },
      requiredEntitlements: ['learn'],
      launch: { route: '/learn/reading' },
      topic: 'everyday-communication',
      contextId: 'everyday-basics',
      featureFlag: 'wave1-reading',
      health: 'unavailable',
    }),
  },
  {
    title: 'Everyday writing',
    summary: 'Reserved for the canonical Wave-1 Writing runtime after integration.',
    descriptor: descriptor({
      taskId: 'practice.everyday.writing.wave1',
      runtime: 'writing',
      pathway: 'everyday',
      skills: ['writing'],
      levelBand: 'A1-B2',
      estimatedMinutes: 10,
      modality: { keyboard: true, visual: true },
      requiredEntitlements: ['learn'],
      launch: { route: '/learn/writing' },
      topic: 'everyday-communication',
      contextId: 'everyday-basics',
      featureFlag: 'wave1-writing',
      health: 'unavailable',
    }),
  },
] as const;

const FIXTURE_BY_TASK_ID = new Map(PRACTICE_FIXTURES.map((fixture) => [fixture.descriptor.taskId, fixture]));

export function getPracticeFixture(taskId: string): PracticeFixture | undefined {
  return FIXTURE_BY_TASK_ID.get(taskId);
}

export function getPracticeTaskLabel(taskId: string): string {
  return getPracticeFixture(taskId)?.title ?? taskId;
}

export function formatPracticeSkills(skills: readonly LearningSkill[]): string {
  return skills.map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1)).join(' · ');
}
