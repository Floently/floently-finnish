import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type {
  LearningPathway,
  LearningSkill,
  PracticeScope,
  TaskDescriptor,
} from '@core/schemas/learning';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import {
  PathwayBadge,
  PracticeProgressPath,
  ReducedMotionAwareMotion,
  SemanticFeedback,
  SkillBadge,
  type PracticePathNode,
} from '@ui/learningExperience';
import Card from '@ui/primitives/Card';
import Stack from '@ui/primitives/Stack';
import Text from '@ui/primitives/Text';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { useAuthStore } from '../../state/authStore';
import { usePreferencesStore } from '../../state/preferencesStore';
import { useSubscriptionStore } from '../../state/subscriptionStore';
import {
  composePracticeSession,
  type PracticeComposerInput,
  type PracticeTargetMinutes,
} from './composer';
import { formatPracticeSkills } from './fixtureRegistry';
import {
  findIntegratedPracticeEntry,
  getIntegratedPracticeEntries,
  getIntegratedPracticeTaskLabel,
} from './integratedRegistry';
import {
  ActionButton,
  ChoiceChip,
  practiceLayoutStyles,
} from './PracticeControls';

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
};

type SessionPhase = 'setup' | 'active' | 'summary';
type SessionHistoryStep = {
  task: TaskDescriptor;
  state: 'complete' | 'skipped';
};

const TARGETS: readonly PracticeTargetMinutes[] = [5, 10, 20];
const SCOPES: readonly { value: PracticeScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'everyday', label: 'Everyday' },
  { value: 'professional', label: 'Professional' },
  { value: 'yki', label: 'YKI' },
];
const PROFESSION_KEYS = ['doctor', 'nurse', 'practical_nurse'] as const;

function buildEntitlementKeys(
  status: ReturnType<typeof useSubscriptionStore.getState>['status'],
): string[] {
  if (!status) return [];

  const result: string[] = [];
  if (status.isInternalAllAccess || status.entitlements.learnAccess) result.push('learnAccess');
  if (status.isInternalAllAccess || status.entitlements.professionalAccess) result.push('professionalAccess');
  if (status.isInternalAllAccess || status.entitlements.ykiAccess) result.push('ykiAccess');

  const professions = status.isInternalAllAccess
    ? PROFESSION_KEYS
    : status.entitlements.professions;
  professions.forEach((profession) => result.push(`profession:${profession}`));

  return [...new Set(result)].sort();
}

function activeProfession(
  status: ReturnType<typeof useSubscriptionStore.getState>['status'],
): string | undefined {
  const context = status?.entitlements.activeContext;
  if (context === 'doctor' || context === 'nurse' || context === 'practical_nurse') {
    return context;
  }
  return status?.entitlements.professions[0];
}

function shorterTarget(target: PracticeTargetMinutes): PracticeTargetMinutes {
  return target === 20 ? 10 : 5;
}

function formatPathway(pathway: LearningPathway): string {
  return pathway === 'yki' ? 'YKI' : pathway.charAt(0).toUpperCase() + pathway.slice(1);
}

function practicedSummary(history: readonly SessionHistoryStep[]) {
  const completed = history.filter((step) => step.state === 'complete');
  return {
    completed,
    skippedCount: history.length - completed.length,
    skills: [...new Set(completed.flatMap(({ task }) => task.skills))].sort(),
    pathways: [...new Set(completed.map(({ task }) => task.pathway))].sort(),
  };
}

