import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { usePreferencesStore } from '../../../state/preferencesStore';
import { useTranslator } from '../../i18n';
import RoleplayMicButton from '../components/RoleplayMicButton';
import { useRoleplayRecorder } from '../hooks/useRoleplayRecorder';
import {
  guidedSpeakingExpectedResponseRange,
  guidedSpeakingTtsSpeed,
  guidedSpeakingVoiceProfile,
  getGuidedSpeakingStages,
} from '../guidedSpeakingStages';
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

const LEVEL_BANDS: RoleplayLevelBand[] = ['A1-A2', 'B1-B2', 'C1-C2'];

export default function GuidedSpeakingScreen({
  levelBand,
  profession,
  onBack,
  onLevelBandChange,
  onOpenRoleplay,
}: Props) {
  const { t } = useTranslator();
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const recorder = useRoleplayRecorder('fi-FI');

  const stages = useMemo(
    () => getGuidedSpeakingStages(profession, levelBand),
    [levelBand, profession],
  );
  const [stageIndex, setStageIndex] = useState(0);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);
  const [completedStageIds, setCompletedStageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [transcript, setTranscript] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);

  const stage = stages[stageIndex];
  const stageCompleted = completedStageIds.has(stage.id);
  const canAdvance =
    (attempted || stageCompleted) &&
    !recorder.isRecording &&
    recorder.phase !== 'uploading';

  useEffect(() => {
    setStageIndex(0);
    setMaxUnlockedIndex(0);
    setCompletedStageIds(new Set());
    setTranscript(null);
    setAttempted(false);
    setTtsUnavailable(false);
    void recorder.cancelRecording();
    void stopRoleplayAudioPlayback();
    // The recorder object is intentionally omitted. Its methods are stable
    // enough for explicit user actions; stage resets should only follow
    // context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelBand, profession]);

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
    const played = await speakRoleplayText({
      text: stage.modelFi,
      voiceProfile: guidedSpeakingVoiceProfile(profession),
      speed: guidedSpeakingTtsSpeed(levelBand),
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

  function openStage(index: number) {
    if (index > maxUnlockedIndex) return;
    setStageIndex(index);
    setTranscript(null);
    setAttempted(completedStageIds.has(stages[index].id));
    setTtsUnavailable(false);
  }

  function advance() {
    if (!canAdvance) return;

    setCompletedStageIds((current) => {
      const next = new Set(current);
      next.add(stage.id);
      return next;
    });

    if (stageIndex === stages.length - 1) {
      onOpenRoleplay();
      return;
    }

    const nextIndex = stageIndex + 1;
    setMaxUnlockedIndex((current) => Math.max(current, nextIndex));
    setStageIndex(nextIndex);
    setTranscript(null);
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
              {t('roleplayLevelLabel')} · {levelBand}
            </Text>
            <Text style={[styles.title, { color: text }]}>{stage.titleFi}</Text>
            <Text style={[styles.subtitle, { color: muted }]}>{stage.goalFi}</Text>
          </View>

          <View style={styles.progressRow} accessibilityLabel={`${stage.order} / ${stages.length}`}>
            {stages.map((item, index) => {
              const unlocked = index <= maxUnlockedIndex;
              const active = index === stageIndex;
              const complete = completedStageIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  disabled={!unlocked}
                  onPress={() => openStage(index)}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: !unlocked,
                    selected: active,
                  }}
                  style={[
                    styles.progressStep,
                    { borderColor: border, backgroundColor: raised },
                    active && { borderColor: primary, backgroundColor: `${primary}22` },
                    complete && { borderColor: success, backgroundColor: `${success}18` },
                    !unlocked && styles.lockedStep,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressStepText,
                      { color: soft },
                      (active || complete) && { color: complete ? success : primary },
                    ]}
                  >
                    {item.order}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.levelCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.sectionLabel, { color: soft }]}>{t('roleplayLevelLabel')}</Text>
            <View style={styles.levelRow}>
              {LEVEL_BANDS.map((band) => {
                const selected = band === levelBand;
                return (
                  <Pressable
                    key={band}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onLevelBandChange(band)}
                    style={[
                      styles.levelPill,
                      { backgroundColor: raised, borderColor: border },
                      selected && { backgroundColor: primary, borderColor: primary },
                    ]}
                  >
                    <Text style={[styles.levelText, { color: muted }, selected && styles.levelTextSelected]}>
                      {band}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.modelCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.stageBadge, { backgroundColor: `${primary}18` }]}>
                <Text style={[styles.stageBadgeText, { color: primary }]}>
                  {stage.order} / {stages.length}
                </Text>
              </View>
              <Text style={[styles.wordRange, { color: soft }]}>
                ≈ {guidedSpeakingExpectedResponseRange(stage)}
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: soft }]}>Malli</Text>
            <Text style={[styles.modelText, { color: text }]}>{stage.modelFi}</Text>

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
          </View>

          <View style={[styles.practiceCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.sectionLabel, { color: soft }]}>Tehtävä</Text>
            <Text style={[styles.promptText, { color: text }]}>{stage.promptFi}</Text>

            {stage.responseFrameFi ? (
              <View style={[styles.frameBox, { backgroundColor: raised, borderColor: border }]}>
                <Text style={[styles.frameText, { color: text }]}>{stage.responseFrameFi}</Text>
              </View>
            ) : null}

            {stage.supportFi.length ? (
              <View style={styles.supportRow}>
                {stage.supportFi.map((item) => (
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
              <View
                accessibilityLiveRegion="polite"
                style={[styles.transcriptBox, { backgroundColor: raised, borderColor: success }]}
              >
                <Text style={[styles.transcriptMarker, { color: success }]}>✓</Text>
                <Text style={[styles.transcriptText, { color: text }]}>{transcript}</Text>
              </View>
            ) : null}

            {recorder.error ? (
              <View accessibilityRole="alert" style={[styles.errorBox, { borderColor: '#FF8B8B' }]}>
                <Text style={styles.errorText}>{recorder.error}</Text>
                {attempted ? (
                  <Text style={[styles.supportNote, { color: muted }]}>
                    Yritys on tallennettu harjoitteluksi. Voit yrittää uudelleen tai jatkaa seuraavaan vaiheeseen.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={[styles.nextCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.nextCopy}>
              <Text style={[styles.nextTitle, { color: text }]}>
                {stageIndex === stages.length - 1
                  ? t('commonOpenRoleplay')
                  : t('commonNext')}
              </Text>
              <Text style={[styles.nextDetail, { color: muted }]}>
                {stageIndex === stages.length - 1
                  ? 'Seuraavaksi käytät samoja taitoja avoimessa keskustelussa.'
                  : stages[stageIndex + 1]?.goalFi}
              </Text>
            </View>
            <Pressable
              onPress={advance}
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
                {stageIndex === stages.length - 1
                  ? t('commonOpenRoleplay')
                  : t('commonNext')}
              </Text>
            </Pressable>
          </View>
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
  title: { fontSize: 28, lineHeight: 34, fontWeight: '850' },
  subtitle: { fontSize: 15, lineHeight: 22 },
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
  modelCard: { borderRadius: 22, borderWidth: 1, padding: 17, gap: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stageBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  stageBadgeText: { fontSize: 11, fontWeight: '900' },
  wordRange: { fontSize: 11, fontWeight: '700' },
  modelText: { fontSize: 21, lineHeight: 30, fontWeight: '750' },
  listenButton: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' },
  listenButtonText: { fontSize: 13, fontWeight: '900' },
  supportNote: { fontSize: 12, lineHeight: 18 },
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
  nextCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 14 },
  nextCopy: { gap: 4 },
  nextTitle: { fontSize: 17, lineHeight: 23, fontWeight: '850' },
  nextDetail: { fontSize: 13, lineHeight: 20 },
  nextButton: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  nextButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
