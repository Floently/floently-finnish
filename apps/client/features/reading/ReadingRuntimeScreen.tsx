import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import type { FloentlyPalette } from '@ui/theme/floentlyPalette';
import { LearningFocusSurface, PathwayBadge, SkillBadge } from '@ui/learningExperience';

import { ReadingDocumentCard } from './components/ReadingDocumentCard';
import { ReadingQuestionCard } from './components/ReadingQuestionCard';
import { ReadingStatePanel } from './components/ReadingStatePanel';
import {
  READING_ENGINE_VERSION,
  continueReadingSession,
  createReadingSession,
  getReadingScaffolding,
  retryReadingQuestion,
  setReadingVocabularyOpen,
  startReadingQuestions,
  submitReadingResponse,
  summarizeReadingSession,
  toReadingTaskResult,
  validateReadingTask,
  type ReadingResponse,
  type ReadingRuntimeHooks,
  type ReadingScope,
  type ReadingSessionState,
  type ReadingTask,
} from './readingEngine';

type ReadingRuntimeScreenProps = ReadingRuntimeHooks & {
  palette: FloentlyPalette;
  scope: ReadingScope;
  status: 'loading' | 'ready' | 'error';
  task?: unknown;
  taskOptions?: readonly ReadingTask[];
  errorMessage?: string;
  errorEyebrow?: string;
  errorTitle?: string;
  errorActionLabel?: string;
  errorSecondaryLabel?: string;
  onRetryLoad?: () => void;
  onSelectTask?: (taskId: string) => void;
  onBack: () => void;
};

function newSessionIdentity(task: ReadingTask) {
  const startedAt = new Date().toISOString();
  return {
    startedAt,
    attemptId: `reading:${task.taskId}:${startedAt}`,
  };
}

