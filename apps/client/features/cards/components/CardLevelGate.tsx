import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { usePreferencesStore } from '../../../state/preferencesStore';
import { useTranslator } from '../../i18n';
import type { CardLevelBand, CardMode } from '../types';

const LEVELS: Array<{
  value: CardLevelBand;
  code: string;
  title: string;
  detail: string;
}> = [
  {
    value: 'A1_A2',
    code: 'A1–A2',
    title: 'Beginner',
    detail: 'High-frequency words, short phrases and supported grammar.',
  },
  {
    value: 'B1_B2',
    code: 'B1–B2',
    title: 'Intermediate',
    detail: 'Longer expressions, practical nuance and less support.',
  },
  {
    value: 'C1_C2',
    code: 'C1–C2',
    title: 'Advanced',
    detail: 'Precise vocabulary, complex structures and demanding recall.',
  },
];

function modeLabel(mode: CardMode, t: ReturnType<typeof useTranslator>['t']) {
  if (mode === 'phrases') return t('cardsSentencesLabel');
  if (mode === 'grammar') return t('cardsGrammarLabel');
  return t('cardsVocabularyLabel');
}

export function CardLevelGate({
  mode,
  value,
  onChange,
  onConfirm,
}: {
  mode: CardMode;
  value: CardLevelBand;
  onChange: (level: CardLevelBand) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslator();
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const text = isDark ? palette.text : '#21324E';
  const muted = isDark ? palette.textMuted : '#687C9E';
  const surface = isDark ? palette.surface : '#FFFFFF';
  const raised = isDark ? palette.surfaceMuted : '#F3F6FC';
  const border = isDark ? palette.border : 'rgba(78, 107, 164, 0.15)';
  const primary = palette.primary;

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: primary }]}>
          {modeLabel(mode, t)}
        </Text>
        <Text style={[styles.title, { color: text }]}>Which level do you want to practise?</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          Choose one level for this session. You can choose again whenever you start a new session.
        </Text>
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Card practice level"
        style={styles.levelList}
      >
        {LEVELS.map((level) => {
          const selected = value === level.value;
          return (
            <Pressable
              key={level.value}
              onPress={() => onChange(level.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={\`\${level.code} \${level.title}\`}
              style={[
                styles.levelRow,
                { backgroundColor: raised, borderColor: border },
                selected && { borderColor: primary, backgroundColor: \`\${primary}12\` },
              ]}
            >
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: selected ? primary : muted },
                ]}
              >
                {selected ? <View style={[styles.radioInner, { backgroundColor: primary }]} /> : null}
              </View>
              <View style={styles.levelCopy}>
                <View style={styles.levelTitleRow}>
                  <Text style={[styles.levelCode, { color: selected ? primary : text }]}>{level.code}</Text>
                  <Text style={[styles.levelTitle, { color: text }]}>{level.title}</Text>
                </View>
                <Text style={[styles.levelDetail, { color: muted }]}>{level.detail}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={\`Start \${modeLabel(mode, t)} at \${LEVELS.find((level) => level.value === value)?.code ?? value}\`}
        style={[styles.startButton, { backgroundColor: primary }]}
      >
        <Text style={styles.startButtonText}>Start this level</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 18,
  },
  heading: { gap: 5 },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  levelList: { gap: 10 },
  levelRow: {
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelCopy: { flex: 1, gap: 3 },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  levelCode: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  levelTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  levelDetail: {
    fontSize: 12,
    lineHeight: 18,
  },
  startButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
