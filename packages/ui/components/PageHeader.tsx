import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

const HEADER_LOGO = require('../../../apps/client/components/public/logo.png');

type Props = {
  eyebrow?: string;
  showEyebrow?: boolean;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onMenuPress?: () => void;
  themeMode?: FloentlyThemeMode;
  pulseMenu?: boolean;
  compact?: boolean;
  showLogo?: boolean;
};

const ORBIT_POSITIONS = [
  { top: -4, left: '50%', marginLeft: -4 },
  { top: 2, right: 6 },
  { top: '50%', right: -4, marginTop: -4 },
  { bottom: 2, right: 6 },
  { bottom: -4, left: '50%', marginLeft: -4 },
  { bottom: 2, left: 6 },
  { top: '50%', left: -4, marginTop: -4 },
  { top: 2, left: 6 },
] as const;

export default function PageHeader({
  eyebrow,
  showEyebrow = true,
  title,
  subtitle,
  actionLabel,
  onActionPress,
  onMenuPress,
  themeMode = 'light',
  pulseMenu = false,
  compact = false,
  showLogo = true,
}: Props) {
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  const raised = isDark ? '#16233E' : palette.surfaceMuted;
  const border = isDark ? '#1E2E47' : palette.border;
  const text = isDark ? '#F0F5FF' : palette.text;
  const muted = isDark ? '#8EA3C3' : palette.textMuted;
  const primary = isDark ? '#4F7FFF' : palette.primary;

  const [pulseOn, setPulseOn] = useState(false);
  const [attentionOn, setAttentionOn] = useState(false);
  const [orbitStep, setOrbitStep] = useState(-1);

  useEffect(() => {
    if (!pulseMenu) {
      setPulseOn(false);
      return;
    }

    const id = setInterval(() => {
      setPulseOn((prev) => !prev);
    }, 850);

    return () => clearInterval(id);
  }, [pulseMenu]);

  useEffect(() => {
    if (!onMenuPress) {
      setAttentionOn(false);
      setOrbitStep(-1);
      return;
    }

    let outerTimer: ReturnType<typeof setInterval> | null = null;
    let innerTimer: ReturnType<typeof setInterval> | null = null;
    let offTimer: ReturnType<typeof setTimeout> | null = null;

    const runAttention = () => {
      setAttentionOn(true);
      setOrbitStep(0);

      let step = 0;
      innerTimer = setInterval(() => {
        step += 1;
        if (step >= ORBIT_POSITIONS.length) {
          if (innerTimer) clearInterval(innerTimer);
          innerTimer = null;
          setOrbitStep(-1);
          return;
        }
        setOrbitStep(step);
      }, 140);

      offTimer = setTimeout(() => {
        setAttentionOn(false);
        setOrbitStep(-1);
      }, 1800);
    };

    outerTimer = setInterval(runAttention, 10000);

    return () => {
      if (outerTimer) clearInterval(outerTimer);
      if (innerTimer) clearInterval(innerTimer);
      if (offTimer) clearTimeout(offTimer);
      setAttentionOn(false);
      setOrbitStep(-1);
    };
  }, [onMenuPress]);

  const hasActions = Boolean((actionLabel && onActionPress) || onMenuPress);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandWrap}>
          {showLogo ? (
            <Image
              source={HEADER_LOGO}
              style={styles.logo}
              resizeMode="contain"
              accessible={false}
            />
          ) : (
            <Text style={[styles.appName, { color: primary }]}>Floently</Text>
          )}
        </View>

        {hasActions ? (
          <View style={styles.actionRow}>
            {actionLabel && onActionPress ? (
              <Pressable
                onPress={onActionPress}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: raised, borderColor: border },
                  pressed && { opacity: 0.86 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
              >
                <Text style={[styles.actionBtnText, { color: primary }]}>{actionLabel}</Text>
              </Pressable>
            ) : null}

            {onMenuPress ? (
              <View style={styles.menuFxWrap}>
                {attentionOn ? (
                  <>
                    <View style={styles.menuHalo} />
                    <View style={styles.menuRing} />
                    {orbitStep >= 0 ? (
                      <View style={[styles.menuBeaconDot, ORBIT_POSITIONS[orbitStep]]} />
                    ) : null}
                  </>
                ) : null}

                <Pressable
                  onPress={onMenuPress}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.menuBtn,
                    {
                      backgroundColor: isDark ? '#162651' : palette.primarySurface,
                      borderColor: attentionOn ? '#8FB1FF' : border,
                    },
                    pulseMenu && pulseOn && styles.menuBtnPulseActive,
                    attentionOn && styles.menuBtnAttention,
                    pressed && { opacity: 0.86 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Open menu"
                >
                  <Text style={[styles.actionBtnText, { color: primary }]}>Menu</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        {showEyebrow && eyebrow ? (
          <View
            style={[
              styles.eyebrowPill,
              {
                backgroundColor: `${primary}18`,
                borderColor: `${primary}38`,
              },
            ]}
          >
            <Text style={[styles.eyebrowText, { color: primary }]}>{eyebrow}</Text>
          </View>
        ) : null}

        <Text
          style={[compact ? styles.titleCompact : styles.title, { color: text }]}
          numberOfLines={2}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: muted }]}
            numberOfLines={3}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 20,
  },
  brandWrap: {
    flex: 1,
    minWidth: 0,
  },
  logo: {
    width: 230,
    height: 115,
    marginLeft: -70,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    paddingTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    flexShrink: 0,
  },
  actionBtn: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuFxWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  menuBtn: {},
  menuBtnPulseActive: {
    shadowColor: '#4F7FFF',
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    transform: [{ scale: 1.06 }],
  },
  menuBtnAttention: {
    shadowColor: '#8FB1FF',
    shadowOpacity: 0.48,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  menuHalo: {
    position: 'absolute',
    width: 88,
    height: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(79,127,255,0.18)',
  },
  menuRing: {
    position: 'absolute',
    width: 90,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(143,177,255,0.75)',
  },
  menuBeaconDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AFC4FF',
    shadowColor: '#AFC4FF',
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  copy: {
    gap: 5,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
});
