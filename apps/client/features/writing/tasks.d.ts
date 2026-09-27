import type {
  WritingLevel,
  WritingPathway,
  WritingProfession,
  WritingTask,
} from './model';

export const WRITING_TASKS: readonly WritingTask[];
export function tasksForPathway(
  pathway: WritingPathway,
  profession?: WritingProfession | null,
): WritingTask[];
export function writingTaskById(taskId: string): WritingTask | null;
export function getWritingLevels(
  pathway: WritingPathway,
  profession?: WritingProfession | null,
): WritingLevel[];
export function getNextWritingTask(
  taskId: string,
  profession?: WritingProfession | null,
): WritingTask | null;
