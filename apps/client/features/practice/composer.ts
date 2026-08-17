import type {
  LearningSkill,
  PracticeScope,
  PracticeSelectionReason,
  PracticeSessionManifest,
  TaskDescriptor,
} from '@core/schemas/learning';

export const PRACTICE_COMPOSER_VERSION = 'practice-composer.v1' as const;
export const PRACTICE_CONTEXT_COHERENCE_BONUS = 0.08;

export type PracticeTargetMinutes = 5 | 10 | 20;

export type PracticeModalityAvailability = {
  audio: boolean;
  microphone: boolean;
  keyboard: boolean;
};

/**
 * Narrow Agent-E adapter around durable learner evidence.
 * Agent B's persistence/evidence service can later map into this input without
 * changing the frozen Wave-1 learning contract.
 */
export type DurablePracticeEvidence = {
  durable: true;
  learnerId: string;
  sourceEvidenceId: string;
  observedAt: string;
  taskId?: string;
  skill?: LearningSkill;
  overdueNeed?: number;
  weaknessNeed?: number;
  goalRelevance?: number;
  novelty?: number;
  recentlyPracticed?: boolean;
};

export type PracticeComposerInput = {
  learnerId: string;
  createdAt: string;
  scope: PracticeScope;
  targetMinutes: PracticeTargetMinutes;
  /** Remaining scheduling budget during a running session. */
  availableMinutes?: number;
  candidates: readonly TaskDescriptor[];
  entitlements: readonly string[];
  profession?: string;
  allowedLevelBands?: readonly string[];
  completedPrerequisites?: readonly string[];
  modalities: PracticeModalityAvailability;
  enabledFeatureFlags?: readonly string[];
  allowDegraded?: boolean;
  preferredContextId?: string;
  evidence?: readonly DurablePracticeEvidence[];
  excludedTaskIds?: readonly string[];
};

export type PracticeFilterCode =
  | 'invalid_descriptor'
  | 'duplicate_task_id'
  | 'scope_mismatch'
  | 'missing_entitlement'
  | 'profession_mismatch'
  | 'level_mismatch'
  | 'missing_prerequisite'
  | 'unavailable'
  | 'degraded_excluded'
  | 'feature_disabled'
  | 'microphone_unavailable'
  | 'audio_unavailable'
  | 'keyboard_unavailable'
  | 'time_budget'
  | 'recent_repetition'
  | 'yki_mode_boundary'
  | 'explicitly_excluded';

export type PracticeFilterDiagnostic = {
  taskId: string;
  code: PracticeFilterCode;
};

export type PracticeComposition = {
  manifest: PracticeSessionManifest;
  diagnostics: PracticeFilterDiagnostic[];
  totalMinutes: number;
};

export type PracticeRecomposeAction =
  | 'skip'
  | 'another'
  | 'no_microphone'
  | 'shorter';

const clamp01 = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

function schedulingBudget(input: PracticeComposerInput): number {
  const available = input.availableMinutes ?? input.targetMinutes;
  if (!Number.isFinite(available)) return input.targetMinutes;
  return Math.min(input.targetMinutes, Math.max(0, available));
}

