import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { PathwayBadge, SkillBadge } from '@ui/learningExperience';
import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';
import { useTranslator } from '../features/i18n';
import HealthcareReportWritingScreen from '../features/professional/screens/HealthcareReportWritingScreen';
import {
  buildProfessionalMissionChain,
  type ProfessionalMissionChainStep,
} from '../features/professional/professionalMissionChain';
import { useSubscriptionStore } from './subscriptionStore';
import { usePreferencesStore } from './preferencesStore';

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  initialLevelBand?: RoleplayLevelBand;
  onOpenRoleplay?: (
    profession: Extract<RoleplayProfession, 'doctor' | 'nurse' | 'practical_nurse'>,
    scenarioId?: string | null,
    entryMode?: 'workplace' | 'interview',
  ) => void;
};

const CORE_PROFESSIONS = ['nurse', 'doctor', 'practical_nurse'] as const;
type Profession = typeof CORE_PROFESSIONS[number];

type TFunction = ReturnType<typeof useTranslator>['t'];
type ProfessionTool = {
  title: string;
  detail: string;
  cta: string;
  onPress?: () => void;
  disabled?: boolean;
};

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

function missionStepLabel(step: ProfessionalMissionChainStep): string {
  if (step.id === 'listen') return 'Listen';
  if (step.id === 'speak') return 'Speak';
  if (step.id === 'read') return 'Read';
  return 'Write + correct';
}

