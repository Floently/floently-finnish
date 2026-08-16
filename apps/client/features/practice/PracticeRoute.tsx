import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
} from 'react-native';
import { router } from 'expo-router';

import type {
  LearningPathway,
  LearningSkill,
  PracticeScope,
  PracticeSessionTask,
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

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
};

type SessionPhase = 'setup' | 'active' | 'summary';

type CompletedTask = {
  task: TaskDescriptor;
};

const TARGETS: readonly PracticeTargetMinutes[] = [5, 10, 20];
const SCOPES: readonly { value: PracticeScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'everyday', label: 'Everyday' },
  { value: 'professional', label: 'Professional' },
  { value: 'yki', label: 'YKI' },
];

function ChoiceChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="body" style={selected ? styles.choiceTextSelected : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  role = 'button',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  role?: AccessibilityRole;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

function buildEntitlementKeys(
  status: ReturnType<typeof useSubscriptionStore.getState>['status'],
): string[] {
  if (!status) return [];
  if (status.isInternalAllAccess) return ['learn', 'professional', 'yki'];

  const result: string[] = [];
  if (status.entitlements.learnAccess) result.push('learn');
  if (status.entitlements.professionalAccess) result.push('professional');
  if (status.entitlements.ykiAccess) result.push('yki');
  return result;
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

function SessionPath({
  completedCount,
  current,
  upcoming,
}: {
  completedCount: number;
  current?: PracticeSessionTask;
  upcoming: readonly PracticeSessionTask[];
}) {
  const labels = [
    ...Array.from({ length: completedCount }, (_, index) => `✓ ${index + 1}`),
    ...(current ? [`Now · ${formatPracticeSkills(current.task.skills)}`] : []),
    ...upcoming.map((item) => `Next · ${formatPracticeSkills(item.task.skills)}`),
  ];

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Practice path. ${labels.join('. ')}`}
      style={styles.path}
    >
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.pathNode}>
          <Text variant="caption">{label}</Text>
        </View>
      ))}
    </View>
  );
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
    // Until Agent B is integrated this surface intentionally supplies no
    // learner evidence, so all recommendation language stays curriculum-safe.
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

  const composition = useMemo(
    () => composePracticeSession(composerInput),
    [composerInput],
  );

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

  const disableMicrophone = () => {
    setMicrophoneAvailable(false);
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
            subtitle="Choose a time budget and pathway scope. Practice will orchestrate existing learning tools, not create a new pathway."
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
              <View style={styles.choices}>
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
              <View style={styles.choices}>
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

          {preview.length ? (
            <Card>
              <Stack gap="sm">
                <Text variant="title">Preview</Text>
                <Text>{preview.map((item) => formatPracticeSkills(item.task.skills)).join(' → ')}</Text>
                <Text tone="muted">{composition.totalMinutes} minutes planned</Text>
                <Text variant="caption">Why these tasks?</Text>
                <Text tone="muted">
                  {firstReason ?? 'The session uses curriculum-safe balance and the time you selected.'}
                </Text>
              </Stack>
            </Card>
          ) : (
            <Card>
              <Stack gap="sm">
                <Text variant="title">No compatible tasks right now</Text>
                <Text tone="muted">
                  Practice will not insert an unavailable, unauthorized, wrong-profession, or incompatible task just to fill time.
                </Text>
              </Stack>
            </Card>
          )}

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
          <Text accessibilityLiveRegion="polite">
            {completed.length} tasks completed · {skippedTaskIds.length} skipped.
          </Text>
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
        <SessionPath
          completedCount={completed.length}
          current={current}
          upcoming={upcoming}
        />

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
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: whyOpen }}
              onPress={() => setWhyOpen((value) => !value)}
            >
              <Text variant="title">Why these tasks?</Text>
            </Pressable>
            {whyOpen ? current.reasons.map((reason) => (
              <Text key={`${reason.code}-${reason.message}`} tone="muted">
                • {reason.message}
              </Text>
            )) : (
              <Text tone="muted">Open to see the actual selection reasons.</Text>
            )}
          </Stack>
        </Card>

        <Card>
          <Stack gap="sm">
            <Text variant="title">Session controls</Text>
            <View style={styles.actionGrid}>
              <ActionButton label="Skip for now" onPress={skipCurrent} />
              <ActionButton label="Give me another task" onPress={anotherTask} />
              <ActionButton
                label="No microphone right now"
                disabled={!microphoneAvailable}
                onPress={disableMicrophone}
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
              Marking this task finished only advances this local Practice shell. The canonical runtime remains responsible for its real task result and learning evidence.
            </Text>
            <ActionButton label="I finished this task" onPress={finishCurrent} />
          </Stack>
        </Card>

        <Text accessibilityLiveRegion="polite" style={styles.statusText}>
          Task {completed.length + skippedTaskIds.length + 1}. {getPracticeTaskLabel(current.task.taskId)}.
        </Text>
      </Stack>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choice: {
    borderWidth: 1,
    borderColor: '#8EA3C3',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: '#21365D',
    borderColor: '#21365D',
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
  path: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pathNode: {
    borderWidth: 1,
    borderColor: '#B9C6D8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionGrid: {
    gap: 10,
  },
  action: {
    borderWidth: 1,
    borderColor: '#8EA3C3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  statusText: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
