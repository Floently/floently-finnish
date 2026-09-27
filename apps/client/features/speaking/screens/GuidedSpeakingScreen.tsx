import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';
import { ReducedMotionAwareMotion, performLearningHaptic } from '@ui/learningExperience';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { usePreferencesStore } from '../../../state/preferencesStore';
import { useGuidedSpeakingProgressStore } from '../../../state/guidedSpeakingProgressStore';
import { useTranslator } from '../../i18n';
import RoleplayMicButton from '../components/RoleplayMicButton';
import { useRoleplayRecorder } from '../hooks/useRoleplayRecorder';
import {
  guidedSpeakingLevelForStage,
  guidedSpeakingTtsSpeed,
  guidedSpeakingVoiceProfile,
} from '../guidedSpeakingStages';
import {
  GUIDED_SPEAKING_CURRICULUM,
  guidedSpeakingLesson,
  guidedSpeakingRetrievalLessons,
} from '../guidedSpeakingCurriculum';
import {
  speakRoleplayText,
  stopRoleplayAudioPlayback,
  uiSounds,
} from '../services/roleplayAudio';

type Props = {
  levelBand: RoleplayLevelBand;
  profession: RoleplayProfession;
  onBack: () => void;
  onLevelBandChange: (levelBand: RoleplayLevelBand) => void;
  onOpenRoleplay: () => void;
};

const GUIDED_SPEAKING_MAX_STAGE = GUIDED_SPEAKING_CURRICULUM.length;

function guidedLevelBounds(level: ReturnType<typeof guidedSpeakingLevelForStage>): [number, number] {
  if (level === 'A1.1') return [1, 25];
  if (level === 'A1.2') return [26, 50];
  if (level === 'A2.1') return [51, 75];
  if (level === 'A2.2') return [76, 100];
  if (level === 'B1.1') return [101, 125];
  if (level === 'B1.2') return [126, 150];
  if (level === 'B2.1') return [151, 175];
  if (level === 'B2.2') return [176, 200];
  if (level === 'C1') return [201, 250];
  return [251, 300];
}

function roleplayBandForGuidedLevel(level: ReturnType<typeof guidedSpeakingLevelForStage>): RoleplayLevelBand {
  if (level.startsWith('A')) return 'A1-A2';
  if (level.startsWith('B')) return 'B1-B2';
  return 'C1-C2';
}

