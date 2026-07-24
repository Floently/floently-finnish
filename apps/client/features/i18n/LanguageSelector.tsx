import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ENABLED_LANGUAGE_CODES, LANGUAGE_META, type AppLanguage } from './languages';

type Props = {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void | Promise<void>;
  compact?: boolean;
  mode?: 'pills' | 'menu';
  menuPlacement?: 'auto' | 'up' | 'down' | 'right';
};

export default function LanguageSelector({
  language,
  onChange,
  compact = false,
  mode = 'pills',
  menuPlacement = 'auto',
}: Props) {
  const options: AppLanguage[] = [...ENABLED_LANGUAGE_CODES];
  const wrapRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState<'up' | 'down' | 'right'>('right');
  const activeMeta = LANGUAGE_META[language];
  const menuHeight = compact ? 320 : 360;
  const menuWidth = compact ? 228 : 244;

  useEffect(() => {
    if (!open) return;
    if (menuPlacement === 'up' || menuPlacement === 'down') {
      setResolvedPlacement(menuPlacement);
      return;
    }

    if (menuPlacement === 'right') {
      setResolvedPlacement('right');
      return;
    }

    const node = wrapRef.current;
    if (!node?.measureInWindow) return;

    node.measureInWindow((x, y, width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const windowWidth = Dimensions.get('window').width;
      const spaceAbove = y;
      const spaceBelow = Math.max(windowHeight - (y + height), 0);
      const spaceRight = Math.max(windowWidth - (x + width), 0);
      const nextPlacement =
        spaceRight >= menuWidth + 16
          ? 'right'
          : spaceBelow < menuHeight + 16 && spaceAbove > spaceBelow
            ? 'up'
            : 'down';
      setResolvedPlacement(nextPlacement);
    });
  }, [compact, menuHeight, menuPlacement, menuWidth, open]);

  if (mode === 'menu') {
    return (
      <View ref={wrapRef} style={styles.menuWrap}>
        <Pressable
          onPress={() => setOpen((current) => !current)}
          style={({ pressed }) => [
            styles.menuButton,
            compact && styles.menuButtonCompact,
            pressed && styles.menuButtonPressed,
            open && styles.menuButtonOpen,
            compact && styles.menuButtonCompactOpen,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${activeMeta.nativeLabel} ${activeMeta.flag}`}
          >
          <Text style={styles.menuFlag}>{activeMeta.flag}</Text>
        </Pressable>

        {open ? (
          <View
            style={[
              styles.menuPanel,
              compact && styles.menuPanelCompact,
              resolvedPlacement === 'right' ? styles.menuPanelRight : null,
              resolvedPlacement === 'up'
                ? styles.menuPanelUp
                : resolvedPlacement === 'down'
                  ? styles.menuPanelDown
                  : null,
            ]}
          >
            <ScrollView
              style={styles.menuScroll}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.menuScrollContent}
            >
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
                      compact && styles.menuItemCompact,
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
            </ScrollView>
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
    zIndex: 60,
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
  menuButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  menuButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  menuButtonOpen: {
    borderColor: 'rgba(79,127,255,0.56)',
    backgroundColor: 'rgba(79,127,255,0.18)',
  },
  menuButtonCompactOpen: {
    borderColor: 'rgba(79,127,255,0.66)',
  },
  menuFlag: {
    fontSize: 18,
  },
  menuPanel: {
    position: 'absolute',
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.20)',
    backgroundColor: '#0B1121',
    padding: 8,
    gap: 6,
    minWidth: 164,
    maxHeight: 320,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'visible',
  },
  menuPanelDown: {
    top: 42,
  },
  menuPanelRight: {
    top: 0,
    left: 42,
  },
  menuPanelUp: {
    bottom: 42,
  },
  menuPanelCompact: {
    minWidth: 148,
    padding: 6,
    gap: 4,
    maxHeight: 300,
  },
  menuScroll: {
    maxHeight: 260,
  },
  menuScrollContent: {
    gap: 6,
    paddingRight: 2,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
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