function isUsableEvidence(
  input: PracticeComposerInput,
  item: DurablePracticeEvidence,
): boolean {
  return item?.durable === true
    && item.learnerId === input.learnerId
    && typeof item.sourceEvidenceId === 'string'
    && Boolean(item.sourceEvidenceId.trim())
    && typeof item.observedAt === 'string'
    && Boolean(item.observedAt.trim())
    && Number.isFinite(Date.parse(item.observedAt));
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function stableInputFingerprint(input: PracticeComposerInput): string {
  const evidence = (input.evidence ?? [])
    .filter((item) => isUsableEvidence(input, item))
    .map((item) => ({
      sourceEvidenceId: item.sourceEvidenceId,
      observedAt: item.observedAt,
      taskId: item.taskId ?? '',
      skill: item.skill ?? '',
      overdueNeed: clamp01(item.overdueNeed),
      weaknessNeed: clamp01(item.weaknessNeed),
      goalRelevance: clamp01(item.goalRelevance),
      novelty: clamp01(item.novelty),
      recentlyPracticed: Boolean(item.recentlyPracticed),
    }))
    .sort((left, right) => left.sourceEvidenceId.localeCompare(right.sourceEvidenceId));

  return JSON.stringify({
    learnerId: input.learnerId,
    createdAt: input.createdAt,
    scope: input.scope,
    targetMinutes: input.targetMinutes,
    availableMinutes: schedulingBudget(input),
    candidateIds: input.candidates
      .map((task) => `${typeof task?.taskId === 'string' ? task.taskId : ''}@${typeof task?.contentVersion === 'string' ? task.contentVersion : ''}`)
      .sort(),
    entitlements: [...input.entitlements].sort(),
    profession: input.profession ?? '',
    allowedLevelBands: [...(input.allowedLevelBands ?? [])].sort(),
    completedPrerequisites: [...(input.completedPrerequisites ?? [])].sort(),
    modalities: input.modalities,
    enabledFeatureFlags: [...(input.enabledFeatureFlags ?? [])].sort(),
    allowDegraded: Boolean(input.allowDegraded),
    preferredContextId: input.preferredContextId ?? '',
    excludedTaskIds: [...(input.excludedTaskIds ?? [])].sort(),
    evidence,
  });
}

function validDescriptor(task: TaskDescriptor): boolean {
  if (!task || typeof task !== 'object') return false;
  if (typeof task.taskId !== 'string' || !task.taskId.trim()) return false;
  if (typeof task.contentVersion !== 'string' || !task.contentVersion.trim()) return false;
  if (!task.launch || typeof task.launch.route !== 'string' || !task.launch.route.trim()) return false;
  if (!Number.isFinite(task.estimatedMinutes) || task.estimatedMinutes <= 0) return false;
  if (!Array.isArray(task.skills) || task.skills.length === 0) return false;
  if (typeof task.levelBand !== 'string' || !task.levelBand.trim()) return false;
  if (!Array.isArray(task.requiredEntitlements)) return false;
  if (task.requiredEntitlements.some((key) => typeof key !== 'string' || !key.trim())) return false;
  if (!task.modality || typeof task.modality !== 'object') return false;
  if (!['available', 'degraded', 'unavailable'].includes(task.health)) return false;
  if (!['everyday', 'professional', 'yki'].includes(task.pathway)) return false;
  if (task.pathway === 'yki' && !['practice', 'mock', 'full_exam'].includes(task.ykiMode ?? '')) return false;
  if (task.pathway !== 'yki' && task.ykiMode !== undefined) return false;
  return true;
}

function duplicatedTaskIds(candidates: readonly TaskDescriptor[]): ReadonlySet<string> {
  const counts = new Map<string, number>();
  candidates.forEach((task) => {
    if (typeof task?.taskId !== 'string') return;
    const taskId = task.taskId.trim();
    if (!taskId) return;
    counts.set(taskId, (counts.get(taskId) ?? 0) + 1);
  });

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([taskId]) => taskId),
  );
}

function matchingEvidence(input: PracticeComposerInput, task: TaskDescriptor): DurablePracticeEvidence[] {
  return (input.evidence ?? []).filter((item) => {
    if (!isUsableEvidence(input, item)) return false;
    if (item.taskId && item.taskId === task.taskId) return true;
    if (item.skill && task.skills.includes(item.skill)) return true;
    return false;
  });
}

function hasRecentTaskRepetition(input: PracticeComposerInput, task: TaskDescriptor): boolean {
  return (input.evidence ?? []).some((item) => (
    isUsableEvidence(input, item)
    && item.taskId === task.taskId
    && item.recentlyPracticed === true
  ));
}

function filterTask(
  input: PracticeComposerInput,
  task: TaskDescriptor,
  duplicateTaskIds: ReadonlySet<string>,
): PracticeFilterCode | null {
  if (!validDescriptor(task)) return 'invalid_descriptor';
  if (duplicateTaskIds.has(task.taskId.trim())) return 'duplicate_task_id';
  if (input.excludedTaskIds?.includes(task.taskId)) return 'explicitly_excluded';
  if (input.scope !== 'all' && task.pathway !== input.scope) return 'scope_mismatch';

  const entitlementSet = new Set(input.entitlements);
  if (task.requiredEntitlements.some((key) => !entitlementSet.has(key))) return 'missing_entitlement';

  if (task.profession && (!input.profession || task.profession !== input.profession)) {
    return 'profession_mismatch';
  }

  if (input.allowedLevelBands?.length && !input.allowedLevelBands.includes(task.levelBand)) {
    return 'level_mismatch';
  }

  const prerequisiteSet = new Set(input.completedPrerequisites ?? []);
  if (task.prerequisites?.some((key) => !prerequisiteSet.has(key))) return 'missing_prerequisite';

  if (task.health === 'unavailable') return 'unavailable';
  if (task.health === 'degraded' && !input.allowDegraded) return 'degraded_excluded';

  if (task.featureFlag && !(input.enabledFeatureFlags ?? []).includes(task.featureFlag)) {
    return 'feature_disabled';
  }

  if (task.modality.microphone && !input.modalities.microphone) return 'microphone_unavailable';
  if (task.modality.audio && !input.modalities.audio) return 'audio_unavailable';
  if (task.modality.keyboard && !input.modalities.keyboard) return 'keyboard_unavailable';

  if (task.estimatedMinutes > schedulingBudget(input)) return 'time_budget';
  if (hasRecentTaskRepetition(input, task)) return 'recent_repetition';
  if (task.pathway === 'yki' && task.ykiMode !== 'practice') return 'yki_mode_boundary';

  return null;
}

