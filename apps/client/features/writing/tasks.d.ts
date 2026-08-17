import type { WritingPathway, WritingProfession, WritingTask } from './model';

export const WRITING_TASKS: readonly WritingTask[];
export function tasksForPathway(pathway: WritingPathway, profession?: WritingProfession | null): WritingTask[];
export function writingTaskById(taskId: string): WritingTask | null;

