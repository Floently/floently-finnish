import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LanguageSelector from '../features/i18n/LanguageSelector';
import { usePreferencesStore } from '../state/preferencesStore';

export default function GlobalChrome() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 768;
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
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: Math.max(insets.top, compact ? 4 : 8) + (compact ? 4 : 8),
          right: compact ? 8 : 12,
        },
      ]}
    >
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={[styles.clockPill, compact && styles.clockPillCompact]}>
          <Text style={[styles.clockText, compact && styles.clockTextCompact]}>{clockLabel}</Text>
        </View>
        <LanguageSelector language={language} onChange={(next) => void setLanguage(next)} mode="menu" compact={compact} />
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
  rowCompact: {
    gap: 6,
  },
  clockPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(79,127,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.18)',
  },
  clockPillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clockText: {
    color: '#D9E4FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  clockTextCompact: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
