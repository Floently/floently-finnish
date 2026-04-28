/**
 * WaveformMicRing — the session recording button.
 *
 * Animated concentric rings around a central mic button. Rings respond to the
 * user's voice in real time: loud speech expands them, silence settles them to
 * ambient breath. Teal accent (`palette.accent`) throughout, matching the
 * healthcare-trusted accent from the unified Floently palette.
 *
 * Dependencies:
 *   - react-native-svg     (Expo: `npx expo install react-native-svg`)
 *   - react-native-reanimated ≥ 4.x
 *
 * Usage:
 *   <WaveformMicRing
 *     phase={recorderPhase}
 *     amplitude={recorderAmplitude}  // 0..1, optional — volume-reactive if provided
 *     onPressIn={startRecording}
 *     onPressOut={stopRecording}
 *     themeMode="dark"
 *   />
 *
 * If `amplitude` is not provided, the rings fall back to a synthetic pulse during
 * recording (backwards-compatible with the previous version).
 */

import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

export type MicPhase = 'idle' | 'recording' | 'uploading' | 'error';

type Props = {
  phase: MicPhase;
  /** 0..1 — current microphone amplitude. When provided, drives ring expansion
   * in real time. When omitted, rings use synthetic pulse during recording. */
  amplitude?: number;
  size?: number;
  /** Override the accent color. Defaults to palette.accent (teal). */
  accentColor?: string;
  themeMode?: FloentlyThemeMode;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress?: () => void;
  disabled?: boolean;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Wavy circle path — subtle organic distortion so rings feel hand-drawn, not
 * mechanical. `seed` varies per-ring so multiple rings don't trace the same
 * curve. Amplitude argument is tiny (1-3px); larger values make rings look buggy.
 */
function wavyCirclePath(cx: number, cy: number, radius: number, seed: number, amplitude = 2): string {
  const segments = 56;
  const parts: string[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    const r =
      radius +
      Math.sin(t * 3 + seed) * amplitude +
      Math.cos(t * 5 + seed * 0.7) * (amplitude * 0.6);
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

export function WaveformMicRing({
  phase,
  amplitude = 0,
  size = 260,
  accentColor,
  themeMode = 'dark',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
}: Props) {
  const palette = getFloentlyPalette(themeMode);
  const accent = accentColor ?? palette.accent;
  const bgForButton = themeMode === 'dark' ? palette.background : palette.surface;

  const cx = size / 2;
  const cy = size / 2;
  const buttonRadius = size * 0.16;
  const ring1Radius = size * 0.28;
  const ring2Radius = size * 0.36;
  const ring3Radius = size * 0.44;

  // Continuous drivers
  const ambientPulse = useSharedValue(0);
  const recordIntensity = useSharedValue(0);
  const uploadingSpin = useSharedValue(0);
  const errorShake = useSharedValue(0);

  // Amplitude driver — smoothed toward the incoming `amplitude` prop to avoid
  // jittery ring sizes. Worklet-safe.
  const amplitudeShared = useSharedValue(0);
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, amplitude));
    amplitudeShared.value = withTiming(clamped, { duration: 110, easing: Easing.out(Easing.quad) });
  }, [amplitude, amplitudeShared]);

  // The effective amplitude the rings react to:
  //   - During recording: real amplitude if any, otherwise a synthetic pulse so
  //     screens that don't pipe amplitude still get visible motion.
  //   - During idle/uploading/error: zero (rings use ambientPulse only).
  const effectiveAmplitude = useDerivedValue(() => {
    'worklet';
    if (phase !== 'recording') return 0;
    // If there's any amplitude signal at all, prefer it over the synthetic pulse.
    if (amplitudeShared.value > 0.02) return amplitudeShared.value;
    // Fallback synthetic pulse (breath-like, 0..0.4)
    return 0.15 + ambientPulse.value * 0.25;
  }, [phase]);

  useEffect(() => {
    ambientPulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    uploadingSpin.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(ambientPulse);
      cancelAnimation(uploadingSpin);
    };
  }, [ambientPulse, uploadingSpin]);

  useEffect(() => {
    recordIntensity.value = withTiming(phase === 'recording' ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    if (phase === 'error') {
      errorShake.value = withSequence(
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } else {
      errorShake.value = withTiming(0, { duration: 120 });
    }
  }, [phase, recordIntensity, errorShake]);

  const paths = useMemo(
    () => ({
      ring1: wavyCirclePath(cx, cy, ring1Radius, 0.5, 2),
      ring2: wavyCirclePath(cx, cy, ring2Radius, 1.7, 3),
      ring3: wavyCirclePath(cx, cy, ring3Radius, 3.1, 4),
    }),
    [cx, cy, ring1Radius, ring2Radius, ring3Radius],
  );

  // Ring 1 — closest to the mic. Reacts most strongly to amplitude, small ambient
  // breath when idle. Loud speech → expands ~18%. Silence → sits at baseline.
  const ring1Props = useAnimatedProps(() => {
    const ambient = 1 + ambientPulse.value * 0.03;
    const amp = 1 + effectiveAmplitude.value * 0.18;
    const opacityBase = interpolate(ambientPulse.value, [0, 0.5, 1], [0.42, 0.78, 0.42]);
    const opacity = Math.min(opacityBase + recordIntensity.value * 0.18 + effectiveAmplitude.value * 0.15, 1);
    return {
      opacity,
      strokeWidth: 1.7 + recordIntensity.value * 0.9 + effectiveAmplitude.value * 0.7,
      transform: `translate(${cx}, ${cy}) scale(${ambient * amp}) translate(${-cx}, ${-cy})`,
    } as any;
  });

  // Ring 2 — medium radius. Slightly lagged pulse; larger amplitude expansion.
  const ring2Props = useAnimatedProps(() => {
    const ambient = 1 + (1 - ambientPulse.value) * 0.04;
    const amp = 1 + effectiveAmplitude.value * 0.26;
    const opacityBase = interpolate(ambientPulse.value, [0, 0.5, 1], [0.26, 0.58, 0.26]);
    const opacity = Math.min(opacityBase + recordIntensity.value * 0.16 + effectiveAmplitude.value * 0.20, 0.92);
    return {
      opacity,
      strokeWidth: 1.3 + recordIntensity.value * 0.7 + effectiveAmplitude.value * 0.8,
      transform: `translate(${cx}, ${cy}) scale(${ambient * amp}) translate(${-cx}, ${-cy})`,
    } as any;
  });

  // Ring 3 — outermost. Most sensitive to amplitude — this is the ring that
  // visibly "reaches out" on loud speech. Subtle during idle.
  const ring3Props = useAnimatedProps(() => {
    const ambient = 1 + ambientPulse.value * 0.06;
    const amp = 1 + effectiveAmplitude.value * 0.38;
    const opacityBase = interpolate(ambientPulse.value, [0, 0.5, 1], [0.10, 0.30, 0.10]);
    const opacity = Math.min(opacityBase + recordIntensity.value * 0.24 + effectiveAmplitude.value * 0.30, 0.82);
    return {
      opacity,
      strokeWidth: 1.1 + recordIntensity.value * 0.6 + effectiveAmplitude.value * 0.9,
      transform: `translate(${cx}, ${cy}) scale(${ambient * amp}) translate(${-cx}, ${-cy})`,
    } as any;
  });

  // Uploading: whole ring group rotates slowly
  const uploadingGroupStyle = useAnimatedStyle(() => {
    const active = phase === 'uploading';
    return {
      transform: [{ rotate: active ? `${uploadingSpin.value}deg` : '0deg' }],
    };
  });

  // Central button: subtle scale bump with recording + amplitude, error shake
  const buttonWrapperStyle = useAnimatedStyle(() => {
    const baseScale = 1 + recordIntensity.value * 0.06;
    const ampScale = 1 + effectiveAmplitude.value * 0.04;
    return {
      transform: [
        { translateX: errorShake.value },
        { scale: baseScale * ampScale },
      ],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, uploadingGroupStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="micCoreGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={accent} stopOpacity="0.30" />
              <Stop offset="55%" stopColor={accent} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={accent} stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="micRingGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={accent} stopOpacity="1" />
              <Stop offset="50%" stopColor={accent} stopOpacity="0.75" />
              <Stop offset="100%" stopColor={accent} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>

          <Circle cx={cx} cy={cy} r={size * 0.48} fill="url(#micCoreGlow)" />

          <AnimatedPath
            d={paths.ring3}
            fill="none"
            stroke="url(#micRingGrad)"
            strokeLinejoin="round"
            animatedProps={ring3Props}
          />
          <AnimatedPath
            d={paths.ring2}
            fill="none"
            stroke="url(#micRingGrad)"
            strokeLinejoin="round"
            animatedProps={ring2Props}
          />
          <AnimatedPath
            d={paths.ring1}
            fill="none"
            stroke={accent}
            strokeLinejoin="round"
            animatedProps={ring1Props}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.buttonWrapper, buttonWrapperStyle]}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          disabled={disabled}
          hitSlop={16}
          style={({ pressed }) => [
            styles.button,
            {
              width: buttonRadius * 2,
              height: buttonRadius * 2,
              borderRadius: buttonRadius,
              backgroundColor: phase === 'recording' ? accent : bgForButton,
              borderColor: accent,
              opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
              shadowColor: accent,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            phase === 'recording'
              ? 'Stop recording'
              : phase === 'uploading'
              ? 'Transcribing'
              : 'Start recording'
          }
          accessibilityState={{ busy: phase === 'uploading', disabled: !!disabled }}
        >
          <MicGlyph
            size={buttonRadius * 1.15}
            color={phase === 'recording' ? bgForButton : accent}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Inline mic SVG — no external icon dep. */
function MicGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"
        fill={color}
      />
      <Path
        d="M18.5 11a.75.75 0 1 1 1.5 0 8 8 0 0 1-7.25 7.97v2.28a.75.75 0 0 1-1.5 0v-2.28A8 8 0 0 1 4 11a.75.75 0 1 1 1.5 0 6.5 6.5 0 0 0 13 0Z"
        fill={color}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
});

export default WaveformMicRing;
