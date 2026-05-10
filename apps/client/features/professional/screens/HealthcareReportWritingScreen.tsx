import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@ui/theme';

import {
  firstScenarioForProfession,
  scenariosForProfession,
  type HealthcareProfession,
  type HealthcareReportScenario,
  type HealthcareReportType,
} from '../data/healthcareReportWriting';
import { useTranslator } from '../../i18n';

type Props = {
  profession: HealthcareProfession;
  onBack: () => void;
};

type FeedbackResult = {
  score: number;
  strengths: string[];
  missing: string[];
  languageTips: string[];
};

type TFunction = ReturnType<typeof useTranslator>['t'];

function reportTypeTitle(reportType: HealthcareReportType, t: TFunction): string {
  switch (reportType) {
    case 'during_shift':
      return t('professionalReportTypeDuringShift');
    case 'shift_handover':
      return t('professionalReportTypeShiftHandover');
    case 'interim_assessment':
      return t('professionalReportTypeInterimAssessment');
    case 'final_assessment':
      return t('professionalReportTypeFinalAssessment');
    case 'discharge':
      return t('professionalReportTypeDischarge');
    case 'ed_to_ward_transfer':
      return t('professionalReportTypeEdToWardTransfer');
    case 'condition_change':
      return t('professionalReportTypeConditionChange');
    default:
      return t('professionalReportWritingTitle');
  }
}

function scenarioTitle(scenario: HealthcareReportScenario, t: TFunction): string {
  switch (scenario.id) {
    case 'nurse_shift_handover_post_op_pain':
      return t('professionalReportScenarioNurseShiftHandoverPostOpPainTitle');
    case 'practical_nurse_shift_handover_evening_care':
      return t('professionalReportScenarioPracticalNurseShiftHandoverEveningCareTitle');
    case 'doctor_shift_handover_observation_plan':
      return t('professionalReportScenarioDoctorShiftHandoverObservationPlanTitle');
    case 'nurse_ed_to_ward_tachycardia':
      return t('professionalReportScenarioNurseEdToWardTachycardiaTitle');
    case 'practical_nurse_during_shift_mobility':
      return t('professionalReportScenarioPracticalNurseDuringShiftMobilityTitle');
    case 'doctor_interim_assessment_chest_pain':
      return t('professionalReportScenarioDoctorInterimAssessmentChestPainTitle');
    default:
      return scenario.title;
  }
}

function scenarioWorkplaceContext(scenario: HealthcareReportScenario, t: TFunction): string {
  switch (scenario.id) {
    case 'nurse_shift_handover_post_op_pain':
      return t('professionalReportScenarioNurseShiftHandoverPostOpPainContext');
    case 'practical_nurse_shift_handover_evening_care':
      return t('professionalReportScenarioPracticalNurseShiftHandoverEveningCareContext');
    case 'doctor_shift_handover_observation_plan':
      return t('professionalReportScenarioDoctorShiftHandoverObservationPlanContext');
    case 'nurse_ed_to_ward_tachycardia':
      return t('professionalReportScenarioNurseEdToWardTachycardiaContext');
    case 'practical_nurse_during_shift_mobility':
      return t('professionalReportScenarioPracticalNurseDuringShiftMobilityContext');
    case 'doctor_interim_assessment_chest_pain':
      return t('professionalReportScenarioDoctorInterimAssessmentChestPainContext');
    default:
      return scenario.workplaceContext;
  }
}

function scenarioTaskInstruction(scenario: HealthcareReportScenario, t: TFunction): string {
  switch (scenario.id) {
    case 'nurse_shift_handover_post_op_pain':
      return t('professionalReportScenarioNurseShiftHandoverPostOpPainTask');
    case 'practical_nurse_shift_handover_evening_care':
      return t('professionalReportScenarioPracticalNurseShiftHandoverEveningCareTask');
    case 'doctor_shift_handover_observation_plan':
      return t('professionalReportScenarioDoctorShiftHandoverObservationPlanTask');
    case 'nurse_ed_to_ward_tachycardia':
      return t('professionalReportScenarioNurseEdToWardTachycardiaTask');
    case 'practical_nurse_during_shift_mobility':
      return t('professionalReportScenarioPracticalNurseDuringShiftMobilityTask');
    case 'doctor_interim_assessment_chest_pain':
      return t('professionalReportScenarioDoctorInterimAssessmentChestPainTask');
    default:
      return scenario.taskInstruction;
  }
}



