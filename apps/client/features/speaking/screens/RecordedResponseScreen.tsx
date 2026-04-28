import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import RoleplayMicButton from '../components/RoleplayMicButton';
import { useRoleplayRecorder } from '../hooks/useRoleplayRecorder';
import { uiSounds } from '../services/roleplayAudio';
import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';

const PROMPTS: Record<RoleplayProfession, string[]> = {
  general: [
    'Tell a colleague briefly what happened yesterday and what you will do next.',
    'Ask for clarification politely and then confirm the plan in one sentence.',
  ],
  nurse: [
    'Give a 30-second handover about pain level, medication, and what needs follow-up.',
    'Explain to a patient what will happen next and check if they understood.',
  ],
  doctor: [
    'Summarise the patient’s symptoms and your next recommendation in one short explanation.',
    'Explain a follow-up plan clearly and politely to a worried patient.',
  ],
  practical_nurse: [
    'Describe the client’s daily-care needs and one important observation from the shift.',
    'Explain the next care step calmly and clearly to a client.',
  ],
};

export default function RecordedResponseScreen({
  levelBand,
  onBack,
  profession,
}: {
  levelBand: RoleplayLevelBand;
  onBack: () => void;
  profession: RoleplayProfession;
}) {
  const recorder = useRoleplayRecorder('fi-FI');
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isLight = themeMode === 'light';
  const [promptIndex, setPromptIndex] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const prompt = useMemo(() => PROMPTS[profession][promptIndex % PROMPTS[profession].length], [profession, promptIndex]);

  async function toggleRecord() {
    if (!recorder.isRecording) {
      setTranscript(null);
      await recorder.startRecording();
      return;
    }
    const result = await recorder.stopRecording();
    if (result) {
      setTranscript(result);
      await uiSounds.success();
    }
  }

  const bgColor = isLight ? palette.background : '#121B30';
  const cardBg = isLight ? palette.surface : '#101A30';
  const cardBorder = isLight ? palette.border : '#223252';
  const textColor = isLight ? palette.text : '#F2F6FF';
  const mutedColor = isLight ? palette.textMuted : '#A1B1CC';
  const primaryColor = isLight ? palette.primary : '#2657F2';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} style={[styles.iconButton, isLight && { backgroundColor: palette.primarySurface }]}><Text style={[styles.iconButtonText, isLight && { color: palette.primary }]}>←</Text></Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>Recording speaking · {levelBand}</Text>
          <Pressable onPress={() => setPromptIndex((value) => value + 1)} style={[styles.iconButton, isLight && { backgroundColor: palette.primarySurface }]}><Text style={[styles.iconButtonText, isLight && { color: palette.primary }]}>↻</Text></Pressable>
        </View>

        <View style={[styles.waveCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.wavePanel, isLight && { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            {Array.from({ length: 24 }).map((_, index) => {
              const active = recorder.isRecording ? (index % 5) + 4 : (index % 4) + 2;
              return <View key={index} style={[styles.waveBar, { height: active * 10, backgroundColor: primaryColor }]} />;
            })}
          </View>
          <Text style={[styles.timer, { color: isLight ? palette.text : '#F7FBFF' }]}>{Math.round(recorder.elapsedMs / 1000).toString().padStart(2, '0')}s</Text>
          <RoleplayMicButton isRecording={recorder.isRecording} isBusy={recorder.phase === 'uploading'} onPress={() => void toggleRecord()} />
          <View style={styles.bottomActions}>
            <Pressable onPress={() => { setTranscript(null); void recorder.cancelRecording(); }} style={styles.ghostButton}><Text style={styles.ghostText}>Delete</Text></Pressable>
            <Pressable onPress={() => setSavedCount((value) => value + 1)} disabled={!transcript} style={[styles.saveButton, isLight && { backgroundColor: palette.primary }, !transcript && styles.disabledButton]}><Text style={[styles.saveText, isLight && { color: '#FFFFFF' }]}>Save</Text></Pressable>
          </View>
        </View>

        <View style={[styles.promptCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.promptLabel, { color: mutedColor }]}>Prompt</Text>
          <Text style={[styles.promptText, { color: textColor }]}>{prompt}</Text>
          <Text style={[styles.subtleText, { color: mutedColor }]}>Saved responses: {savedCount}</Text>
          {transcript ? <Text style={[styles.transcriptText, { color: textColor }]}>{transcript}</Text> : <Text style={[styles.subtleText, { color: mutedColor }]}>Your transcript will appear here after you stop recording.</Text>}
          {recorder.error ? <Text style={styles.errorText}>{recorder.error}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121B30' },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#F2F6FF', ...typography.h3 },
  iconButton: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2742' },
  iconButtonText: { color: '#D6E2FF', fontSize: 16, fontWeight: '800' },
  waveCard: { flex: 1, borderRadius: 28, backgroundColor: '#101A30', borderWidth: 1, borderColor: '#223252', padding: spacing.lg, justifyContent: 'space-between', alignItems: 'center' },
  wavePanel: { width: '100%', height: 180, borderRadius: 20, backgroundColor: '#0B1428', borderWidth: 1, borderColor: '#1E3152', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  waveBar: { width: 4, borderRadius: 999, backgroundColor: '#2657F2' },
  timer: { color: '#F7FBFF', fontSize: 36, fontWeight: '300' },
  bottomActions: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ghostButton: { minHeight: 40, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  ghostText: { color: '#D35D5D', fontSize: 13, fontWeight: '700' },
  saveButton: { minHeight: 42, borderRadius: 999, paddingHorizontal: 26, justifyContent: 'center', backgroundColor: '#FFFFFF' },
  disabledButton: { opacity: 0.45 },
  saveText: { color: '#0E1628', fontSize: 14, fontWeight: '800' },
  promptCard: { borderRadius: 22, backgroundColor: '#101A30', borderWidth: 1, borderColor: '#223252', padding: 16, gap: 10 },
  promptLabel: { color: '#90A4C8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  promptText: { color: '#F2F6FF', ...typography.body },
  subtleText: { color: '#A1B1CC', ...typography.bodySm },
  transcriptText: { color: '#E8F1FF', ...typography.bodySm, lineHeight: 20 },
  errorText: { color: '#FF8B8B', ...typography.bodySm },
});
