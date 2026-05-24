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
        <View style={styles.topNavRow}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, isDark && { backgroundColor: palette.primarySurface }]}>
          <Text style={[styles.backButtonText, isDark && { color: palette.primary }]}>{t('commonBack')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/?openMenu=1' as never)}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={12}
          style={styles.menuButton}
        >
          <Text style={styles.menuButtonText}>☰ Menu</Text>
        </Pressable>
      </View>
      </View>
      <CardPracticeSession />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topNavRow: {
    width: '100%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    zIndex: 50,
  },
  menuButton: {
    minHeight: 42,
    minWidth: 96,
    paddingHorizontal: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#345EC3',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: '#163A68',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },

  safeArea: { flex: 1 },
  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#E8F0FF' },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#2453D4' },
});
