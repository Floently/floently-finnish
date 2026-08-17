import React, { useMemo, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { router } from 'expo-router';

import type {
  LearningPathway,
  LearningSkill,
  PracticeScope,
  TaskDescriptor,
} from '@core/schemas/learning';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import Card from '@ui/primitives/Card';
import Stack from '@ui/primitives/Stack';
import Text from '@ui/primitives/Text';

import { useAuthStore } from '../../state/authStore';
import { usePreferencesStore } from '../../state/preferencesStore';
import { useSubscriptionStore } from '../../state/subscriptionStore';
import {
  composePracticeSession,
  type PracticeComposerInput,
  type PracticeTargetMinutes,
} from './composer';
import {
  PRACTICE_FIXTURES,
  formatPracticeSkills,
  getPracticeFixture,
  getPracticeTaskLabel,
} from './fixtureRegistry';
import {
  ActionButton,
  ChoiceChip,
  SessionPath,
  practiceLayoutStyles,
} from './PracticeControls';

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
};

type SessionPhase = 'setup' | 'active' | 'summary';
type CompletedTask = { task: TaskDescriptor };

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
  if (target === 20) return 10;
  return 5;
}

function practicedSummary(completed: readonly CompletedTask[]) {
  const skills = [...new Set(completed.flatMap(({ task }) => task.skills))].sort();
  const pathways = [...new Set(completed.map(({ task }) => task.pathway))].sort();
  return { skills, pathways };
}

function formatPathway(pathway: LearningPathway): string {
  if (pathway === 'yki') return 'YKI';
  return pathway.charAt(0).toUpperCase() + pathway.slice(1);
}

