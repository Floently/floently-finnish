import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGE_META, type AppLanguage } from './index';

type Props = {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void | Promise<void>;
  compact?: boolean;
};

export default function LanguageSelector({ language, onChange, compact = false }: Props) {
  const options: AppLanguage[] = ['fi', 'sv', 'en'];

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      {options.map((option) => {
        const active = option === language;
        const meta = LANGUAGE_META[option];
        return (
          <Pressable
            key={option}
            onPress={() => {
              void onChange(option);
            }}
            style={[styles.button, active && styles.buttonActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${meta.nativeLabel} ${meta.flag}`}
          >
            <Text style={[styles.flag, active && styles.flagActive]}>{meta.flag}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{meta.nativeLabel}</Text>
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
    flexWrap: 'wrap',
  },
  compactRow: {
    gap: 6,
  },
  button: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.18)',
    backgroundColor: 'rgba(79,127,255,0.06)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonActive: {
    borderColor: 'rgba(79,127,255,0.55)',
    backgroundColor: 'rgba(79,127,255,0.16)',
  },
  flag: {
    fontSize: 16,
  },
  flagActive: {
    transform: [{ scale: 1.06 }],
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E8AB2',
  },
  labelActive: {
    color: '#2140D8',
  },
});