export function ReadingRuntimeScreen({
  palette,
  scope,
  status,
  task,
  taskOptions = [],
  errorMessage,
  errorEyebrow,
  errorTitle,
  errorActionLabel,
  errorSecondaryLabel,
  onRetryLoad,
  onSelectTask,
  onBack,
  onEvent,
  onResult,
}: ReadingRuntimeScreenProps) {
  const { width } = useWindowDimensions();
  const validation = useMemo(() => validateReadingTask(task), [task]);
  const validTask = status === 'ready' && validation.ok ? validation.task : null;
  const [session, setSession] = useState<ReadingSessionState | null>(
    validTask ? createReadingSession(validTask) : null,
  );
  const [identity, setIdentity] = useState(() =>
    validTask ? newSessionIdentity(validTask) : null,
  );
  const eventHook = useRef(onEvent);
  const resultHook = useRef(onResult);
  const deliveredResult = useRef<string | null>(null);

  useEffect(() => {
    eventHook.current = onEvent;
    resultHook.current = onResult;
  }, [onEvent, onResult]);

  useEffect(() => {
    if (!validTask) {
      setSession(null);
      setIdentity(null);
      deliveredResult.current = null;
      return;
    }
    const nextIdentity = newSessionIdentity(validTask);
    setSession(createReadingSession(validTask));
    setIdentity(nextIdentity);
    deliveredResult.current = null;
    eventHook.current?.({
      eventVersion: READING_ENGINE_VERSION,
      kind: 'reading_started',
      taskId: validTask.taskId,
      contentVersion: validTask.contentVersion,
      occurredAt: nextIdentity.startedAt,
    });
  }, [validTask]);

  useEffect(() => {
    if (!validTask || !session || !identity || session.phase !== 'complete') return;
    const resultKey = `${identity.attemptId}:${validTask.contentVersion}`;
    if (deliveredResult.current === resultKey) return;
    const completedAt = new Date().toISOString();
    const result = toReadingTaskResult({
      task: validTask,
      state: session,
      attemptId: identity.attemptId,
      startedAt: identity.startedAt,
      completedAt,
    });
    deliveredResult.current = resultKey;
    resultHook.current?.(result);
    eventHook.current?.({
      eventVersion: READING_ENGINE_VERSION,
      kind: 'reading_completed',
      taskId: validTask.taskId,
      contentVersion: validTask.contentVersion,
      occurredAt: completedAt,
    });
  }, [identity, session, validTask]);

  const contentPadding = width < 480 ? 16 : 28;
  const pageTitle = scope === 'professional' ? 'Työelämän lukeminen' : 'Arjen lukeminen';

  const resetTask = () => {
    if (!validTask) return;
    const nextIdentity = newSessionIdentity(validTask);
    setSession(createReadingSession(validTask));
    setIdentity(nextIdentity);
    deliveredResult.current = null;
    eventHook.current?.({
      eventVersion: READING_ENGINE_VERSION,
      kind: 'reading_started',
      taskId: validTask.taskId,
      contentVersion: validTask.contentVersion,
      occurredAt: nextIdentity.startedAt,
    });
  };

  const submit = (response: ReadingResponse) => {
    if (!validTask || !session) return;
    const question = validTask.questions[session.currentQuestionIndex];
    if (!question) return;
    const submittedAt = new Date().toISOString();
    const next = submitReadingResponse({ state: session, task: validTask, response, submittedAt });
    setSession(next);
    const attempt = next.lastAttempt;
    if (attempt) {
      eventHook.current?.({
        eventVersion: READING_ENGINE_VERSION,
        kind: 'answer_submitted',
        taskId: validTask.taskId,
        contentVersion: validTask.contentVersion,
        occurredAt: submittedAt,
        questionId: question.id,
        correct: attempt.correct,
        attemptNumber: attempt.attemptNumber,
      });
    }
  };

  const retry = () => {
    if (!validTask || !session) return;
    const question = validTask.questions[session.currentQuestionIndex];
    const occurredAt = new Date().toISOString();
    setSession(retryReadingQuestion(session, validTask));
    eventHook.current?.({
      eventVersion: READING_ENGINE_VERSION,
      kind: 'retry_started',
      taskId: validTask.taskId,
      contentVersion: validTask.contentVersion,
      occurredAt,
      questionId: question?.id,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: contentPadding }]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Takaisin"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? palette.primarySurface : palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.backButtonText, { color: palette.text }]}>‹ Takaisin</Text>
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>KieliValmis Reading</Text>
            <Text accessibilityRole="header" style={[styles.pageTitle, { color: palette.text }]}>
              {pageTitle}
            </Text>
          </View>
        </View>

        {status === 'loading' ? (
          <ReadingStatePanel
            palette={palette}
            eyebrow="Ladataan"
            title="Valmistellaan lukutehtävää"
            message="Tarkistamme käyttöoikeuden ja tehtävän tiedot."
            live
          />
        ) : null}

        {status === 'error' ? (
          <ReadingStatePanel
            palette={palette}
            eyebrow={errorEyebrow ?? 'Tehtävää ei voitu avata'}
            title={errorTitle ?? 'Yritä hetken kuluttua uudelleen'}
            message={errorMessage ?? 'Lukutehtävän lataaminen epäonnistui.'}
            actionLabel={onRetryLoad ? (errorActionLabel ?? 'Yritä uudelleen') : undefined}
            onAction={onRetryLoad}
            secondaryLabel={errorSecondaryLabel ?? 'Palaa takaisin'}
            onSecondary={onBack}
            live
          />
        ) : null}

        {status === 'ready' && !validation.ok ? (
          <ReadingStatePanel
            palette={palette}
            eyebrow="Virheellinen tehtävä"
            title="Tätä lukutehtävää ei voi näyttää turvallisesti"
            message="Tehtävän rakenne on puutteellinen. Valitse toinen tehtävä tai palaa takaisin."
            secondaryLabel="Palaa takaisin"
            onSecondary={onBack}
            live
          />
        ) : null}

        {validTask && session ? (
          <View style={styles.runtime}>
            {taskOptions.length > 1 && onSelectTask ? (
              <View
                style={[
                  styles.taskPicker,
                  { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.taskPickerLabel, { color: palette.textMuted }]}>Valitse taso</Text>
                <View style={styles.taskPickerOptions} accessibilityRole="radiogroup">
                  {taskOptions.map((option) => {
                    const selected = option.taskId === validTask.taskId;
                    return (
                      <Pressable
                        key={option.taskId}
                        accessibilityRole="radio"
                        accessibilityLabel={`${option.level}: ${option.title}`}
                        accessibilityState={{ checked: selected }}
                        onPress={() => onSelectTask(option.taskId)}
                        style={({ pressed }) => [
                          styles.taskPickerButton,
                          {
                            backgroundColor: selected
                              ? palette.primarySurfaceStrong
                              : pressed
                                ? palette.primarySurface
                                : palette.surface,
                            borderColor: selected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskPickerButtonText,
                            { color: selected ? palette.primary : palette.text },
                          ]}
                        >
                          {option.level}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <LearningFocusSurface mode="reading" palette={palette} levelBand={validTask.level}>
              <View style={styles.identityRow}>
                <PathwayBadge pathway={scope === 'professional' ? 'professional' : 'everyday'} palette={palette} compact />
                <SkillBadge skill="reading" palette={palette} compact />
              </View>

            <View style={styles.taskIntroduction}>
              <View style={[styles.levelBadge, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.levelBadgeText, { color: palette.accent }]}>
                  {validTask.level} · noin {validTask.estimatedMinutes} min
                </Text>
              </View>
              <Text accessibilityRole="header" style={[styles.taskTitle, { color: palette.text }]}>
                {validTask.title}
              </Text>
            </View>

            {session.phase !== 'reading' && session.phase !== 'complete' ? (
              <View style={styles.progressBlock}>
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Lukutehtävän edistyminen"
                  accessibilityValue={{
                    min: 0,
                    max: validTask.questions.length,
                    now: session.currentQuestionIndex + 1,
                    text: `Kysymys ${session.currentQuestionIndex + 1} / ${validTask.questions.length}`,
                  }}
                  style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: palette.accent,
                        width: `${
                          ((session.currentQuestionIndex + 1) / validTask.questions.length) * 100
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {session.phase !== 'complete' ? (
              <ReadingDocumentCard
                palette={palette}
                task={validTask}
                scaffolding={getReadingScaffolding(validTask.level)}
                vocabularyOpen={session.vocabularyOpen}
                onToggleVocabulary={() =>
                  setSession((current) =>
                    current
                      ? setReadingVocabularyOpen(current, !current.vocabularyOpen)
                      : current,
                  )
                }
              />
            ) : null}

            {session.phase === 'reading' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aloita kysymykset"
                onPress={() => setSession(startReadingQuestions(session, validTask))}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.background }]}>
                  Aloita kysymykset
                </Text>
              </Pressable>
            ) : null}

            {session.phase === 'question' || session.phase === 'feedback' ? (
              <ReadingQuestionCard
                palette={palette}
                question={validTask.questions[session.currentQuestionIndex]}
                questionNumber={session.currentQuestionIndex + 1}
                questionCount={validTask.questions.length}
                scaffolding={getReadingScaffolding(validTask.level)}
                lastAttempt={session.lastAttempt}
                acceptingAnswers={session.phase === 'question'}
                onSubmit={submit}
                onRetry={retry}
                onContinue={() => setSession(continueReadingSession(session, validTask))}
              />
            ) : null}

            {session.phase === 'complete' ? (
              <CompletionPanel
                palette={palette}
                session={session}
                task={validTask}
                onRestart={resetTask}
                onBack={onBack}
              />
            ) : null}
            </LearningFocusSurface>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function CompletionPanel({
  palette,
  session,
  task,
  onRestart,
  onBack,
}: {
  palette: FloentlyPalette;
  session: ReadingSessionState;
  task: ReadingTask;
  onRestart: () => void;
  onBack: () => void;
}) {
  const summary = summarizeReadingSession(session, task);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.completionCard,
        { backgroundColor: palette.surface, borderColor: palette.success },
      ]}
    >
      <Text style={[styles.eyebrow, { color: palette.success }]}>Tehtävä valmis</Text>
      <Text accessibilityRole="header" style={[styles.completionTitle, { color: palette.text }]}>
        Ymmärsit tekstin ja korjasit tarvittaessa.
      </Text>
      <Text style={[styles.completionText, { color: palette.textMuted }]}>
        Ensimmäisellä yrityksellä oikein {summary.firstTryCorrect}/{summary.questionCount}.
        {summary.correctedCount > 0
          ? ` Korjasit ${summary.correctedCount} vastausta palautteen avulla.`
          : ' Kaikki vastaukset osuivat heti.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tee tehtävä uudelleen"
        onPress={onRestart}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: palette.background }]}>Tee uudelleen</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Palaa takaisin"
        onPress={onBack}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            backgroundColor: pressed ? palette.primarySurface : 'transparent',
            borderColor: palette.borderStrong,
          },
        ]}
      >
        <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Palaa takaisin</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  titleBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
  },
  runtime: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 20,
  },
  identityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taskPicker: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  taskPickerLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  taskPickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  taskPickerButton: {
    minHeight: 48,
    minWidth: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  taskPickerButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  taskIntroduction: {
    gap: 9,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelBadgeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  taskTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
  },
  progressBlock: {
    gap: 7,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  completionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 24,
    gap: 14,
  },
  completionTitle: {
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '800',
  },
  completionText: {
    fontSize: 17,
    lineHeight: 26,
  },
});
