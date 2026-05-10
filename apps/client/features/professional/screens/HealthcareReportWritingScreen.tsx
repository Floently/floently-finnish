import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@ui/theme';

import {
  HEALTHCARE_REPORT_TYPES,
  firstScenarioForProfession,
  scenariosForProfession,
  type HealthcareProfession,
  type HealthcareReportScenario,
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

function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function buildFeedback(answer: string, scenario: HealthcareReportScenario): FeedbackResult {
  const trimmed = answer.trim();
  const strengths: string[] = [];
  const missing: string[] = [];
  const languageTips: string[] = [];

  const checks = [
    {
      ok: containsAny(trimmed, ['siirrettiin', 'siirtyi', 'tuli', 'otettiin', 'seurannassa']),
      strength: 'Kerroit tilanteen tai siirtymisen selkeästi.',
      missing: 'Lisää alkuun mitä tapahtui tai miksi potilas/asukas on hoidossa.',
    },
    {
      ok: containsAny(trimmed, ['vointi', 'vitaalit', 'syke', 'verenpaine', 'hengitys', 'kipu', 'väsynyt', 'liikkuminen']),
      strength: 'Mainitsit voinnin tai havaittavan muutoksen.',
      missing: 'Lisää konkreettinen havainto voinnista, kivusta, vitaaleista tai toimintakyvystä.',
    },
    {
      ok: containsAny(trimmed, ['seurataan', 'jatketaan', 'ohjeistettu', 'konsultoidaan', 'avustettiin', 'varmistettiin']),
      strength: 'Kirjoitit jatkotoimen tai seurannan.',
      missing: 'Lisää mitä tehdään seuraavaksi tai mitä seuraavan vuoron pitää seurata.',
    },
    {
      ok: trimmed.length >= 120,
      strength: 'Vastauksessa on tarpeeksi sisältöä harjoitusta varten.',
      missing: 'Kirjoita hieman pidempi kirjaus: 3–5 selkeää virkettä riittää.',
    },
  ];

  checks.forEach((check) => {
    if (check.ok) strengths.push(check.strength);
    else missing.push(check.missing);
  });

  if (trimmed.includes('sirrettiin')) {
    languageTips.push('Korjaa kirjoitusasu: “sirrettiin” → “siirrettiin”.');
  }
  if (containsAny(trimmed, ['tosi huono', 'hankala', 'sekava tyyppi'])) {
    languageTips.push('Vaihda arvottava ilmaus neutraaliksi havainnoksi: kuvaa mitä näit, kuulit tai teit.');
  }
  if (!containsAny(trimmed, ['vuoksi', 'takia', 'seurataan', 'jatkohoitoon', 'ohjeistettu'])) {
    languageTips.push('Käytä ammatillisia sidossanoja: “vuoksi”, “stabiloinnin jälkeen”, “jatketaan seurantaa”.');
  }
  if (languageTips.length === 0) {
    languageTips.push('Pidä tyyli jatkossakin neutraalina, tiiviinä ja havaintoihin perustuvana.');
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
  const selectedType = HEALTHCARE_REPORT_TYPES.find((type) => type.id === selectedScenario.reportType);

  function submit() {
    setFeedback(buildFeedback(answer, selectedScenario));
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
                  <Text style={[styles.scenarioButtonTitle, selected && styles.scenarioButtonTitleActive]}>{scenario.title}</Text>
                  <Text style={styles.scenarioButtonType}>
                    {HEALTHCARE_REPORT_TYPES.find((type) => type.id === scenario.reportType)?.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.badge}>{selectedType?.title}</Text>
          <Text style={styles.sectionTitle}>{selectedScenario.title}</Text>
          <Text style={styles.bodyText}>{selectedScenario.workplaceContext}</Text>
          <Text style={styles.taskText}>{selectedScenario.taskInstruction}</Text>

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