function evidenceScores(input: PracticeComposerInput, task: TaskDescriptor) {
  return matchingEvidence(input, task).reduce(
    (acc, item) => ({
      overdue: Math.max(acc.overdue, clamp01(item.overdueNeed)),
      weakness: Math.max(acc.weakness, clamp01(item.weaknessNeed)),
      goal: Math.max(acc.goal, clamp01(item.goalRelevance)),
      novelty: Math.max(acc.novelty, clamp01(item.novelty)),
    }),
    { overdue: 0, weakness: 0, goal: 0, novelty: 0 },
  );
}

function skillBalanceScore(task: TaskDescriptor, skillCounts: Map<LearningSkill, number>): number {
  const leastPracticed = Math.min(...task.skills.map((skill) => skillCounts.get(skill) ?? 0));
  return 1 / (1 + leastPracticed);
}

function timeFitScore(task: TaskDescriptor, remainingMinutes: number): number {
  if (remainingMinutes <= 0 || task.estimatedMinutes > remainingMinutes) return 0;
  return 1 - Math.abs(remainingMinutes - task.estimatedMinutes) / remainingMinutes;
}

function scoreTask(
  input: PracticeComposerInput,
  task: TaskDescriptor,
  remainingMinutes: number,
  skillCounts: Map<LearningSkill, number>,
  activeContextId?: string,
) {
  const evidence = evidenceScores(input, task);
  const balance = skillBalanceScore(task, skillCounts);
  const timeFit = timeFitScore(task, remainingMinutes);
  const contextMatches = Boolean(task.contextId && activeContextId && task.contextId === activeContextId);

  const weighted =
    evidence.overdue * 0.3 +
    evidence.weakness * 0.25 +
    evidence.goal * 0.15 +
    balance * 0.15 +
    evidence.novelty * 0.1 +
    timeFit * 0.05 +
    (contextMatches ? PRACTICE_CONTEXT_COHERENCE_BONUS : 0);

  return { weighted, evidence, balance, timeFit, contextMatches };
}

function buildReasons(
  task: TaskDescriptor,
  score: ReturnType<typeof scoreTask>,
): PracticeSelectionReason[] {
  const reasons: PracticeSelectionReason[] = [];

  if (score.evidence.overdue > 0) {
    reasons.push({ code: 'overdue_review', message: 'This review is due based on your saved practice evidence.', evidenceMode: 'learner' });
  }
  if (score.evidence.weakness > 0) {
    reasons.push({ code: 'evidence_need', message: 'Saved practice evidence gives this skill extra review priority.', evidenceMode: 'learner' });
  }
  if (score.evidence.goal > 0) {
    reasons.push({ code: 'goal_relevance', message: 'This task matches a goal recorded in your learning evidence.', evidenceMode: 'learner' });
  }
  if (score.evidence.novelty > 0) {
    reasons.push({ code: 'novelty', message: 'This adds variety based on your saved practice history.', evidenceMode: 'learner' });
  }
  if (score.contextMatches && task.contextId) {
    reasons.push({ code: 'context_coherence', message: 'This continues the same learning context.', evidenceMode: 'curriculum' });
  }

  reasons.push({
    code: 'skill_balance',
    message: `This helps balance ${task.skills.join(' and ')} in this session.`,
    evidenceMode: 'curriculum',
  });

  if (score.timeFit > 0) {
    reasons.push({
      code: 'time_fit',
      message: `This ${task.estimatedMinutes}-minute task fits the remaining session time.`,
      evidenceMode: 'curriculum',
    });
  }

  return reasons;
}

