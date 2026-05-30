import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { CardPracticeSession } from '../components/CardPracticeSession';
import { useTranslator } from '../../i18n';
import { audioPlayer } from '../../exam/services/audioPlayer';

export default function CardPracticeScreen() {
  // YKI_AUDIO_STOP_ON_EXIT_GUARD
  useEffect(() => {
    return () => {
      void audioPlayer.stopAsync();
    };
  }, []);

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
    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(115,180,255,0.55)',
    backgroundColor: '#2F6BFF',
    shadowColor: '#2F6BFF',
    shadowOpacity: 0.36,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },

  safeArea: { flex: 1 },
  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
    backgroundColor: 'rgba(255,255,255,0.82)',
    shadowColor: 'rgba(62,95,151,0.24)',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  backButtonText: { fontSize: 13, fontWeight: '700', color: '#2453D4' },
});
