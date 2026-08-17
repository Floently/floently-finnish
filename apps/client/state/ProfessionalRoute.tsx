import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { PathwayBadge, SkillBadge } from '@ui/learningExperience';
import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';
import { useTranslator } from '../features/i18n';
import HealthcareReportWritingScreen from '../features/professional/screens/HealthcareReportWritingScreen';
import { useSubscriptionStore } from './subscriptionStore';
import { usePreferencesStore } from './preferencesStore';

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  initialLevelBand?: RoleplayLevelBand;
  onOpenRoleplay?: (profession: Extract<RoleplayProfession, 'doctor' | 'nurse' | 'practical_nurse'>, scenarioId?: string | null, entryMode?: 'workplace' | 'interview') => void;
};

const CORE_PROFESSIONS = ['nurse', 'doctor', 'practical_nurse'] as const;
type Profession = typeof CORE_PROFESSIONS[number];

type TFunction = ReturnType<typeof useTranslator>['t'];
type ProfessionMission = { title: string; detail: string; cta: string; onPress?: () => void; disabled?: boolean };

function professionalDisplayName(profession: Profession, t: TFunction): string {
  switch (profession) {
    case 'doctor':
      return t('professionalNameDoctor');
    case 'practical_nurse':
      return t('professionalNamePracticalNurse');
    default:
      return t('professionalNameNurse');
  }
}

function buildMissions(profession: Profession, t: TFunction): Array<{ title: string; summary: string }> {
  switch (profession) {
    case 'doctor':
      return [
        { title: t('professionalDoctorMissionInterviewTitle'), summary: t('professionalDoctorMissionInterviewSummary') },
        { title: t('professionalDoctorMissionExplainTitle'), summary: t('professionalDoctorMissionExplainSummary') },
        { title: t('professionalDoctorMissionDocumentTitle'), summary: t('professionalDoctorMissionDocumentSummary') },
      ];
    case 'practical_nurse':
      return [
        { title: t('professionalPracticalNurseMissionDailyCareTitle'), summary: t('professionalPracticalNurseMissionDailyCareSummary') },
        { title: t('professionalPracticalNurseMissionReassureTitle'), summary: t('professionalPracticalNurseMissionReassureSummary') },
        { title: t('professionalPracticalNurseMissionReportTitle'), summary: t('professionalPracticalNurseMissionReportSummary') },
      ];
    default:
      return [
        { title: t('professionalNurseMissionHandoverTitle'), summary: t('professionalNurseMissionHandoverSummary') },
        { title: t('professionalNurseMissionPatientTitle'), summary: t('professionalNurseMissionPatientSummary') },
        { title: t('professionalNurseMissionEscalationTitle'), summary: t('professionalNurseMissionEscalationSummary') },
      ];
  }
}

function interviewScenarioId(profession: Profession): string {
  switch (profession) {
    case 'doctor':
      return 'doctor_patient_interview';
    case 'practical_nurse':
      return 'practical_nurse_interview';
    default:
      return 'nurse_interview_beta';
  }
}