export default function ProfessionalRoute({
  onBack,
  onOpenMenu,
  initialLevelBand = 'B1-B2',
  onOpenRoleplay,
}: Props) {
  const { t } = useTranslator();
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const activeContext = useSubscriptionStore((state) => state.activeContext);
  const setActiveContext = useSubscriptionStore((state) => state.setActiveContext);
  const [reportWritingOpen, setReportWritingOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const entitledProfessions = useMemo(() => {
    const list = subscriptionStatus?.entitlements?.professions ?? [];
    return list.filter(
      (profession): profession is Profession =>
        profession === 'doctor' ||
        profession === 'nurse' ||
        profession === 'practical_nurse',
    );
  }, [subscriptionStatus?.entitlements?.professions]);

  const selectedProfession = useMemo<Profession>(() => {
    if (
      activeContext === 'doctor' ||
      activeContext === 'nurse' ||
      activeContext === 'practical_nurse'
    ) {
      return activeContext;
    }
    return entitledProfessions[0] ?? 'nurse';
  }, [activeContext, entitledProfessions]);

  useEffect(() => {
    if (entitledProfessions.length && !entitledProfessions.includes(selectedProfession)) {
      setActiveContext(entitledProfessions[0]);
    }
  }, [entitledProfessions, selectedProfession, setActiveContext]);

  useEffect(() => {
    setToolsOpen(false);
  }, [selectedProfession]);

  const isEntitled = (profession: Profession) => entitledProfessions.includes(profession);
  const heading = professionalDisplayName(selectedProfession, t);
  const missionChain = useMemo(
    () => buildProfessionalMissionChain(selectedProfession),
    [selectedProfession],
  );
  const mission = missionChain.mission;
  const professionQuery = `/cards?mode=vocabulary&domain=professional&profession=${selectedProfession}`;

  const launchMissionStep = (step: ProfessionalMissionChainStep) => {
    if (!step.available || !step.launch) return;
    setActiveContext(selectedProfession);
    router.push({
      pathname: step.launch.pathname,
      params: step.launch.params,
    } as never);
  };

  const pathwayTools: ProfessionTool[] = [
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={[styles.smallButton, { backgroundColor: palette.primarySurface }]}
          >
            <Text style={[styles.smallButtonText, { color: palette.primary }]}>
              ← {t('professionalBack')}
            </Text>
          </Pressable>
          <Pressable
            onPress={onOpenMenu}
            style={[styles.smallButton, { backgroundColor: palette.primarySurface }]}
          >
            <Text style={[styles.smallButtonText, { color: palette.primary }]}>
              {t('professionalMenu')}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          {t('professionalEyebrow')}
        </Text>
        <Text style={[styles.title, { color: palette.text }]}>{heading}</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          One workplace situation. Several language skills. Continue through the same context instead of starting over in unrelated exercises.
        </Text>

        <View style={styles.selectorRow}>
          {CORE_PROFESSIONS.map((profession) => {
            const selected = profession === selectedProfession;
            const entitled = isEntitled(profession);
            return (
              <Pressable
                key={profession}
                onPress={entitled ? () => setActiveContext(profession) : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !entitled }}
                style={[
                  styles.selectorPill,
                  {
                    backgroundColor: selected ? palette.primarySurfaceStrong : palette.surface,
                    borderColor: selected ? palette.primary : palette.border,
                  },
                  !entitled && styles.selectorPillLocked,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: selected ? palette.primary : palette.text },
                  ]}
                >
                  {professionalDisplayName(profession, t)}
                </Text>
                <Text style={[styles.selectorHint, { color: palette.textMuted }]}>
                  {entitled ? t('professionalEntitledHint') : t('professionalLockedHint')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.skillIdentityRow}>
          <PathwayBadge pathway="professional" palette={palette} compact />
          <SkillBadge skill="listening" palette={palette} compact />
          <SkillBadge skill="speaking" palette={palette} compact />
          <SkillBadge skill="reading" palette={palette} compact />
          <SkillBadge skill="writing" palette={palette} compact />
        </View>

        <View
          style={[
            styles.missionHero,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View style={styles.missionHeroTop}>
            <View style={styles.missionHeroTitleWrap}>
              <Text style={[styles.missionKicker, { color: palette.accent }]}>
                Current mission · {mission.levelBand}
              </Text>
              <Text style={[styles.missionHeroTitle, { color: palette.text }]}>
                {mission.title}
              </Text>
            </View>
            <View style={[styles.readyBadge, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.readyBadgeText, { color: palette.success }]}>Ready</Text>
            </View>
          </View>

          <Text style={[styles.missionSituation, { color: palette.textMuted }]}>
            {mission.situation}
          </Text>

          <View style={[styles.goalBox, { backgroundColor: palette.surfaceMuted }]}>
            <Text style={[styles.goalLabel, { color: palette.textSoft }]}>Mission goal</Text>
            <Text style={[styles.goalValue, { color: palette.text }]}>
              {mission.communicativeGoal}
            </Text>
          </View>

          <Text style={[styles.missionMeta, { color: palette.textSoft }]}>
            Audience: {mission.audience} · Register: {mission.register}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start mission with ${missionStepLabel(missionChain.primaryStep)}`}
            onPress={() => launchMissionStep(missionChain.primaryStep)}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Start mission · {missionStepLabel(missionChain.primaryStep)}
            </Text>
          </Pressable>

          <Text style={[styles.primaryHint, { color: palette.textMuted }]}>
            Start by listening to the workplace message, then carry the same information into Speaking, Reading and Writing.
          </Text>
        </View>

        <View
          style={[
            styles.chainCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.chainTitle, { color: palette.text }]}>Mission path</Text>
          <Text style={[styles.chainSubtitle, { color: palette.textMuted }]}>
            The context stays the same across each available skill. Opening a step does not claim completion; the canonical activity owns its real result.
          </Text>

          <View style={styles.chainList}>
            {missionChain.steps.map((step, index) => (
              <View key={step.id} style={styles.chainRowWrap}>
                <View
                  style={[
                    styles.chainRow,
                    {
                      backgroundColor: palette.surfaceMuted,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.stepNumber,
                      {
                        backgroundColor: step.available
                          ? palette.primarySurfaceStrong
                          : palette.surfaceRaised,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumberText,
                        { color: step.available ? palette.primary : palette.textSoft },
                      ]}
                    >
                      {step.order}
                    </Text>
                  </View>

                  <View style={styles.stepCopy}>
                    <View style={styles.stepHeadingRow}>
                      <Text style={[styles.stepSkill, { color: palette.text }]}>
                        {missionStepLabel(step)}
                      </Text>
                      <Text
                        style={[
                          styles.stepStatus,
                          { color: step.available ? palette.success : palette.textSoft },
                        ]}
                      >
                        {step.availabilityLabel}
                      </Text>
                    </View>
                    <Text style={[styles.stepTitle, { color: palette.text }]}>
                      {step.title}
                    </Text>
                    <Text style={[styles.stepDetail, { color: palette.textMuted }]}>
                      {step.detail}
                    </Text>
                  </View>

                  {step.available ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${missionStepLabel(step)} step`}
                      onPress={() => launchMissionStep(step)}
                      style={[styles.stepButton, { borderColor: palette.primary }]}
                    >
                      <Text style={[styles.stepButtonText, { color: palette.primary }]}>Open</Text>
                    </Pressable>
                  ) : (
                    <View style={[styles.lockedBadge, { borderColor: palette.borderStrong }]}>
                      <Text style={[styles.lockedBadgeText, { color: palette.textSoft }]}>Planned</Text>
                    </View>
                  )}
                </View>
                {index < missionChain.steps.length - 1 ? (
                  <View style={[styles.chainLine, { backgroundColor: palette.border }]} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.safetyCard,
            { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.safetyTitle, { color: palette.text }]}>Language practice boundary</Text>
          <Text style={[styles.safetyText, { color: palette.textMuted }]}>
            {mission.safetyFrame.authorityBoundary}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: toolsOpen }}
          onPress={() => setToolsOpen((open) => !open)}
          style={[styles.moreButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <View style={styles.moreButtonCopy}>
            <Text style={[styles.moreButtonTitle, { color: palette.text }]}>
              More professional practice
            </Text>
            <Text style={[styles.moreButtonDetail, { color: palette.textMuted }]}>
              Cards, standalone Reading/Writing, open Roleplay, Interview and Report Writing.
            </Text>
          </View>
          <Text style={[styles.moreButtonChevron, { color: palette.primary }]}>
            {toolsOpen ? '−' : '+'}
          </Text>
        </Pressable>

        {toolsOpen ? (
          <View style={styles.toolStack}>
            {pathwayTools.map((tool) => (
              <View
                key={tool.title}
                style={[
                  styles.toolCard,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.toolTitle, { color: palette.text }]}>{tool.title}</Text>
                <Text style={[styles.toolDetail, { color: palette.textMuted }]}>{tool.detail}</Text>
                <Pressable
                  onPress={tool.disabled ? undefined : tool.onPress}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: Boolean(tool.disabled) }}
                  style={[
                    styles.secondaryButton,
                    { borderColor: palette.primary },
                    tool.disabled && styles.disabledButton,
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.primary }]}>
                    {tool.cta}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={[styles.footerNote, { color: palette.textSoft }]}>
          Mission content is original KieliValmis language-learning material. It is not a professional qualification or clinical decision-support tool.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallButton: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 13, fontWeight: '800' },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodySm, lineHeight: 20 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorPill: {
    minWidth: 124,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 2,
  },
  selectorPillLocked: { opacity: 0.52 },
  selectorText: { fontSize: 12, fontWeight: '800' },
  selectorHint: { fontSize: 10, lineHeight: 14 },
  skillIdentityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  missionHero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  missionHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  missionHeroTitleWrap: { flex: 1, gap: 5 },
  missionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  missionHeroTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900' },
  readyBadge: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 11,
    justifyContent: 'center',
  },
  readyBadgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  missionSituation: { fontSize: 14, lineHeight: 22 },
  goalBox: { borderRadius: 16, padding: 14, gap: 4 },
  goalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  goalValue: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  missionMeta: { fontSize: 12, lineHeight: 18 },
  primaryButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  primaryHint: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  chainCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  chainTitle: { fontSize: 19, fontWeight: '900' },
  chainSubtitle: { fontSize: 13, lineHeight: 20 },
  chainList: { marginTop: 4 },
  chainRowWrap: { alignItems: 'stretch' },
  chainRow: {
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chainLine: { width: 2, height: 12, alignSelf: 'flex-start', marginLeft: 30 },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { fontSize: 13, fontWeight: '900' },
  stepCopy: { flex: 1, gap: 3 },
  stepHeadingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  stepSkill: { fontSize: 14, fontWeight: '900' },
  stepStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  stepTitle: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  stepDetail: { fontSize: 12, lineHeight: 18 },
  stepButton: {
    minHeight: 36,
    minWidth: 60,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stepButtonText: { fontSize: 12, fontWeight: '900' },
  lockedBadge: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  lockedBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  safetyCard: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 5 },
  safetyTitle: { fontSize: 13, fontWeight: '900' },
  safetyText: { fontSize: 12, lineHeight: 18 },
  moreButton: {
    minHeight: 78,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moreButtonCopy: { flex: 1, gap: 3 },
  moreButtonTitle: { fontSize: 16, fontWeight: '900' },
  moreButtonDetail: { fontSize: 12, lineHeight: 18 },
  moreButtonChevron: { fontSize: 24, lineHeight: 28, fontWeight: '500' },
  toolStack: { gap: 10 },
  toolCard: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 8 },
  toolTitle: { fontSize: 15, fontWeight: '800' },
  toolDetail: { fontSize: 12, lineHeight: 18 },
  secondaryButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: { fontSize: 12, fontWeight: '800' },
  disabledButton: { opacity: 0.42 },
  footerNote: { fontSize: 11, lineHeight: 17, textAlign: 'center', paddingVertical: 6 },
});
