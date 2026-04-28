import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LanguageSelector from '../features/i18n/LanguageSelector';
import { usePreferencesStore } from '../state/preferencesStore';

export default function GlobalChrome() {
  const insets = useSafeAreaInsets();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const clockFormat = usePreferencesStore((state) => state.clockFormat);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const clockLabel = clockFormat === '12h'
    ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: Math.max(insets.top, 8) + 8 }]}>
      <View style={styles.row}>
        <View style={styles.clockPill}>
          <Text style={styles.clockText}>{clockLabel}</Text>
        </View>
        <LanguageSelector language={language} onChange={(next) => void setLanguage(next)} mode="menu" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 12,
    zIndex: 5000,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(79,127,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.18)',
  },
  clockText: {
    color: '#D9E4FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