function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function buildFeedback(answer: string, scenario: HealthcareReportScenario, t: TFunction): FeedbackResult {
  const trimmed = answer.trim();
  const strengths: string[] = [];
  const missing: string[] = [];
  const languageTips: string[] = [];

  const checks = [
    {
      ok: containsAny(trimmed, ['siirrettiin', 'siirtyi', 'tuli', 'otettiin', 'seurannassa']),
      strength: t('professionalReportFeedbackSituationStrength'),
      missing: t('professionalReportFeedbackSituationMissing'),
    },
    {
      ok: containsAny(trimmed, ['vointi', 'vitaalit', 'syke', 'verenpaine', 'hengitys', 'kipu', 'väsynyt', 'liikkuminen']),
      strength: t('professionalReportFeedbackConditionStrength'),
      missing: t('professionalReportFeedbackConditionMissing'),
    },
    {
      ok: containsAny(trimmed, ['seurataan', 'jatketaan', 'ohjeistettu', 'konsultoidaan', 'avustettiin', 'varmistettiin']),
      strength: t('professionalReportFeedbackFollowUpStrength'),
      missing: t('professionalReportFeedbackFollowUpMissing'),
    },
    {
      ok: trimmed.length >= 120,
      strength: t('professionalReportFeedbackLengthStrength'),
      missing: t('professionalReportFeedbackLengthMissing'),
    },
  ];

  checks.forEach((check) => {
    if (check.ok) strengths.push(check.strength);
    else missing.push(check.missing);
  });

  if (trimmed.includes('sirrettiin')) {
    languageTips.push(t('professionalReportFeedbackSpellingTip'));
  }
  if (containsAny(trimmed, ['tosi huono', 'hankala', 'sekava tyyppi'])) {
    languageTips.push(t('professionalReportFeedbackNeutralToneTip'));
  }
  if (!containsAny(trimmed, ['vuoksi', 'takia', 'seurataan', 'jatkohoitoon', 'ohjeistettu'])) {
    languageTips.push(t('professionalReportFeedbackLinkingWordsTip'));
  }
  if (languageTips.length === 0) {
    languageTips.push(t('professionalReportFeedbackGoodStyleTip'));
  }

  return {
    score: Math.max(1, Math.min(4, strengths.length)),
    strengths,
    missing,
    languageTips,
  };
}