export default function GuidedSpeakingScreen({
  levelBand: _levelBand,
  profession,
  onBack,
  onLevelBandChange: _onLevelBandChange,
  onOpenRoleplay,
}: Props) {
  const { t } = useTranslator();
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const recorder = useRoleplayRecorder('fi-FI');
  const highestUnlockedNumber = useGuidedSpeakingProgressStore((state) => state.highestUnlockedNumber);
  const currentStageNumber = useGuidedSpeakingProgressStore((state) => state.currentStageNumber);
  const hydrateProgress = useGuidedSpeakingProgressStore((state) => state.hydrate);
  const openPersistedStage = useGuidedSpeakingProgressStore((state) => state.openStage);
  const resumePersistedFrontier = useGuidedSpeakingProgressStore((state) => state.resumeFrontier);
  const completePersistedStage = useGuidedSpeakingProgressStore((state) => state.completeStage);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [lessonStep, setLessonStep] = useState<'recall' | 'listen' | 'speak'>(() => 'listen');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [typedFallback, setTypedFallback] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);

  const curriculumLesson = guidedSpeakingLesson(currentStageNumber) ?? GUIDED_SPEAKING_CURRICULUM[0];
  const visibleStageNumber = curriculumLesson.number;
  const visibleLevel = curriculumLesson.level;
  const activeLevelBand = roleplayBandForGuidedLevel(visibleLevel);
  const frontierStageNumber = Math.min(GUIDED_SPEAKING_MAX_STAGE, highestUnlockedNumber);
  const isReviewing = visibleStageNumber < frontierStageNumber;
  const stageCompleted = visibleStageNumber < highestUnlockedNumber;
  const completedCount = Math.min(GUIDED_SPEAKING_MAX_STAGE, Math.max(0, highestUnlockedNumber - 1));
  const retrievalLessons = guidedSpeakingRetrievalLessons(visibleStageNumber)
    .filter((lesson) => lesson.number < visibleStageNumber && lesson.number < highestUnlockedNumber);
  const [levelStart, levelEnd] = guidedLevelBounds(visibleLevel);
  const levelProgress = Math.max(
    0,
    Math.min(1, (visibleStageNumber - levelStart + 1) / Math.max(1, levelEnd - levelStart + 1)),
  );
  const canAdvance =
    (attempted || stageCompleted || typedFallback.trim().length > 0) &&
    !recorder.isRecording &&
    recorder.phase !== 'uploading' &&
    !ttsPlaying;

  useEffect(() => {
    void hydrateProgress();
  }, [hydrateProgress]);

  useEffect(() => {
    setTranscript(null);
    setTypedFallback('');
    setAttempted(false);
    setTtsUnavailable(false);
    setRecallOpen(false);
    setLessonStep(retrievalLessons.length > 0 ? 'recall' : 'listen');
    void recorder.cancelRecording();
    void stopRoleplayAudioPlayback();
    // The recorder object is intentionally omitted. Its methods are stable
    // enough for explicit user actions; stage resets should only follow
    // context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profession, currentStageNumber]);

  useEffect(() => {
    if (recorder.isRecording) {
      setAttempted(true);
    }
  }, [recorder.isRecording]);

  useEffect(() => {
    return () => {
      void recorder.cancelRecording();
      void stopRoleplayAudioPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function playModel() {
    if (recorder.isRecording || recorder.phase === 'uploading' || ttsPlaying) {
      return;
    }

    setTtsUnavailable(false);
    setTtsPlaying(true);
    const played = await speakRoleplayText({
      text: curriculumLesson.modelFi,
      voiceProfile: guidedSpeakingVoiceProfile(profession),
      speed: guidedSpeakingTtsSpeed(activeLevelBand),
      onStart: () => setTtsPlaying(true),
      onFinish: () => setTtsPlaying(false),
      onUnavailable: () => {
        setTtsPlaying(false);
        setTtsUnavailable(true);
      },
    });

    if (!played) {
      setTtsPlaying(false);
      setTtsUnavailable(true);
    }
  }

  async function toggleRecording() {
    if (recorder.phase === 'uploading') return;

    if (!recorder.isRecording) {
      setTranscript(null);
      await stopRoleplayAudioPlayback();
      await recorder.startRecording();
      return;
    }

    const result = await recorder.stopRecording();
    if (result) {
      setTranscript(result);
      await uiSounds.success();
    }
  }

  async function openStage(stageNumber: number) {
    if (
      stageNumber < 1 ||
      stageNumber >= highestUnlockedNumber ||
      stageNumber > GUIDED_SPEAKING_MAX_STAGE ||
      recorder.isRecording ||
      recorder.phase === 'uploading' ||
      ttsPlaying
    ) return;
    void stopRoleplayAudioPlayback();
    setTranscript(null);
    setTypedFallback('');
    setAttempted(true);
    setTtsUnavailable(false);
    await openPersistedStage(stageNumber);
  }

  async function advance() {
    if (!canAdvance) return;

    await completePersistedStage(curriculumLesson.id, curriculumLesson.version, visibleStageNumber);

    void performLearningHaptic(
      isReviewing ? 'retry-success' : visibleStageNumber === levelEnd ? 'milestone' : 'completion',
    );

    if (isReviewing) {
      await resumePersistedFrontier();
      void stopRoleplayAudioPlayback();
      setTranscript(null);
      setTypedFallback('');
      setAttempted(false);
      setTtsUnavailable(false);
      return;
    }

    if (visibleStageNumber === GUIDED_SPEAKING_MAX_STAGE) {
      onOpenRoleplay();
      return;
    }

    void stopRoleplayAudioPlayback();
    setTranscript(null);
    setTypedFallback('');
    setAttempted(false);
    setTtsUnavailable(false);
  }

  const background = isDark ? '#0C1222' : palette.background;
  const surface = isDark ? '#111B30' : palette.surface;
  const raised = isDark ? '#16233E' : palette.surfaceMuted;
  const border = isDark ? '#1E2E47' : palette.border;
  const text = isDark ? '#F0F5FF' : palette.text;
  const muted = isDark ? '#8EA3C3' : palette.textMuted;
  const soft = isDark ? '#5C7299' : palette.textSoft;
  const primary = isDark ? '#4F7FFF' : palette.primary;
  const success = '#3EC58A';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <View style={styles.shell}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commonBack')}
            onPress={onBack}
            style={[styles.smallButton, { backgroundColor: raised, borderColor: border }]}
          >
            <Text style={[styles.smallButtonText, { color: text }]}>← {t('commonBack')}</Text>
          </Pressable>

          <Text style={[styles.topTitle, { color: text }]}>
            {t('ykiPracticeGuidedPracticeLabel')} · {t('ykiRouteSkillSpeaking')}
          </Text>

          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heading}>
            <Text style={[styles.eyebrow, { color: primary }]}>
              {t('roleplayLevelLabel')} · {visibleLevel} · Stage {visibleStageNumber}
            </Text>
            <Text style={[styles.title, { color: text }]}>{curriculumLesson.titleFi}</Text>
            <Text style={[styles.subtitle, { color: muted }]}>{curriculumLesson.goalFi}</Text>
          </View>

          <View style={[styles.progressCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={[styles.sectionLabel, { color: soft }]}>Your progress</Text>
                <Text style={[styles.progressTitle, { color: text }]}>
                  {visibleLevel} · Stage {visibleStageNumber}
                </Text>
              </View>
              {highestUnlockedNumber > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: historyOpen }}
                  onPress={() => setHistoryOpen((open) => !open)}
                  style={[styles.historyButton, { borderColor: border, backgroundColor: raised }]}
                >
                  <Text style={[styles.historyButtonText, { color: text }]}>History</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={[styles.progressTrack, { backgroundColor: raised }]}>
              <View style={[styles.progressFill, { backgroundColor: primary, width: `${Math.max(4, levelProgress * 100)}%` }]} />
            </View>
            <Text style={[styles.progressCaption, { color: muted }]}>
              {completedCount} stages completed · Keep going one step at a time
            </Text>
          </View>

          {historyOpen ? (
            <View style={[styles.historyPanel, { backgroundColor: surface, borderColor: border }]}>
              <Text style={[styles.historyTitle, { color: text }]}>Passed stages</Text>
              <Text style={[styles.supportNote, { color: muted }]}>
                Repeat any stage you have already passed. Future stages appear only when you reach them.
              </Text>
              <View style={styles.historyList}>
                {GUIDED_SPEAKING_CURRICULUM
                  .slice(0, Math.max(0, Math.min(GUIDED_SPEAKING_MAX_STAGE, highestUnlockedNumber - 1)))
                  .map((item) => (
                    <Pressable
                      key={item.id}
                      disabled={recorder.isRecording || recorder.phase === 'uploading' || ttsPlaying}
                      onPress={() => {
                        void openStage(item.number);
                        setHistoryOpen(false);
                      }}
                      accessibilityRole="button"
                      style={[styles.historyRow, { borderColor: border, backgroundColor: raised }]}
                    >
                      <View style={styles.historyRowCopy}>
                        <Text style={[styles.historyRowTitle, { color: text }]}>
                          {item.level} · Stage {item.number}
                        </Text>
                        <Text numberOfLines={1} style={[styles.historyRowGoal, { color: muted }]}>
                          {item.goalFi}
                        </Text>
                      </View>
                      <Text style={[styles.historyRepeat, { color: primary }]}>Repeat</Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ) : null}

          {lessonStep === 'recall' && retrievalLessons.length > 0 ? (
            <ReducedMotionAwareMotion
              key={`recall-${visibleStageNumber}`}
              kind="task-enter"
              style={[styles.recallCard, { backgroundColor: surface, borderColor: border }]}
            >
              <Text style={[styles.sectionLabel, { color: soft }]}>Remember?</Text>
              {!recallOpen ? (
                <>
                  <Text style={[styles.recallPrompt, { color: text }]}>
                    Before the new step, recall something you already learned.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setRecallOpen(true)}
                    style={[styles.recallButton, { backgroundColor: raised, borderColor: border }]}
                  >
                    <Text style={[styles.recallButtonText, { color: primary }]}>Start recall</Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.recallList}>
                  {retrievalLessons.map((lesson) => (
                    <View key={lesson.id} style={[styles.recallItem, { backgroundColor: raised, borderColor: border }]}>
                      <Text style={[styles.recallStage, { color: soft }]}>
                        From Stage {lesson.number}
                      </Text>
                      <Text style={[styles.recallPrompt, { color: text }]}>{lesson.promptFi}</Text>
                    </View>
                  ))}
                  <Text style={[styles.supportNote, { color: muted }]}>
                    Say the answers from memory.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setRecallOpen(false);
                      setLessonStep('listen');
                    }}
                    style={[styles.primaryStepButton, { backgroundColor: primary }]}
                  >
                    <Text style={styles.primaryStepButtonText}>Continue</Text>
                  </Pressable>
                </View>
              )}
            </ReducedMotionAwareMotion>
          ) : null}

          {lessonStep === 'listen' ? (
            <ReducedMotionAwareMotion
              key={`listen-${visibleStageNumber}`}
              kind="next-task"
              style={[styles.modelCard, { backgroundColor: surface, borderColor: border }]}
            >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.stageBadge, { backgroundColor: `${primary}18` }]}>
                <Text style={[styles.stageBadgeText, { color: primary }]}>
                  {visibleLevel} · Stage {visibleStageNumber}
                </Text>
              </View>
              <Text style={[styles.wordRange, { color: soft }]}>
                ≈ {curriculumLesson.expectedMinWords}–{curriculumLesson.expectedMaxWords} words
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: soft }]}>Malli</Text>
            <Text style={[styles.modelText, { color: text }]}>{curriculumLesson.modelFi}</Text>

            <Pressable
              onPress={() => void playModel()}
              disabled={ttsPlaying || recorder.isRecording || recorder.phase === 'uploading'}
              accessibilityRole="button"
              accessibilityLabel={t('cardsListen')}
              style={[
                styles.listenButton,
                { borderColor: primary, backgroundColor: `${primary}14` },
                (ttsPlaying || recorder.isRecording || recorder.phase === 'uploading') && styles.disabled,
              ]}
            >
              <Text style={[styles.listenButtonText, { color: primary }]}>
                🔊 {t('cardsListen')}
              </Text>
            </Pressable>

            {ttsUnavailable ? (
              <Text style={[styles.supportNote, { color: muted }]}>
                Ääni ei ole juuri nyt saatavilla. Voit lukea mallin ja jatkaa harjoitusta.
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => setLessonStep('speak')}
              style={[styles.primaryStepButton, { backgroundColor: primary }]}
            >
              <Text style={styles.primaryStepButtonText}>I'm ready to speak</Text>
            </Pressable>
          </ReducedMotionAwareMotion>
          ) : null}

          {lessonStep === 'speak' ? (
            <ReducedMotionAwareMotion
              key={`speak-${visibleStageNumber}`}
              kind="next-task"
              style={styles.speakStep}
            >
              <View style={[styles.practiceCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.sectionLabel, { color: soft }]}>Tehtävä</Text>
            <Text style={[styles.promptText, { color: text }]}>{curriculumLesson.promptFi}</Text>

            {curriculumLesson.responseFrameFi ? (
              <View style={[styles.frameBox, { backgroundColor: raised, borderColor: border }]}>
                <Text style={[styles.frameText, { color: text }]}>{curriculumLesson.responseFrameFi}</Text>
              </View>
            ) : null}

            {curriculumLesson.supportFi.length ? (
              <View style={styles.supportRow}>
                {curriculumLesson.supportFi.map((item) => (
                  <View key={item} style={[styles.supportChip, { backgroundColor: raised, borderColor: border }]}>
                    <Text style={[styles.supportChipText, { color: muted }]}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.micWrap}>
              <RoleplayMicButton
                isRecording={recorder.isRecording}
                isBusy={recorder.phase === 'uploading'}
                onPress={() => void toggleRecording()}
              />
            </View>

            {transcript ? (
              <ReducedMotionAwareMotion kind="feedback-reveal">
                <View
                  accessibilityLiveRegion="polite"
                  style={[styles.transcriptBox, { backgroundColor: raised, borderColor: success }]}
                >
                  <Text style={[styles.transcriptMarker, { color: success }]}>✓</Text>
                  <Text style={[styles.transcriptText, { color: text }]}>{transcript}</Text>
                </View>
              </ReducedMotionAwareMotion>
            ) : null}

            {recorder.error ? (
              <View accessibilityRole="alert" style={[styles.errorBox, { borderColor: '#FF8B8B' }]}>
                <Text style={styles.errorText}>{recorder.error}</Text>
                <Text style={[styles.supportNote, { color: muted }]}>
                  Voit yrittää puhumista uudelleen. Jos puheentunnistus ei ole käytettävissä, kirjoita harjoittelemasi vastaus alle, jotta etenemisesi ei esty.
                </Text>
                <TextInput
                  value={typedFallback}
                  onChangeText={setTypedFallback}
                  placeholder={t('ykiRouteAnswerPlaceholder')}
                  placeholderTextColor={soft}
                  multiline
                  accessibilityLabel={t('ykiRouteAnswerPlaceholder')}
                  style={[
                    styles.fallbackInput,
                    { backgroundColor: raised, borderColor: border, color: text },
                  ]}
                />
              </View>
            ) : null}
              </View>

              <View style={[styles.nextCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.nextCopy}>
              <Text style={[styles.nextTitle, { color: text }]}>
                {isReviewing
                  ? `Return to Stage ${frontierStageNumber}`
                  : visibleStageNumber === GUIDED_SPEAKING_MAX_STAGE
                    ? t('commonOpenRoleplay')
                    : t('commonNext')}
              </Text>
              <Text style={[styles.nextDetail, { color: muted }]}>
                {isReviewing
                  ? 'Return to your current learning step without changing your unlocked progress.'
                  : visibleStageNumber === GUIDED_SPEAKING_MAX_STAGE
                    ? 'Seuraavaksi käytät samoja taitoja avoimessa keskustelussa.'
                    : guidedSpeakingLesson(visibleStageNumber + 1)?.goalFi}
              </Text>
            </View>
            <Pressable
              onPress={() => void advance()}
              disabled={!canAdvance}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAdvance }}
              style={[
                styles.nextButton,
                { backgroundColor: primary },
                !canAdvance && styles.disabled,
              ]}
            >
              <Text style={styles.nextButtonText}>
                {isReviewing
                  ? `Return to Stage ${frontierStageNumber}`
                  : visibleStageNumber === GUIDED_SPEAKING_MAX_STAGE
                    ? t('commonOpenRoleplay')
                    : t('commonNext')}
              </Text>
            </Pressable>
              </View>
            </ReducedMotionAwareMotion>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1 },
  topRow: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 13, fontWeight: '800' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', paddingHorizontal: 8 },
  topSpacer: { width: 72 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40, gap: 16 },
  heading: { gap: 7, paddingTop: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  progressCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progressTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 3 },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressCaption: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  primaryStepButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryStepButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  journeyCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  journeyCopy: { flex: 1, gap: 4 },
  journeyText: { fontSize: 16, lineHeight: 22, fontWeight: '800' },
  historyButton: { minHeight: 44, borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  historyButtonText: { fontSize: 13, fontWeight: '800' },
  historyPanel: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  historyTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  historyList: { gap: 8 },
  historyRow: { minHeight: 58, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyRowCopy: { flex: 1, gap: 2 },
  historyRowTitle: { fontSize: 14, fontWeight: '800' },
  historyRowGoal: { fontSize: 12, lineHeight: 17 },
  historyRepeat: { fontSize: 12, fontWeight: '900' },
  progressRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  progressStep: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepText: { fontSize: 12, fontWeight: '900' },
  lockedStep: { opacity: 0.36 },
  levelCard: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelPill: { minHeight: 42, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  levelText: { fontSize: 12, fontWeight: '800' },
  levelTextSelected: { color: '#FFFFFF' },
  recallCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  recallPrompt: { fontSize: 16, lineHeight: 23, fontWeight: '700' },
  recallButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  recallButtonText: { fontSize: 14, fontWeight: '900' },
  recallList: { gap: 9 },
  recallItem: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  recallStage: { fontSize: 11, lineHeight: 16, fontWeight: '800' },
  modelCard: { borderRadius: 22, borderWidth: 1, padding: 17, gap: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stageBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  stageBadgeText: { fontSize: 11, fontWeight: '900' },
  wordRange: { fontSize: 11, fontWeight: '700' },
  modelText: { fontSize: 21, lineHeight: 30, fontWeight: '700' },
  listenButton: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' },
  listenButtonText: { fontSize: 13, fontWeight: '900' },
  supportNote: { fontSize: 12, lineHeight: 18 },
  speakStep: { gap: 16 },
  practiceCard: { borderRadius: 22, borderWidth: 1, padding: 17, gap: 14 },
  promptText: { fontSize: 17, lineHeight: 25, fontWeight: '700' },
  frameBox: { borderRadius: 14, borderWidth: 1, padding: 13 },
  frameText: { fontSize: 17, lineHeight: 25, fontWeight: '800' },
  supportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  supportChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  supportChipText: { fontSize: 12, fontWeight: '700' },
  micWrap: { paddingVertical: 12, alignItems: 'center' },
  transcriptBox: { borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  transcriptMarker: { fontSize: 16, fontWeight: '900' },
  transcriptText: { flex: 1, fontSize: 14, lineHeight: 21 },
  errorBox: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  errorText: { color: '#FF8B8B', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  fallbackInput: {
    minHeight: 82,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  nextCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 14 },
  nextCopy: { gap: 4 },
  nextTitle: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
  nextDetail: { fontSize: 13, lineHeight: 20 },
  nextButton: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  nextButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