export default function ProfessionalRoute({ onBack, onOpenMenu, initialLevelBand = 'B1-B2', onOpenRoleplay }: Props) {
  const { t } = useTranslator();
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const activeContext = useSubscriptionStore((state) => state.activeContext);
  const setActiveContext = useSubscriptionStore((state) => state.setActiveContext);
  const entitledProfessions = useMemo(() => {
    const list = subscriptionStatus?.entitlements?.professions ?? [];
    return list.filter((profession): profession is Profession => profession === 'doctor' || profession === 'nurse' || profession === 'practical_nurse');
  }, [subscriptionStatus?.entitlements?.professions]);
  const [reportWritingOpen, setReportWritingOpen] = useState(false);

  const selectedProfession = useMemo<Profession>(() => {
    if (activeContext === 'doctor' || activeContext === 'nurse' || activeContext === 'practical_nurse') return activeContext;
    return entitledProfessions[0] ?? 'nurse';
  }, [activeContext, entitledProfessions]);

  useEffect(() => {
    if (entitledProfessions.length && !entitledProfessions.includes(selectedProfession)) {
      setActiveContext(entitledProfessions[0]);
    }
  }, [entitledProfessions, selectedProfession, setActiveContext]);

  const isEntitled = (profession: Profession) => entitledProfessions.includes(profession);
  const missions = buildMissions(selectedProfession, t);
  const heading = professionalDisplayName(selectedProfession, t);
  const professionQuery = `/cards?mode=vocabulary&domain=professional&profession=${selectedProfession}`;
  const pathwayMissions: ProfessionMission[] = [
    {
      title: t('ykiRouteSkillReading'),
      detail: t('professionalSubtitle'),
      cta: t('commonOpen'),
      onPress: () => {
        setActiveContext(selectedProfession);
        router.push('/professional/reading' as never);
      },
      disabled: !isEntitled(selectedProfession),
    },
    {
      title: t('ykiRouteSkillWriting'),
      detail: t('professionalSubtitle'),
      cta: t('commonOpen'),
      onPress: () => {
        setActiveContext(selectedProfession);
        router.push('/professional/writing' as never);
      },
      disabled: !isEntitled(selectedProfession),
    },
    {
      title: t('professionalFlashcardsTitle'),
      detail: t('professionalFlashcardsDetail'),
      cta: t('professionalOpenFlashcards'),
      onPress: () => router.push(professionQuery as never),
      disabled: !isEntitled(selectedProfession),
    },
    {
      title: t('professionalRoleplayTitle'),
      detail: t('professionalRoleplayDetail'),
      cta: t('professionalOpenRoleplay'),
      onPress: () => {
        setActiveContext(selectedProfession);
        onOpenRoleplay?.(selectedProfession, null, 'workplace');
      },
      disabled: !isEntitled(selectedProfession),
    },
    {
      title: t('professionalInterviewTitle'),
      detail: t('professionalInterviewDetail'),
      cta: t('professionalOpenInterview'),
      onPress: () => {
        setActiveContext(selectedProfession);
        onOpenRoleplay?.(selectedProfession, interviewScenarioId(selectedProfession), 'interview');
      },
      disabled: !isEntitled(selectedProfession),
    },
    {
      title: t('professionalReportWritingTitle'),
      detail: t('professionalReportWritingSubtitle'),
      cta: t('commonOpen'),
      onPress: () => {
        setActiveContext(selectedProfession);
        setReportWritingOpen(true);
      },
      disabled: !isEntitled(selectedProfession),
    },
  ];

  if (reportWritingOpen) {
    return (
      <HealthcareReportWritingScreen
        profession={selectedProfession}
        onBack={() => setReportWritingOpen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.smallButton}><Text style={styles.smallButtonText}>← {t('professionalBack')}</Text></Pressable>
          <Pressable onPress={onOpenMenu} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('professionalMenu')}</Text></Pressable>
        </View>

        <Text style={styles.eyebrow}>{t('professionalEyebrow')}</Text>
        <Text style={styles.title}>{heading}</Text>
        <Text style={styles.subtitle}>{t('professionalSubtitle')}</Text>

        <View style={styles.selectorRow}>
          {CORE_PROFESSIONS.map((profession) => {
            const selected = profession === selectedProfession;
            const entitled = isEntitled(profession);
            return (
              <Pressable
                key={profession}
                onPress={entitled ? () => setActiveContext(profession) : undefined}
                style={[styles.selectorPill, selected && styles.selectorPillActive, !entitled && styles.selectorPillLocked]}
              >
                <Text style={[styles.selectorText, selected && styles.selectorTextActive]}>{professionalDisplayName(profession, t)}</Text>
                <Text style={[styles.selectorHint, selected && styles.selectorHintActive]}>{entitled ? t('professionalEntitledHint') : t('professionalLockedHint')}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.skillIdentityRow}>
          <PathwayBadge pathway="professional" palette={palette} compact />
          <SkillBadge skill="reading" palette={palette} compact />
          <SkillBadge skill="writing" palette={palette} compact />
          <SkillBadge skill="speaking" palette={palette} compact />
          <SkillBadge skill="vocabulary" palette={palette} compact />
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>{t('professionalAssignedPathway')}</Text>
          <Text style={styles.overviewTitle}>{heading} {t('professionalPathwayLabel')} · {initialLevelBand}</Text>
          <Text style={styles.overviewBody}>{t('professionalOverviewBody')}</Text>
        </View>

        <View style={styles.missionStack}>
          {pathwayMissions.map((mission) => (
            <View key={mission.title} style={styles.missionCard}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <Text style={styles.missionDetail}>{mission.detail}</Text>
              <Pressable onPress={mission.disabled ? undefined : mission.onPress} style={[styles.primaryButton, mission.disabled && styles.disabledButton]}><Text style={styles.primaryButtonText}>{mission.cta}</Text></Pressable>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>{t('professionalGoalsTitle')}</Text>
          {missions.map((mission) => (
            <View key={mission.title} style={styles.goalRow}>
              <View style={styles.goalDot} />
              <View style={styles.goalTextWrap}>
                <Text style={styles.goalTitle}>{mission.title}</Text>
                <Text style={styles.goalSummary}>{mission.summary}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallButton: { minHeight: 38, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#EAF0FF' },
  smallButtonText: { color: '#2453D4', fontSize: 13, fontWeight: '800' },
  eyebrow: { color: '#2DD4BF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: colors.text, ...typography.h1 },
  subtitle: { color: colors.textMuted, ...typography.bodySm, lineHeight: 20 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorPill: { minWidth: 124, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#223252', backgroundColor: '#101A30', gap: 2 },
  selectorPillActive: { backgroundColor: '#113C38', borderColor: '#2DD4BF' },
  selectorPillLocked: { borderColor: '#3B3B58', opacity: 0.72 },
  selectorText: { color: '#D6E2FF', fontSize: 12, fontWeight: '800' },
  selectorTextActive: { color: '#FFFFFF' },
  selectorHint: { color: '#8EA3C3', fontSize: 10, lineHeight: 14 },
  selectorHintActive: { color: '#D6E2FF' },
  skillIdentityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overviewCard: { borderRadius: 24, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10 },
  overviewLabel: { color: '#2DD4BF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  overviewTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  overviewBody: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  missionStack: { gap: 12 },
  missionCard: { borderRadius: 24, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12 },
  missionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  missionDetail: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primary },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  noteCard: { borderRadius: 24, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  noteTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  goalRow: { flexDirection: 'row', gap: 12 },
  goalDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8, backgroundColor: '#2DD4BF' },
  goalTextWrap: { flex: 1, gap: 2 },
  goalTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  goalSummary: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
