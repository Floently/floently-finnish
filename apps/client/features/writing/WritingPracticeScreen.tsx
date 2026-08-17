import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { LearningFocusSurface, PathwayBadge, SkillBadge } from '@ui/learningExperience';

import {
  beginRevision,
  beginWriting,
  buildWritingTaskResult,
  createAuthoredWritingEvaluator,
  createWritingSession,
  moveToPlanning,
  submitWriting,
  updateWritingDraft,
  updateWritingPlan,
  wordCount,
} from './engine';
import { tasksForPathway } from './tasks';
import { WritingFeedbackPanel } from './components/WritingFeedbackPanel';
import { usePreferencesStore } from '../../state/preferencesStore';
import type {
  WritingPathway,
  WritingProfession,
  WritingSession,
  WritingStage,
  WritingTask,
  WritingTaskResult,
} from './model';

type Props = {
  pathway: WritingPathway;
  profession?: WritingProfession | null;
  initialTaskId?: string | null;
  onExit: () => void;
  onResult?: (result: WritingTaskResult) => void;
};

const STAGES: Array<{ id: WritingStage; label: string }> = [
  { id: 'understand', label: 'Understand' },
  { id: 'plan', label: 'Plan' },
  { id: 'write', label: 'Write' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'revise', label: 'Revise' },
  { id: 'compare', label: 'Compare' },
];

function requiredInitialTask(tasks: WritingTask[], initialTaskId?: string | null): WritingTask {
  const task = tasks.find((item) => item.taskId === initialTaskId) ?? tasks[0];
  if (!task) throw new Error('NO_WRITING_TASKS_FOR_PATHWAY');
  return task;
}