export function composePracticeSession(input: PracticeComposerInput): PracticeComposition {
  const diagnostics: PracticeFilterDiagnostic[] = [];
  const duplicateTaskIds = duplicatedTaskIds(input.candidates);
  const eligible = input.candidates.filter((task) => {
    const code = filterTask(input, task, duplicateTaskIds);
    if (code) {
      diagnostics.push({
        taskId: typeof task?.taskId === 'string' && task.taskId ? task.taskId : '<invalid-task>',
        code,
      });
    }
    return code === null;
  });

  const selected: PracticeSessionManifest['tasks'] = [];
  const remaining = new Map(eligible.map((task) => [task.taskId, task] as const));
  const skillCounts = new Map<LearningSkill, number>();
  const budget = schedulingBudget(input);
  let remainingMinutes = budget;
  let activeContextId = input.preferredContextId;

  while (remainingMinutes > 0 && remaining.size > 0) {
    const ranked = [...remaining.values()]
      .filter((task) => task.estimatedMinutes <= remainingMinutes)
      .map((task) => ({
        task,
        score: scoreTask(input, task, remainingMinutes, skillCounts, activeContextId),
      }))
      .sort((left, right) => {
        const scoreDifference = right.score.weighted - left.score.weighted;
        if (Math.abs(scoreDifference) > 1e-9) return scoreDifference;
        const durationDifference = right.task.estimatedMinutes - left.task.estimatedMinutes;
        if (durationDifference !== 0) return durationDifference;
        return left.task.taskId.localeCompare(right.task.taskId);
      });

    const next = ranked[0];
    if (!next) break;

    selected.push({
      order: selected.length + 1,
      task: next.task,
      reasons: buildReasons(next.task, next.score),
    });

    remaining.delete(next.task.taskId);
    remainingMinutes -= next.task.estimatedMinutes;
    next.task.skills.forEach((skill) => skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1));
    activeContextId = next.task.contextId ?? activeContextId;
  }

  const fingerprint = stableInputFingerprint(input);
  const totalMinutes = budget - remainingMinutes;

  return {
    manifest: {
      schemaVersion: 'learning.v1',
      sessionId: `practice-${stableHash(`${fingerprint}|${selected.map((item) => item.task.taskId).join('|')}`)}`,
      learnerId: input.learnerId,
      createdAt: input.createdAt,
      scope: input.scope,
      targetMinutes: input.targetMinutes,
      tasks: selected,
      composerVersion: PRACTICE_COMPOSER_VERSION,
    },
    diagnostics,
    totalMinutes,
  };
}

function shorterTarget(target: PracticeTargetMinutes): PracticeTargetMinutes {
  if (target === 20) return 10;
  return 5;
}

export function recomposePracticeSession(
  input: PracticeComposerInput,
  action: PracticeRecomposeAction,
  currentTaskId?: string,
): PracticeComposition {
  const excluded = new Set(input.excludedTaskIds ?? []);
  if ((action === 'skip' || action === 'another') && currentTaskId) excluded.add(currentTaskId);
  const targetMinutes = action === 'shorter' ? shorterTarget(input.targetMinutes) : input.targetMinutes;

  return composePracticeSession({
    ...input,
    targetMinutes,
    availableMinutes: Math.min(input.availableMinutes ?? input.targetMinutes, targetMinutes),
    modalities: action === 'no_microphone'
      ? { ...input.modalities, microphone: false }
      : input.modalities,
    excludedTaskIds: [...excluded].sort(),
  });
}

export function summarizePracticeSession(
  manifest: PracticeSessionManifest,
  completedTaskIds: readonly string[],
  skippedTaskIds: readonly string[],
) {
  const completedSet = new Set(completedTaskIds);
  const skippedSet = new Set(skippedTaskIds);
  const completed = manifest.tasks.filter((item) => completedSet.has(item.task.taskId));
  const skipped = manifest.tasks.filter((item) => skippedSet.has(item.task.taskId));
  const skills = [...new Set(completed.flatMap((item) => item.task.skills))].sort();
  const pathways = [...new Set(completed.map((item) => item.task.pathway))].sort();

  return {
    completedCount: completed.length,
    skippedCount: skipped.length,
    skills,
    pathways,
    message: completed.length
      ? `You practiced ${skills.join(', ')} across ${pathways.join(', ')}.`
      : 'No tasks were completed in this session.',
  };
}
