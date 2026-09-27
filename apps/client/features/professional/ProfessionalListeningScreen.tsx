import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  PathwayBadge,
  ReducedMotionAwareMotion,
  SkillBadge,
  performLearningHaptic,
} from '@ui/learningExperience';
import type { FloentlyPalette } from '@ui/theme/floentlyPalette';

import {
  beginProfessionalListeningQuestions,
  continueProfessionalListening,
  createProfessionalListeningSession,
  markProfessionalAudioCompleted,
  submitProfessionalListeningAnswer,
  toProfessionalListeningResult,
  useProfessionalTranscriptFallback,
  type ProfessionalListeningTask,
} from './professionalListening';
import {
  playProfessionalListeningText,
  primeProfessionalListeningAudio,
  stopProfessionalListeningAudio,
} from './professionalListeningAudio';

type Props = {
  palette: FloentlyPalette;
  task: ProfessionalListeningTask;
  onBack: () => void;
  onContinueToSpeaking: () => void;
};

type AudioStatus = 'idle' | 'preparing' | 'playing' | 'unavailable';

export default function ProfessionalListeningScreen({
  palette,
  task,
  onBack,
  onContinueToSpeaking,
}: Props) {
  const [session, setSession] = useState(() => createProfessionalListeningSession(task));
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');

  useEffect(() => {
    setSession(createProfessionalListeningSession(task));
    setAudioStatus('idle');
    return () => {
      void stopProfessionalListeningAudio();
    };
  }, [task]);

  const currentQuestion = task.questions[session.currentQuestionIndex];
  const result = useMemo(
    () => toProfessionalListeningResult(session, task),
    [session, task],
  );

  async function playAudio() {
    if (audioStatus === 'preparing' || audioStatus === 'playing') return;
    setAudioStatus('preparing');

    await primeProfessionalListeningAudio();

    const started = await playProfessionalListeningText(task.scriptFi, {
      onStart: () => setAudioStatus('playing'),
      onFinish: () => {
        setAudioStatus('idle');
        setSession((current) => markProfessionalAudioCompleted(current));
      },
      onUnavailable: () => {
        setAudioStatus('unavailable');
        setSession((current) => useProfessionalTranscriptFallback(current));
      },
    });

    if (!started) {
      setAudioStatus('unavailable');
      setSession((current) => useProfessionalTranscriptFallback(current));
    }
  }

  function chooseTranscriptSupport() {
    void stopProfessionalListeningAudio();
    setAudioStatus('idle');
    setSession((current) => useProfessionalTranscriptFallback(current));
  }

  function continueFromFeedback() {
    const next = continueProfessionalListening(session, task);
    if (
      next.phase === 'complete' &&
      next.deliveryMode === 'audio'
    ) {
      void performLearningHaptic('completion');
    }
    setSession(next);
  }

  const canStartQuestions =
    session.phase === 'listen' &&
    session.deliveryMode !== null &&
    audioStatus !== 'preparing' &&
    audioStatus !== 'playing';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Professional Finnish"
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: palette.primarySurface }]}
          >
            <Text style={[styles.backButtonText, { color: palette.primary }]}>← Professional</Text>
          </Pressable>
          <Text style={[styles.level, { color: palette.textSoft }]}>{task.levelBand}</Text>
        </View>

        <View style={styles.identityRow}>
          <PathwayBadge pathway="professional" palette={palette} compact />
          <SkillBadge skill="listening" palette={palette} compact />
        </View>

        <Text style={[styles.eyebrow, { color: palette.accent }]}>Mission · Listen</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          {task.title}
        </Text>
        <Text style={[styles.situation, { color: palette.textMuted }]}>{task.situation}</Text>

        <View style={[styles.goalCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.textSoft }]}>Listening goal</Text>
          <Text style={[styles.goalText, { color: palette.text }]}>{task.objective}</Text>
        </View>

        {session.phase === 'listen' ? (
          <ReducedMotionAwareMotion kind="task-enter">
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cardLabel, { color: palette.textSoft }]}>1 · Listen</Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>Hear the workplace message</Text>
              <Text style={[styles.helpText, { color: palette.textMuted }]}>
                Generated Finnish practice audio · replay as needed. Listen for the details that are confirmed, uncertain, or still need checking.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={audioStatus === 'playing' ? 'Audio is playing' : 'Play workplace message'}
                accessibilityState={{ disabled: audioStatus === 'preparing' || audioStatus === 'playing' }}
                disabled={audioStatus === 'preparing' || audioStatus === 'playing'}
                onPress={() => void playAudio()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
                  (audioStatus === 'preparing' || audioStatus === 'playing') && styles.disabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {audioStatus === 'preparing'
                    ? 'Preparing audio…'
                    : audioStatus === 'playing'
                      ? 'Playing…'
                      : session.listenCount > 0
                        ? 'Listen again'
                        : 'Listen'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use transcript support instead of audio"
                onPress={chooseTranscriptSupport}
                style={[styles.secondaryButton, { borderColor: palette.borderStrong }]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.primary }]}>
                  Use transcript support
                </Text>
              </Pressable>

              {audioStatus === 'unavailable' ? (
                <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                  <Text style={[styles.noticeTitle, { color: palette.text }]}>Audio is unavailable right now</Text>
                  <Text style={[styles.helpText, { color: palette.textMuted }]}>
                    The transcript is available so the mission does not dead-end. Finishing with the transcript is recorded only as text-supported practice, not as completed audio listening.
                  </Text>
                </View>
              ) : null}

              {session.transcriptVisible ? (
                <ReducedMotionAwareMotion kind="feedback-reveal">
                  <View style={[styles.transcriptCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                    <Text style={[styles.cardLabel, { color: palette.textSoft }]}>Transcript support</Text>
                    <Text style={[styles.transcript, { color: palette.text }]}>{task.scriptFi}</Text>
                    <Text style={[styles.fallbackTruth, { color: palette.textMuted }]}>
                      You are using text support. This does not count as audio listening completion.
                    </Text>
                  </View>
                </ReducedMotionAwareMotion>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start listening questions"
                accessibilityState={{ disabled: !canStartQuestions }}
                disabled={!canStartQuestions}
                onPress={() => setSession((current) => beginProfessionalListeningQuestions(current))}
                style={[
                  styles.nextButton,
                  { borderColor: palette.primary },
                  !canStartQuestions && styles.disabled,
                ]}
              >
                <Text style={[styles.nextButtonText, { color: palette.primary }]}>Answer 2 questions →</Text>
              </Pressable>
            </View>
          </ReducedMotionAwareMotion>
        ) : null}

        {session.phase === 'question' && currentQuestion ? (
          <ReducedMotionAwareMotion
            key={currentQuestion.id}
            kind="next-task"
          >
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cardLabel, { color: palette.textSoft }]}>
                Question {session.currentQuestionIndex + 1} / {task.questions.length}
              </Text>
              <Text accessibilityRole="header" style={[styles.question, { color: palette.text }]}>
                {currentQuestion.prompt}
              </Text>
              <View style={styles.optionList}>
                {currentQuestion.options.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    onPress={() =>
                      setSession((current) =>
                        submitProfessionalListeningAnswer(current, task, option.id)
                      )
                    }
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: pressed ? palette.primarySurface : palette.surfaceMuted,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: palette.text }]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ReducedMotionAwareMotion>
        ) : null}

        {session.phase === 'feedback' && currentQuestion && session.lastAttempt ? (
          <ReducedMotionAwareMotion kind="feedback-reveal">
            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: session.lastAttempt.correct ? palette.success : palette.borderStrong,
                },
              ]}
            >
              <Text style={[styles.cardLabel, { color: session.lastAttempt.correct ? palette.success : palette.textSoft }]}>
                {session.lastAttempt.correct ? 'Understood' : 'Review the detail'}
              </Text>
              <Text style={[styles.feedbackText, { color: palette.text }]}>
                {session.lastAttempt.correct
                  ? currentQuestion.feedback.correct
                  : currentQuestion.feedback.incorrect}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={continueFromFeedback}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {session.currentQuestionIndex + 1 >= task.questions.length ? 'Finish listening step' : 'Next question'}
                </Text>
              </Pressable>
            </View>
          </ReducedMotionAwareMotion>
        ) : null}

        {session.phase === 'complete' && result ? (
          <ReducedMotionAwareMotion kind="success">
            <View
              accessibilityLiveRegion="polite"
              style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.success }]}
            >
              <Text style={[styles.cardLabel, { color: palette.success }]}>
                {result.audioListeningCompleted ? 'Listening step complete' : 'Text-supported practice complete'}
              </Text>
              <Text accessibilityRole="header" style={[styles.cardTitle, { color: palette.text }]}>
                {result.correctCount}/{result.questionCount} details understood
              </Text>
              <Text style={[styles.helpText, { color: palette.textMuted }]}>
                {result.audioListeningCompleted
                  ? 'You completed this mission step using the Finnish audio. Continue into the same situation and use what you heard in speaking.'
                  : 'You completed the comprehension questions with transcript support. This result does not claim audio listening completion.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue mission to speaking"
                onPress={onContinueToSpeaking}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
                ]}
              >
                <Text style={styles.primaryButtonText}>Continue mission · Speak →</Text>
              </Pressable>
            </View>
          </ReducedMotionAwareMotion>
        ) : null}

        <View style={[styles.safetyCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.safetyTitle, { color: palette.text }]}>Language practice boundary</Text>
          <Text style={[styles.helpText, { color: palette.textMuted }]}>{task.safetyNotice}</Text>
          <Text style={[styles.helpText, { color: palette.textMuted }]}>{task.authorityBoundary}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 18, paddingVertical: 18, paddingBottom: 60, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  backButton: { minHeight: 44, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  backButtonText: { fontSize: 14, fontWeight: '800' },
  level: { fontSize: 13, fontWeight: '800' },
  identityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  title: { fontSize: 29, lineHeight: 36, fontWeight: '900' },
  situation: { fontSize: 16, lineHeight: 24 },
  goalCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 6 },
  card: { borderWidth: 1, borderRadius: 24, padding: 18, gap: 14 },
  cardLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardTitle: { fontSize: 21, lineHeight: 28, fontWeight: '850' },
  goalText: { fontSize: 15, lineHeight: 23, fontWeight: '650' },
  helpText: { fontSize: 14, lineHeight: 21 },
  primaryButton: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { fontSize: 14, fontWeight: '850' },
  nextButton: { minHeight: 48, borderWidth: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  nextButtonText: { fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  noticeTitle: { fontSize: 15, fontWeight: '850' },
  transcriptCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  transcript: { fontSize: 16, lineHeight: 25, fontWeight: '600' },
  fallbackTruth: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
  question: { fontSize: 20, lineHeight: 27, fontWeight: '850' },
  optionList: { gap: 10 },
  option: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 13, justifyContent: 'center' },
  optionText: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  feedbackText: { fontSize: 16, lineHeight: 24, fontWeight: '650' },
  safetyCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  safetyTitle: { fontSize: 15, fontWeight: '850' },
});