export default function HealthcareReportWritingScreen({ profession, onBack }: Props) {
  const { t } = useTranslator();
  const scenarios = useMemo(() => scenariosForProfession(profession), [profession]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(firstScenarioForProfession(profession).id);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? firstScenarioForProfession(profession);
  const selectedTypeTitle = reportTypeTitle(selectedScenario.reportType, t);

  function submit() {
    setFeedback(buildFeedback(answer, selectedScenario, t));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>← {t('professionalBack')}</Text>
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>{t('professionalReportWritingEyebrow')}</Text>
        <Text style={styles.title}>{t('professionalReportWritingTitle')}</Text>
        <Text style={styles.subtitle}>{t('professionalReportWritingSubtitle')}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('professionalReportWritingWorkplaceRuleTitle')}</Text>
          <Text style={styles.infoBody}>{t('professionalReportWritingWorkplaceRuleBody')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('professionalReportWritingScenarioTitle')}</Text>
          <View style={styles.scenarioStack}>
            {scenarios.map((scenario) => {
              const selected = scenario.id === selectedScenario.id;
              return (
                <Pressable
                  key={scenario.id}
                  onPress={() => {
                    setSelectedScenarioId(scenario.id);
                    setAnswer('');
                    setFeedback(null);
                  }}
                  style={[styles.scenarioButton, selected && styles.scenarioButtonActive]}
                >
                  <Text style={[styles.scenarioButtonTitle, selected && styles.scenarioButtonTitleActive]}>{scenarioTitle(scenario, t)}</Text>
                  <Text style={styles.scenarioButtonType}>
                    {reportTypeTitle(scenario.reportType, t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.badge}>{selectedTypeTitle}</Text>
          <Text style={styles.sectionTitle}>{scenarioTitle(selectedScenario, t)}</Text>
          <Text style={styles.bodyText}>{scenarioWorkplaceContext(selectedScenario, t)}</Text>
          <Text style={styles.taskText}>{scenarioTaskInstruction(selectedScenario, t)}</Text>

          <Text style={styles.listTitle}>{t('professionalReportWritingKeyFacts')}</Text>
          {selectedScenario.keyFacts.map((fact) => (
            <Text key={fact} style={styles.bullet}>• {fact}</Text>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('professionalReportWritingYourText')}</Text>
          <TextInput
            value={answer}
            onChangeText={(value) => {
              setAnswer(value);
              setFeedback(null);
            }}
            multiline
            textAlignVertical="top"
            placeholder={t('professionalReportWritingPlaceholder')}
            placeholderTextColor="#6F83A8"
            style={styles.input}
          />
          <Pressable onPress={submit} style={[styles.primaryButton, answer.trim().length < 20 && styles.disabledButton]} disabled={answer.trim().length < 20}>
            <Text style={styles.primaryButtonText}>{t('professionalReportWritingCheck')}</Text>
          </Pressable>
        </View>

        {feedback ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('professionalReportWritingFeedbackTitle')}</Text>
            <Text style={styles.scoreText}>{t('professionalReportWritingScore')}: {feedback.score}/4</Text>

            <Text style={styles.listTitle}>{t('professionalReportWritingStrengths')}</Text>
            {feedback.strengths.map((item) => <Text key={item} style={styles.bullet}>✓ {item}</Text>)}

            <Text style={styles.listTitle}>{t('professionalReportWritingMissing')}</Text>
            {feedback.missing.length ? feedback.missing.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>) : <Text style={styles.bullet}>✓ {t('professionalReportWritingNothingMajorMissing')}</Text>}

            <Text style={styles.listTitle}>{t('professionalReportWritingLanguageTips')}</Text>
            {feedback.languageTips.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('professionalReportWritingModelAnswer')}</Text>
          <Text style={styles.modelAnswer}>{selectedScenario.modelAnswer}</Text>

          <Text style={styles.listTitle}>{t('professionalReportWritingUsefulPhrases')}</Text>
          {selectedScenario.usefulPhrases.map((phrase) => <Text key={phrase} style={styles.bullet}>• {phrase}</Text>)}

          <Text style={styles.listTitle}>{t('professionalReportWritingCommonMistakes')}</Text>
          {selectedScenario.commonMistakes.map((mistake) => <Text key={mistake} style={styles.bullet}>• {mistake}</Text>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallButton: { minHeight: 38, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#EAF0FF', alignSelf: 'flex-start' },
  smallButtonText: { color: '#2453D4', fontSize: 13, fontWeight: '800' },
  eyebrow: { color: '#2DD4BF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: colors.text, ...typography.h1 },
  subtitle: { color: colors.textMuted, ...typography.bodySm, lineHeight: 21 },
  infoCard: { borderRadius: 22, backgroundColor: '#113C38', borderWidth: 1, borderColor: '#2DD4BF', padding: 16, gap: 8 },
  infoTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  infoBody: { color: '#D6FFF8', fontSize: 13, lineHeight: 20 },
  sectionCard: { borderRadius: 24, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  bodyText: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  taskText: { color: '#D6E2FF', fontSize: 14, lineHeight: 22, fontWeight: '700' },
  scenarioStack: { gap: 10 },
  scenarioButton: { borderRadius: 18, borderWidth: 1, borderColor: '#223252', backgroundColor: '#101A30', padding: 14, gap: 4 },
  scenarioButtonActive: { borderColor: '#2DD4BF', backgroundColor: '#113C38' },
  scenarioButtonTitle: { color: '#D6E2FF', fontSize: 14, fontWeight: '800' },
  scenarioButtonTitleActive: { color: '#FFFFFF' },
  scenarioButtonType: { color: '#8EA3C3', fontSize: 12, lineHeight: 18 },
  badge: { alignSelf: 'flex-start', color: '#2DD4BF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 6 },
  bullet: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  input: { minHeight: 160, borderRadius: 18, borderWidth: 1, borderColor: '#223252', backgroundColor: '#0B1121', color: '#FFFFFF', padding: 14, fontSize: 14, lineHeight: 21 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primary },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  scoreText: { color: '#2DD4BF', fontSize: 15, fontWeight: '800' },
  modelAnswer: { color: '#FFFFFF', fontSize: 14, lineHeight: 22, backgroundColor: '#0B1121', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#223252' },
});