export default function PracticeRoute({ onBack, onOpenMenu }: Props) {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const user = useAuthStore((state) => state.user);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);

  const [scope, setScope] = useState<PracticeScope>('all');
  const [targetMinutes, setTargetMinutes] = useState<PracticeTargetMinutes>(10);
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true);
  const [completed, setCompleted] = useState<CompletedTask[]>([]);
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([]);
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
  const excludedTaskIds = useMemo(
    () => [...new Set([
      ...completed.map(({ task }) => task.taskId),
      ...skippedTaskIds,
      ...dismissedTaskIds,
    ])].sort(),
    [completed, dismissedTaskIds, skippedTaskIds],
  );
  const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);

  const composerInput = useMemo<PracticeComposerInput>(() => ({
    learnerId: user?.id ?? 'practice-local-session',
    createdAt,
    scope,
    targetMinutes,
    availableMinutes: phase === 'setup' ? targetMinutes : remainingMinutes,
    candidates: PRACTICE_FIXTURES.map((fixture) => fixture.descriptor),
    entitlements: entitlementKeys,
    profession,
    modalities: {
      audio: true,
      microphone: microphoneAvailable,
      keyboard: true,
    },
    excludedTaskIds,
    // Agent B owns durable evidence integration. Until that adapter lands,
    // this route stays explicitly curriculum-only.
    evidence: [],
  }), [
    createdAt,
    entitlementKeys,
    excludedTaskIds,
    microphoneAvailable,
    phase,
    profession,
    remainingMinutes,
    scope,
    targetMinutes,
    user?.id,
  ]);

  const composition = useMemo(() => composePracticeSession(composerInput), [composerInput]);
  const current = composition.manifest.tasks[0];
  const upcoming = composition.manifest.tasks.slice(1);
  const summary = useMemo(() => practicedSummary(completed), [completed]);

  const resetSession = () => {
    setPhase('setup');
    setCreatedAt(new Date().toISOString());
    setMicrophoneAvailable(true);
    setCompleted([]);
    setSkippedTaskIds([]);
    setDismissedTaskIds([]);
    setElapsedMinutes(0);
    setWhyOpen(false);
  };

  const startSession = () => {
    setCreatedAt(new Date().toISOString());
    setCompleted([]);
    setSkippedTaskIds([]);
    setDismissedTaskIds([]);
    setElapsedMinutes(0);
    setWhyOpen(false);
    setPhase('active');
  };

  const finishCurrent = () => {
    if (!current) return;
    setCompleted((items) => [...items, { task: current.task }]);
    const nextElapsed = elapsedMinutes + current.task.estimatedMinutes;
    setElapsedMinutes(nextElapsed);
    setWhyOpen(false);
    if (nextElapsed >= targetMinutes) setPhase('summary');
  };

  const skipCurrent = () => {
    if (!current) return;
    setSkippedTaskIds((ids) => [...ids, current.task.taskId]);
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
          <Card>
            <Stack gap="sm">
              <Text variant="title">{completed.length} completed</Text>
              <Text tone="muted">{skippedTaskIds.length} skipped for now</Text>
              <Text>
                {summary.skills.length
                  ? `Skills practiced: ${summary.skills.map((skill: LearningSkill) => skill).join(', ')}.`
                  : 'No skills were marked completed.'}
              </Text>
              <Text>
                {summary.pathways.length
                  ? `Pathways practiced: ${summary.pathways.map(formatPathway).join(', ')}.`
                  : 'No pathway completion was recorded.'}
              </Text>
              <Text tone="muted">
                Practice does not turn this local summary into mastery, weakness, or overdue evidence.
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

    return (
      <AppScaffold
        themeMode={themeMode}
        allowScroll
        header={
          <PageHeader
            eyebrow="Practice"
            title="Today’s practice"
            subtitle="Choose a time budget and pathway scope. Practice orchestrates existing learning tools; it is not a new pathway."
            actionLabel="Home"
            onActionPress={onBack}
            onMenuPress={onOpenMenu}
            themeMode={themeMode}
          />
        }
      >
        <Stack gap="lg">
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
              <Text variant="caption" tone="muted">
                Time is a limit, not a target to pad. A session may finish early.
              </Text>
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

          <Card>
            <Stack gap="sm">
              <Text variant="title">Preview</Text>
              {preview.length ? (
                <>
                  <Text>{preview.map((item) => formatPracticeSkills(item.task.skills)).join(' → ')}</Text>
                  <Text tone="muted">{composition.totalMinutes} minutes planned</Text>
                  <Text variant="caption">Why these tasks?</Text>
                  <Text tone="muted">
                    {firstReason ?? 'The session uses curriculum-safe balance and the time you selected.'}
                  </Text>
                </>
              ) : (
                <Text tone="muted">
                  No compatible tasks are available. Practice will not inject an unavailable, unauthorized, wrong-profession, or incompatible task to fill time.
                </Text>
              )}
            </Stack>
          </Card>

          <ActionButton
            label="Start today’s practice"
            disabled={!preview.length}
            onPress={startSession}
          />
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
          <View accessibilityLiveRegion="polite">
            <Text>{completed.length} tasks completed · {skippedTaskIds.length} skipped.</Text>
          </View>
          <ActionButton label="See session summary" onPress={() => setPhase('summary')} />
          <ActionButton label="Practice again" onPress={resetSession} />
        </Stack>
      </AppScaffold>
    );
  }

  const fixture = getPracticeFixture(current.task.taskId);

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
        <SessionPath completedCount={completed.length} current={current} upcoming={upcoming} />

        <TaskCard
          themeMode={themeMode}
          accent={current.task.pathway === 'yki' ? 'yellow' : 'blue'}
          title={fixture?.title ?? getPracticeTaskLabel(current.task.taskId)}
          detail={fixture?.summary ?? 'Open the canonical task runtime.'}
          meta={`${current.task.estimatedMinutes} min · ${formatPracticeSkills(current.task.skills)}`}
          actionLabel="Open task"
          onPress={launchCurrent}
        />

        <Card>
          <Stack gap="sm">
            <ActionButton label="Why these tasks?" onPress={() => setWhyOpen((value) => !value)} />
            {whyOpen ? current.reasons.map((reason) => (
              <Text key={`${reason.code}-${reason.message}`} tone="muted">• {reason.message}</Text>
            )) : (
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
              <ActionButton
                label="Make it shorter"
                disabled={targetMinutes === 5}
                onPress={makeShorter}
              />
            </View>
          </Stack>
        </Card>

        <Card>
          <Stack gap="sm">
            <Text variant="title">After you return</Text>
            <Text tone="muted">
              Marking this task finished only advances this local Practice shell. The canonical runtime remains responsible for its real task result and durable learning evidence.
            </Text>
            <ActionButton label="I finished this task" onPress={finishCurrent} />
          </Stack>
        </Card>

        <RNText
          accessibilityLiveRegion="polite"
          style={practiceLayoutStyles.statusText}
        >
          Task {completed.length + skippedTaskIds.length + 1}. {getPracticeTaskLabel(current.task.taskId)}.
        </RNText>
      </Stack>
    </AppScaffold>
  );
}