export default function IntegratedPracticeRoute({ onBack, onOpenMenu }: Props) {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const user = useAuthStore((state) => state.user);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const palette = useMemo(() => getFloentlyPalette(themeMode), [themeMode]);

  const [scope, setScope] = useState<PracticeScope>('all');
  const [targetMinutes, setTargetMinutes] = useState<PracticeTargetMinutes>(10);
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true);
  const [history, setHistory] = useState<SessionHistoryStep[]>([]);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [whyOpen, setWhyOpen] = useState(false);

  const entitlementKeys = useMemo(
    () => buildEntitlementKeys(subscriptionStatus),
    [subscriptionStatus],
  );
  const profession = useMemo(
    () => activeProfession(subscriptionStatus),
    [subscriptionStatus],
  );
  const practiceEntries = useMemo(
    () => getIntegratedPracticeEntries(profession),
    [profession],
  );
  const excludedTaskIds = useMemo(
    () => [...new Set([
      ...history.map(({ task }) => task.taskId),
      ...dismissedTaskIds,
    ])].sort(),
    [dismissedTaskIds, history],
  );
  const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);

  const composerInput = useMemo<PracticeComposerInput>(() => ({
    learnerId: user?.id ?? 'practice-local-session',
    createdAt,
    scope,
    targetMinutes,
    availableMinutes: phase === 'setup' ? targetMinutes : remainingMinutes,
    candidates: practiceEntries.map((entry) => entry.descriptor),
    entitlements: entitlementKeys,
    profession,
    modalities: {
      audio: true,
      microphone: microphoneAvailable,
      keyboard: true,
    },
    excludedTaskIds,
    // Durable learner evidence remains server-owned. Until a reviewed authenticated
    // client API is wired, selection reasons stay explicitly curriculum-based.
    evidence: [],
  }), [
    createdAt,
    entitlementKeys,
    excludedTaskIds,
    microphoneAvailable,
    phase,
    practiceEntries,
    profession,
    remainingMinutes,
    scope,
    targetMinutes,
    user?.id,
  ]);

  const composition = useMemo(() => composePracticeSession(composerInput), [composerInput]);
  const current = composition.manifest.tasks[0];
  const upcoming = composition.manifest.tasks.slice(1);
  const summary = useMemo(() => practicedSummary(history), [history]);

  const progressNodes = useMemo<PracticePathNode[]>(() => {
    const finished: PracticePathNode[] = history.map((step, index) => ({
      id: `history-${index}-${step.task.taskId}`,
      label: getIntegratedPracticeTaskLabel(practiceEntries, step.task.taskId),
      skill: step.task.skills[0] ?? 'vocabulary',
      state: step.state,
    }));
    const active: PracticePathNode[] = current ? [{
      id: `current-${current.task.taskId}`,
      label: getIntegratedPracticeTaskLabel(practiceEntries, current.task.taskId),
      skill: current.task.skills[0] ?? 'vocabulary',
      state: 'current',
    }] : [];
    const pending: PracticePathNode[] = upcoming.map((item, index) => ({
      id: `pending-${index}-${item.task.taskId}`,
      label: getIntegratedPracticeTaskLabel(practiceEntries, item.task.taskId),
      skill: item.task.skills[0] ?? 'vocabulary',
      state: 'pending',
    }));
    return [...finished, ...active, ...pending];
  }, [current, history, practiceEntries, upcoming]);

  const resetSession = () => {
    setPhase('setup');
    setCreatedAt(new Date().toISOString());
    setMicrophoneAvailable(true);
    setHistory([]);
    setDismissedTaskIds([]);
    setElapsedMinutes(0);
    setWhyOpen(false);
  };

  const startSession = () => {
    setCreatedAt(new Date().toISOString());
    setHistory([]);
    setDismissedTaskIds([]);
    setElapsedMinutes(0);
    setWhyOpen(false);
    setPhase('active');
  };

  const finishCurrent = () => {
    if (!current) return;
    setHistory((items) => [...items, { task: current.task, state: 'complete' }]);
    const nextElapsed = elapsedMinutes + current.task.estimatedMinutes;
    setElapsedMinutes(nextElapsed);
    setWhyOpen(false);
    if (nextElapsed >= targetMinutes) setPhase('summary');
  };

  const skipCurrent = () => {
    if (!current) return;
    setHistory((items) => [...items, { task: current.task, state: 'skipped' }]);
    setWhyOpen(false);
  };

  const anotherTask = () => {
    if (!current) return;
    setDismissedTaskIds((ids) => [...ids, current.task.taskId]);
    setWhyOpen(false);
  };

  const makeShorter = () => {
    const nextTarget = shorterTarget(targetMinutes);
    setTargetMinutes(nextTarget);
    setWhyOpen(false);
    if (elapsedMinutes >= nextTarget) setPhase('summary');
  };

  const launchCurrent = () => {
    if (!current) return;
    const target = current.task.launch.params
      ? { pathname: current.task.launch.route, params: current.task.launch.params }
      : current.task.launch.route;
    router.push(target as never);
  };

  if (phase === 'summary') {
    return (
      <AppScaffold
        themeMode={themeMode}
        allowScroll
        header={
          <PageHeader
            eyebrow="Practice"
            title="Session summary"
            subtitle="This summary reports only what you marked as completed in this Practice session."
            actionLabel="Home"
            onActionPress={onBack}
            onMenuPress={onOpenMenu}
            themeMode={themeMode}
          />
        }
      >
        <Stack gap="md">
          <SemanticFeedback
            tone="success"
            title={`${summary.completed.length} completed`}
            message={`${summary.skippedCount} skipped for now. This local summary does not claim mastery or weakness.`}
            palette={palette}
          />
          <Card>
            <Stack gap="sm">
              <Text>
                {summary.skills.length
                  ? `Skills practiced: ${summary.skills.join(', ')}.`
                  : 'No skills were marked completed.'}
              </Text>
              <Text>
                {summary.pathways.length
                  ? `Pathways practiced: ${summary.pathways.map(formatPathway).join(', ')}.`
                  : 'No pathway completion was recorded.'}
              </Text>
            </Stack>
          </Card>
          <ActionButton label="Practice again" onPress={resetSession} />
          <ActionButton label="Back home" onPress={onBack} />
        </Stack>
      </AppScaffold>
    );
  }

  if (phase === 'setup') {
    const preview = composition.manifest.tasks;
    const firstReason = preview[0]?.reasons[0]?.message;
    const previewSkills = [...new Set(preview.flatMap((item) => item.task.skills))];

    return (
      <AppScaffold
        themeMode={themeMode}
        allowScroll
        header={
          <PageHeader
            eyebrow="Practice"
            title="Today’s practice"
            subtitle="Choose a time budget and pathway scope. Practice mixes the real learning runtimes that fit your access and current constraints."
            actionLabel="Home"
            onActionPress={onBack}
            onMenuPress={onOpenMenu}
            themeMode={themeMode}
          />
        }
      >
        <Stack gap="lg">
          <View style={styles.badgeRow}>
            {scope !== 'all' ? <PathwayBadge pathway={scope} palette={palette} /> : null}
            {previewSkills.map((skill) => <SkillBadge key={skill} skill={skill} palette={palette} compact />)}
          </View>

          <Card>
            <Stack gap="md">
              <Text variant="title">How long?</Text>
              <View style={practiceLayoutStyles.choices}>
                {TARGETS.map((minutes) => (
                  <ChoiceChip
                    key={minutes}
                    label={`${minutes} min`}
                    selected={minutes === targetMinutes}
                    accessibilityLabel={`${minutes} minute practice session`}
                    onPress={() => setTargetMinutes(minutes)}
                  />
                ))}
              </View>
              <Text variant="caption" tone="muted">Time is a limit, not a target to pad. A session may finish early.</Text>
            </Stack>
          </Card>

          <Card>
            <Stack gap="md">
              <Text variant="title">What should it include?</Text>
              <View style={practiceLayoutStyles.choices}>
                {SCOPES.map((item) => (
                  <ChoiceChip
                    key={item.value}
                    label={item.label}
                    selected={scope === item.value}
                    accessibilityLabel={`${item.label} practice scope`}
                    onPress={() => setScope(item.value)}
                  />
                ))}
              </View>
            </Stack>
          </Card>

          <ReducedMotionAwareMotion kind="task-enter">
            <Card>
              <Stack gap="sm">
                <Text variant="title">Preview</Text>
                {preview.length ? (
                  <>
                    <Text>{preview.map((item) => formatPracticeSkills(item.task.skills)).join(' → ')}</Text>
                    <Text tone="muted">{composition.totalMinutes} minutes planned</Text>
                    <Text variant="caption">Why these tasks?</Text>
                    <Text tone="muted">{firstReason ?? 'The session uses curriculum-safe balance and the time you selected.'}</Text>
                  </>
                ) : (
                  <Text tone="muted">No compatible tasks are available. Practice will not inject an unavailable, unauthorized, wrong-profession, or incompatible task to fill time.</Text>
                )}
              </Stack>
            </Card>
          </ReducedMotionAwareMotion>

          <ActionButton label="Start today’s practice" disabled={!preview.length} onPress={startSession} />
        </Stack>
      </AppScaffold>
    );
  }

  if (!current) {
    return (
      <AppScaffold
        themeMode={themeMode}
        allowScroll
        header={
          <PageHeader
            eyebrow="Practice"
            title="Session complete"
            subtitle="There are no more compatible tasks inside the remaining time and current constraints."
            actionLabel="Home"
            onActionPress={onBack}
            onMenuPress={onOpenMenu}
            themeMode={themeMode}
          />
        }
      >
        <Stack gap="md">
          <SemanticFeedback
            tone="info"
            title="No more compatible tasks"
            message={`${summary.completed.length} completed · ${summary.skippedCount} skipped.`}
            palette={palette}
          />
          <ActionButton label="See session summary" onPress={() => setPhase('summary')} />
          <ActionButton label="Practice again" onPress={resetSession} />
        </Stack>
      </AppScaffold>
    );
  }

  const entry = findIntegratedPracticeEntry(practiceEntries, current.task.taskId);

  return (
    <AppScaffold
      themeMode={themeMode}
      allowScroll
      header={
        <PageHeader
          eyebrow={`${formatPathway(current.task.pathway)} · ${formatPracticeSkills(current.task.skills)}`}
          title="Practice"
          subtitle={`${remainingMinutes} minutes available · one task at a time`}
          actionLabel="End session"
          onActionPress={() => setPhase('summary')}
          onMenuPress={onOpenMenu}
          themeMode={themeMode}
        />
      }
    >
      <Stack gap="lg">
        <View style={styles.badgeRow}>
          <PathwayBadge pathway={current.task.pathway} palette={palette} />
          {current.task.skills.map((skill: LearningSkill) => (
            <SkillBadge key={skill} skill={skill} palette={palette} compact />
          ))}
        </View>

        <PracticeProgressPath nodes={progressNodes} palette={palette} />

        <ReducedMotionAwareMotion key={current.task.taskId} kind="next-task">
          <TaskCard
            themeMode={themeMode}
            accent={current.task.pathway === 'yki' ? 'yellow' : 'blue'}
            title={entry?.title ?? getIntegratedPracticeTaskLabel(practiceEntries, current.task.taskId)}
            detail={entry?.summary ?? 'Open the canonical task runtime.'}
            meta={`${current.task.estimatedMinutes} min · ${formatPracticeSkills(current.task.skills)}`}
            actionLabel="Open task"
            onPress={launchCurrent}
          />
        </ReducedMotionAwareMotion>

        <Card>
          <Stack gap="sm">
            <ActionButton label="Why these tasks?" onPress={() => setWhyOpen((value) => !value)} />
            {whyOpen ? (
              <SemanticFeedback
                tone="info"
                title="Why this task is here"
                message={current.reasons.map((reason) => reason.message).join(' ')}
                palette={palette}
              />
            ) : (
              <Text tone="muted">Open to see the actual selection reasons.</Text>
            )}
          </Stack>
        </Card>

        <Card>
          <Stack gap="sm">
            <Text variant="title">Session controls</Text>
            <View style={practiceLayoutStyles.actionGrid}>
              <ActionButton label="Skip for now" onPress={skipCurrent} />
              <ActionButton label="Give me another task" onPress={anotherTask} />
              <ActionButton
                label="No microphone right now"
                disabled={!microphoneAvailable}
                onPress={() => {
                  setMicrophoneAvailable(false);
                  setWhyOpen(false);
                }}
              />
              <ActionButton label="Make it shorter" disabled={targetMinutes === 5} onPress={makeShorter} />
            </View>
          </Stack>
        </Card>

        <Card>
          <Stack gap="sm">
            <Text variant="title">After you return</Text>
            <Text tone="muted">Marking this task finished advances only this local Practice shell. The canonical runtime remains responsible for its real task result and durable learning evidence.</Text>
            <ActionButton label="I finished this task" onPress={finishCurrent} />
          </Stack>
        </Card>
      </Stack>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
});
