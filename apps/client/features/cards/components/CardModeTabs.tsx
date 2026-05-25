import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { useTranslator } from '../../../features/i18n';
import { usePreferencesStore } from '../../../state/preferencesStore';
import type { CardMode } from '../types';

type ModeConfig = { labelKey: 'cardsVocabularyLabel' | 'cardsSentencesLabel' | 'cardsGrammarLabel'; value: CardMode };

const MODE_CONFIGS: ModeConfig[] = [
  { labelKey: 'cardsVocabularyLabel', value: 'vocabulary' },
  { labelKey: 'cardsSentencesLabel', value: 'phrases' },
];

export function CardModeTabs({ value, onChange }: { value: CardMode; onChange: (m: CardMode) => void }) {
  const { t } = useTranslator();
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  return (
    <View style={styles.row}>
      {MODE_CONFIGS.map((mode) => {
        const active = value === mode.value;
        return (
          <Pressable key={mode.value} onPress={() => onChange(mode.value)} style={[styles.pill, isDark && { backgroundColor: palette.surfaceMuted, borderColor: palette.border }, active && styles.pillActive, active && isDark && { backgroundColor: palette.primarySurface, borderColor: palette.primary }]}>
            <Text style={[styles.label, isDark && { color: palette.textMuted }, active && styles.labelActive, active && isDark && { color: palette.primary }]}>{t(mode.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 6,
  },
  pill: {
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(82,111,171,0.14)',
  },
  pillActive: {
    backgroundColor: '#EAF0FF',
    borderColor: '#8EACE7',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6580B2',
  },
  labelActive: {
    color: '#3059B1',
  },
});
