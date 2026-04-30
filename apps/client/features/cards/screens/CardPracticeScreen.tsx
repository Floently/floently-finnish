import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { CardPracticeSession } from '../components/CardPracticeSession';
import { useTranslator } from '../../i18n';

export default function CardPracticeScreen() {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const { t } = useTranslator();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? palette.background : '#F4F7FB' }]}>
      <View style={[styles.backBar, { backgroundColor: isDark ? palette.background : '#F4F7FB' }]}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, isDark && { backgroundColor: palette.primarySurface }]}>
          <Text style={[styles.backButtonText, isDark && { color: palette.primary }]}>{t('commonBack')}</Text>
        </Pressable>
      </View>
      <CardPracticeSession />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#E8F0FF' },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#2453D4' },
});