function StagePath({ stage }: { stage: WritingStage }) {
  const currentIndex = STAGES.findIndex((item) => item.id === stage);
  return (
    <View accessibilityLabel={`Writing stage: ${STAGES[currentIndex]?.label ?? stage}`} style={styles.stagePath}>
      {STAGES.map((item, index) => {
        const current = index === currentIndex;
        const complete = index < currentIndex;
        return (
          <View key={item.id} style={[styles.stageChip, current && styles.stageChipCurrent, complete && styles.stageChipComplete]}>
            <Text style={[styles.stageChipText, (current || complete) && styles.stageChipTextActive]}>
              {complete ? '✓ ' : ''}{item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function TaskPicker({
  session,
  pathway,
  profession,
  onSelect,
}: {
  session: WritingSession;
  pathway: WritingPathway;
  profession?: WritingProfession | null;
  onSelect: (taskId: string) => void;
}) {
  const tasks = tasksForPathway(pathway, profession);
  return (
    <View style={styles.sectionCard}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Choose a task</Text>
      <Text style={styles.body}>Each task keeps the same revision loop. The situation, support, and register change with the level.</Text>
      <View style={styles.taskList}>
        {tasks.map((task) => {
          const selected = task.taskId === session.task.taskId;
          return (
            <Pressable
              key={task.taskId}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(task.taskId)}
              style={({ pressed }) => [styles.taskButton, selected && styles.taskButtonSelected, pressed && styles.pressed]}
            >
              <View style={styles.taskButtonTop}>
                <Text style={[styles.taskButtonTitle, selected && styles.taskButtonTitleSelected]}>{task.title}</Text>
                <Text style={styles.levelBadge}>{task.level}</Text>
              </View>
              <Text style={styles.taskButtonMeta}>{task.genre.replaceAll('_', ' ')} · {task.estimatedMinutes} min</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function UnderstandStep({ session, onContinue }: { session: WritingSession; onContinue: () => void }) {
  const task = session.task;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.eyebrow}>{task.pathway === 'professional' ? 'Professional Finnish' : 'Everyday Finnish'} · {task.level}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{task.title}</Text>
      <View style={styles.contextBlock}>
        <Text style={styles.contextLabel}>Situation</Text>
        <Text style={styles.contextText}>{task.situation}</Text>
      </View>
      <View style={styles.factRow}>
        <View style={styles.factItem}>
          <Text style={styles.contextLabel}>Audience</Text>
          <Text style={styles.body}>{task.audience}</Text>
        </View>
        <View style={styles.factItem}>
          <Text style={styles.contextLabel}>Register</Text>
          <Text style={styles.body}>{task.register.replaceAll('_', ' ')}</Text>
        </View>
      </View>
      <View style={styles.goalBlock}>
        <Text style={styles.contextLabel}>Your communicative goal</Text>
        <Text style={styles.goalText}>{task.communicativeGoal}</Text>
      </View>
      <Text style={styles.prompt}>{task.prompt}</Text>
      {task.privacyNotice ? <Text accessibilityRole="alert" style={styles.privacyNotice}>{task.privacyNotice}</Text> : null}
      <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
        <Text style={styles.primaryButtonText}>Plan my message</Text>
      </Pressable>
    </View>
  );
}

function PlanStep({
  session,
  onChange,
  onContinue,
}: {
  session: WritingSession;
  onChange: (promptId: string, value: string) => void;
  onContinue: () => void;
}) {
  const task = session.task;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.eyebrow}>Plan before drafting</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Collect the meaning first</Text>
      <Text style={styles.body}>Short notes are enough. These notes stay in this open practice with your draft.</Text>
      {task.scaffolding.planPrompts.map((item) => (
        <View key={item.id} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{item.prompt}</Text>
          <TextInput
            accessibilityLabel={item.prompt}
            value={session.plan[item.id] ?? ''}
            onChangeText={(value) => onChange(item.id, value)}
            placeholder={item.placeholder}
            placeholderTextColor="#7890B4"
            multiline
            style={styles.planInput}
          />
        </View>
      ))}
      {task.scaffolding.showPhraseBank ? (
        <View style={styles.phraseBank}>
          <Text accessibilityRole="header" style={styles.inputLabel}>Optional phrase support</Text>
          {task.scaffolding.phraseStarters.map((phrase) => (
            <Text key={phrase} selectable style={styles.phrase}>• {phrase}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.reducedSupport}>At {task.level}, build the phrasing yourself. The planning questions remain available.</Text>
      )}
      <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
        <Text style={styles.primaryButtonText}>Write my draft</Text>
      </Pressable>
    </View>
  );
}

function RevisionFocus({ session }: { session: WritingSession }) {
  if (session.stage !== 'revise' || !session.latestFeedback) return null;
  return (
    <View style={styles.revisionFocus}>
      <Text accessibilityRole="header" style={styles.inputLabel}>Keep these priorities in view</Text>
      {session.latestFeedback.priorities.length ? session.latestFeedback.priorities.map((priority, index) => (
        <Text key={priority.id} style={styles.retryLine}>{index + 1}. {priority.retryInstruction}</Text>
      )) : (
        <Text style={styles.retryLine}>Make one careful revision that improves clarity for your reader.</Text>
      )}
    </View>
  );
}

function DraftStep({
  session,
  submitting,
  onChange,
  onSubmit,
}: {
  session: WritingSession;
  submitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const revising = session.stage === 'revise';
  const count = wordCount(session.draft.text);
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.eyebrow}>{revising ? 'Targeted retry' : 'Your own Finnish'}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{revising ? 'Revise, do not replace' : 'Write the first draft'}</Text>
      <Text style={styles.body}>{session.task.prompt}</Text>
      <RevisionFocus session={session} />
      <TextInput
        accessibilityLabel="Finnish writing draft"
        accessibilityHint="Write and revise your own answer in Finnish"
        value={session.draft.text}
        onChangeText={onChange}
        multiline
        autoCapitalize="sentences"
        autoCorrect
        spellCheck
        textAlignVertical="top"
        placeholder="Kirjoita suomeksi…"
        placeholderTextColor="#7890B4"
        style={styles.draftInput}
      />
      <View style={styles.draftMetaRow}>
        <Text style={styles.wordCount}>{count} words · target {session.task.wordTarget.min}–{session.task.wordTarget.max}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.draftStatus}>{session.draft.statusMessage}</Text>
      </View>
      {session.evaluationError ? <Text accessibilityRole="alert" style={styles.errorText}>{session.evaluationError}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !session.draft.text.trim() || submitting }}
        disabled={!session.draft.text.trim() || submitting}
        onPress={onSubmit}
        style={({ pressed }) => [styles.primaryButton, (!session.draft.text.trim() || submitting) && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Checking…' : revising ? 'Resubmit my revision' : session.evaluationError ? 'Try feedback again' : 'Submit for focused feedback'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function WritingPracticeScreen({ pathway, profession, initialTaskId, onExit, onResult }: Props) {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const availableTasks = useMemo(() => tasksForPathway(pathway, profession), [pathway, profession]);
  const initialTask = useMemo(
    () => requiredInitialTask(availableTasks, initialTaskId),
    [availableTasks, initialTaskId],
  );
  const evaluator = useMemo(() => createAuthoredWritingEvaluator(), []);
  const [session, setSession] = useState(() => createWritingSession(initialTask, new Date().toISOString()));
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  function selectTask(taskId: string) {
    const nextTask = availableTasks.find((task) => task.taskId === taskId);
    if (!nextTask || nextTask.taskId === session.task.taskId) return;
    setSession(createWritingSession(nextTask, new Date().toISOString()));
  }

  async function handleSubmit() {
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      const sequence = session.attempts.length + 1;
      const next = await submitWriting(session, evaluator, {
        attemptId: `${session.task.taskId}.attempt.${sequence}`,
        submittedAt: new Date().toISOString(),
      });
      setSession(next);
      const result = buildWritingTaskResult(next);
      if (result) onResult?.(result);
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Leave Writing practice" onPress={onExit} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            <Text style={styles.headerIdentity}>{pathway === 'professional' ? 'Professional' : 'Everyday'} · Writing</Text>
          </View>

          <Text style={styles.eyebrow}>Understand · write · improve</Text>
          <Text accessibilityRole="header" style={styles.title}>Finnish Writing Studio</Text>
          <Text style={styles.subtitle}>You keep authorship. Feedback gives one or two priorities, then you revise your own text.</Text>

          <StagePath stage={session.stage} />

          <LearningFocusSurface mode="writing" palette={palette} levelBand={session.task.level}>
            <View style={styles.identityRow}>
              <PathwayBadge pathway={pathway === 'professional' ? 'professional' : 'everyday'} palette={palette} compact />
              <SkillBadge skill="writing" palette={palette} compact />
            </View>

          {session.stage === 'understand' ? (
            <>
              <TaskPicker session={session} pathway={pathway} profession={profession} onSelect={selectTask} />
              <UnderstandStep session={session} onContinue={() => setSession(moveToPlanning(session))} />
            </>
          ) : null}

          {session.stage === 'plan' ? (
            <PlanStep
              session={session}
              onChange={(promptId, value) => setSession(updateWritingPlan(session, promptId, value))}
              onContinue={() => setSession(beginWriting(session))}
            />
          ) : null}

          {session.stage === 'write' || session.stage === 'revise' ? (
            <DraftStep
              session={session}
              submitting={submitting}
              onChange={(value) => setSession(updateWritingDraft(session, value))}
              onSubmit={() => void handleSubmit()}
            />
          ) : null}

          {session.stage === 'feedback' || session.stage === 'compare' ? (
            <WritingFeedbackPanel session={session} onRevise={() => setSession(beginRevision(session))} />
          ) : null}
          </LearningFocusSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 80, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  backButton: { minHeight: 44, justifyContent: 'center', borderRadius: 999, backgroundColor: '#EAF0FF', paddingHorizontal: 16 },
  backButtonText: { color: '#2453D4', fontSize: 14, fontWeight: '800' },
  headerIdentity: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  eyebrow: { color: '#2DD4BF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: colors.text, ...typography.h1 },
  subtitle: { color: colors.textMuted, ...typography.bodySm, lineHeight: 22, maxWidth: 680 },
  identityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stagePath: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  stageChip: { minHeight: 32, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: '#263A5A', backgroundColor: '#101A30', paddingHorizontal: 11 },
  stageChipCurrent: { borderColor: '#5EEAD4', backgroundColor: '#113C38' },
  stageChipComplete: { borderColor: '#315F59', backgroundColor: '#102723' },
  stageChipText: { color: '#7890B4', fontSize: 11, fontWeight: '800' },
  stageChipTextActive: { color: '#D7FFF7' },
  sectionCard: { borderRadius: 24, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  taskList: { gap: 10 },
  taskButton: { minHeight: 72, borderRadius: 18, borderWidth: 1, borderColor: '#263A5A', backgroundColor: '#101A30', padding: 14, justifyContent: 'center', gap: 6 },
  taskButtonSelected: { borderColor: '#5EEAD4', backgroundColor: '#113C38' },
  taskButtonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  taskButtonTitle: { flex: 1, color: '#D6E2FF', fontSize: 15, lineHeight: 21, fontWeight: '800' },
  taskButtonTitleSelected: { color: '#FFFFFF' },
  taskButtonMeta: { color: '#8EA3C3', fontSize: 12, lineHeight: 18, textTransform: 'capitalize' },
  levelBadge: { color: '#5EEAD4', fontSize: 12, fontWeight: '900' },
  contextBlock: { borderRadius: 18, backgroundColor: '#101A30', padding: 15, gap: 7 },
  contextLabel: { color: '#2DD4BF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  contextText: { color: colors.text, fontSize: 15, lineHeight: 23 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factItem: { flexGrow: 1, flexBasis: 150, borderRadius: 16, borderWidth: 1, borderColor: '#263A5A', padding: 13, gap: 5 },
  goalBlock: { borderRadius: 18, backgroundColor: '#113C38', borderWidth: 1, borderColor: '#2F5C57', padding: 15, gap: 7 },
  goalText: { color: '#D7FFF7', fontSize: 15, lineHeight: 23, fontWeight: '700' },
  prompt: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700' },
  privacyNotice: { borderRadius: 14, backgroundColor: '#3A2A17', color: '#FFE1A8', padding: 12, fontSize: 13, lineHeight: 20 },
  inputGroup: { gap: 7 },
  inputLabel: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  planInput: { minHeight: 72, borderRadius: 16, borderWidth: 1, borderColor: '#263A5A', backgroundColor: '#0B1121', color: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  phraseBank: { borderRadius: 18, backgroundColor: '#101A30', padding: 14, gap: 7 },
  phrase: { color: '#D6E2FF', fontSize: 14, lineHeight: 21 },
  reducedSupport: { borderRadius: 14, borderWidth: 1, borderColor: '#263A5A', color: colors.textMuted, padding: 12, fontSize: 13, lineHeight: 20 },
  revisionFocus: { borderRadius: 18, backgroundColor: '#102723', borderWidth: 1, borderColor: '#315F59', padding: 14, gap: 8 },
  retryLine: { color: '#D7FFF7', fontSize: 14, lineHeight: 22 },
  draftInput: { minHeight: 220, borderRadius: 18, borderWidth: 1, borderColor: '#315F87', backgroundColor: '#0B1121', color: '#FFFFFF', padding: 15, fontSize: 16, lineHeight: 25 },
  draftMetaRow: { gap: 5 },
  wordCount: { color: '#8EA3C3', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  draftStatus: { color: '#B8E8DF', fontSize: 12, lineHeight: 18 },
  errorText: { borderRadius: 14, backgroundColor: '#3B1820', color: '#FFC8D1', padding: 12, fontSize: 13, lineHeight: 20 },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primary, paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
});
