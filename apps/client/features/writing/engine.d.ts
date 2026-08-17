import type {
  WritingAccessDecision,
  WritingAccessInput,
  WritingAttempt,
  WritingEvaluator,
  WritingFeedback,
  WritingLearnerEvent,
  WritingLearnerEventInput,
  WritingPathway,
  WritingPlan,
  WritingProfession,
  WritingSession,
  WritingSubmissionIdentity,
  WritingTask,
  WritingTaskDescriptor,
  WritingTaskResult,
} from './model';

export const FOCUSED_PRIORITY_LIMIT: 2;
export const SESSION_ONLY_DRAFT_MESSAGE: string;
export const SUBMITTED_DRAFT_MESSAGE: string;
export const EVALUATION_FAILED_DRAFT_MESSAGE: string;

export function createWritingSession(task: WritingTask, startedAt: string): WritingSession;
export function moveToPlanning(session: WritingSession): WritingSession;
export function updateWritingPlan(session: WritingSession, promptId: string, value: string): WritingSession;
export function beginWriting(session: WritingSession): WritingSession;
export function updateWritingDraft(session: WritingSession, text: string): WritingSession;
export function beginRevision(session: WritingSession): WritingSession;
export function submitWriting(
  session: WritingSession,
  evaluator: WritingEvaluator,
  identity: WritingSubmissionIdentity,
): Promise<WritingSession>;
export function createAuthoredWritingEvaluator(): WritingEvaluator;
export function buildWritingTaskDescriptor(task: WritingTask, profession?: WritingProfession | null): WritingTaskDescriptor;
export function buildWritingTaskResult(session: WritingSession): WritingTaskResult | null;
export function buildWritingLearnerEvent(
  session: WritingSession,
  input: WritingLearnerEventInput,
): WritingLearnerEvent;
export function resolveWritingAccess(input: WritingAccessInput): WritingAccessDecision;
export function latestAssessedAttempt(session: WritingSession): WritingAttempt | null;
export function wordCount(text: string): number;
export function validateWritingTask(task: WritingTask): void;
export function validateFeedback(feedback: WritingFeedback): WritingFeedback;
export function emptyPlan(task: WritingTask): WritingPlan;
export function routeForPathway(pathway: WritingPathway): '/learn/writing' | '/professional/writing';
