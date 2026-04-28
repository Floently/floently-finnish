import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGE_META, type AppLanguage } from './index';

type Props = {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void | Promise<void>;
  compact?: boolean;
  mode?: 'pills' | 'menu';
};

export default function LanguageSelector({ language, onChange, compact = false, mode = 'pills' }: Props) {
  const options: AppLanguage[] = ['fi', 'sv', 'en'];
  const [open, setOpen] = useState(false);
  const activeMeta = LANGUAGE_META[language];

  if (mode === 'menu') {
    return (
      <View style={styles.menuWrap}>
        <Pressable
          onPress={() => setOpen((current) => !current)}
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.menuButtonPressed,
            open && styles.menuButtonOpen,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${activeMeta.nativeLabel} ${activeMeta.flag}`}
        >
          <Text style={styles.menuFlag}>{activeMeta.flag}</Text>
        </Pressable>

        {open ? (
          <View style={styles.menuPanel}>
            {options.map((option) => {
              const meta = LANGUAGE_META[option];
              const active = option === language;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    void onChange(option);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.menuItem,
                    active && styles.menuItemActive,
                    pressed && styles.menuItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${meta.nativeLabel} ${meta.flag}`}
                >
                  <Text style={[styles.menuItemFlag, active && styles.menuItemFlagActive]}>{meta.flag}</Text>
                  <Text style={[styles.menuItemLabel, active && styles.menuItemLabelActive]}>{meta.nativeLabel}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

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
  menuWrap: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.26)',
    backgroundColor: 'rgba(79,127,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  menuButtonOpen: {
    borderColor: 'rgba(79,127,255,0.56)',
    backgroundColor: 'rgba(79,127,255,0.18)',
  },
  menuFlag: {
    fontSize: 18,
  },
  menuPanel: {
    position: 'absolute',
    top: 42,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.20)',
    backgroundColor: '#0B1121',
    padding: 8,
    gap: 6,
    minWidth: 164,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(79,127,255,0.12)',
  },
  menuItemActive: {
    backgroundColor: 'rgba(79,127,255,0.16)',
  },
  menuItemFlag: {
    fontSize: 16,
  },
  menuItemFlagActive: {
    transform: [{ scale: 1.05 }],
  },
  menuItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B3C1E7',
  },
  menuItemLabelActive: {
    color: '#FFFFFF',
  },
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
