import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useTranslator } from '../../i18n';
import type { RoleplayLevelBand, RoleplayProfession, RoleplayScenarioSummary } from '@core/api/roleplay';

const PROFESSION_ACCENTS: Record<RoleplayProfession, string> = {
  general: '#F0A436',
  nurse: '#2DD4BF',
  doctor: '#A78BFA',
  practical_nurse: '#4F7FFF',
};

type Props = {
  currentTurn: number;
  levelBand: RoleplayLevelBand;
  maxTurns: number;
  onBack: () => void;
  profession: RoleplayProfession;
  scenario: RoleplayScenarioSummary | null;
  personaName?: string;
};

export default function RoleplayScenarioHeader({
  currentTurn,
  levelBand,
  maxTurns,
  onBack,
  profession,
  scenario,
  personaName,
}: Props) {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const { t } = useTranslator();

  const accent = PROFESSION_ACCENTS[profession] ?? '#4F7FFF';
  const textColor = isDark ? '#F0F5FF' : palette.text;
  const mutedColor = isDark ? '#8EA3C3' : palette.textMuted;
  const softColor = isDark ? '#5C7299' : palette.textSoft;
  const borderColor = isDark ? '#1E2E47' : palette.border;
  const surfaceBg = isDark ? '#111B30' : palette.surface;
  const raisedBg = isDark ? '#16233E' : palette.surfaceMuted;

  const progressPct = Math.min((currentTurn / maxTurns) * 100, 100);

  return (
    <View style={styles.container}>
      {/* Nav row */}
      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: raisedBg, borderColor }]}>
          <Text style={[styles.backText, { color: mutedColor }]}>← {t('commonBack')}</Text>
        </Pressable>

        <View style={styles.badgeRow}>
          {personaName && (
            <View style={[styles.personaBadge, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
              <View style={[styles.personaDot, { backgroundColor: accent }]} />
              <Text style={[styles.personaText, { color: accent }]}>{personaName}</Text>
            </View>
          )}
          <View style={[styles.levelBadge, { backgroundColor: raisedBg, borderColor }]}>
            <Text style={[styles.levelText, { color: softColor }]}>
              {profession === 'general' ? t('roleplayGeneralFinnishLabel') : profession === 'doctor' ? t('professionalNameDoctor') : profession === 'practical_nurse' ? t('professionalNamePracticalNurse') : t('professionalNameNurse')} · {levelBand}
            </Text>
          </View>
        </View>
      </View>

      {/* Scenario info */}
      <View>
        <Text style={[styles.scenarioTitle, { color: textColor }]}>
          {scenario?.title ?? t('roleplayScenarioFallbackTitle')}
        </Text>
        <Text style={[styles.scenarioSub, { color: mutedColor }]}>
          {scenario?.prompt ?? t('roleplayScenarioFallbackPrompt')}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBlock}>
        <View style={[styles.progressTrack, { backgroundColor: raisedBg }]}>
          <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: accent }]} />
        </View>
        <Text style={[styles.progressLabel, { color: softColor }]}>
          {t('roleplayTurnLabel').replace('{current}', String(Math.min(currentTurn + 1, maxTurns))).replace('{max}', String(maxTurns))}
        </Text>
      </View>

      {/* Grammar tip */}
      {scenario?.grammarTip && (
        <View style={[styles.grammarTip, { backgroundColor: surfaceBg, borderColor }]}>
          <Text style={[styles.grammarLabel, { color: softColor }]}>{t('roleplayGrammarTipLabel')}</Text>
          <Text style={[styles.grammarText, { color: mutedColor }]}>{scenario.grammarTip}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { minHeight: 34, borderRadius: 999, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1 },
  backText: { fontSize: 13, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  personaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  personaDot: { width: 6, height: 6, borderRadius: 3 },
  personaText: { fontSize: 12, fontWeight: '700' },
  levelBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  levelText: { fontSize: 11, fontWeight: '700' },
  scenarioTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  scenarioSub: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  progressBlock: { gap: 5 },
  progressTrack: { height: 5, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressLabel: { fontSize: 11, fontWeight: '600' },
  grammarTip: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'flex-start' },
  grammarLabel: { fontSize: 11, fontWeight: '700', paddingTop: 1, minWidth: 72 },
  grammarText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
