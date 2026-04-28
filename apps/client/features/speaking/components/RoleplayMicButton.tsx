import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  isRecording: boolean;
  isBusy?: boolean;
  onPress: () => void;
};

export default function RoleplayMicButton({ isRecording, isBusy = false, onPress }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.14, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    return () => pulseLoop.current?.stop();
  }, [isRecording, pulseAnim]);

  const label = isBusy ? 'Kuunnellaan…' : isRecording ? 'Lopeta' : 'Puhu nyt';
  const bgColor = isBusy ? '#1E2E47' : isRecording ? '#FF6B6B' : '#4F7FFF';
  const ringColor = isRecording ? 'rgba(255,107,107,0.28)' : 'rgba(79,127,255,0.18)';

  return (
    <Pressable
      onPress={onPress}
      disabled={isBusy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isBusy }}
      style={styles.outer}
    >
      {/* Pulse ring */}
      <Animated.View style={[styles.ring, { borderColor: ringColor, transform: [{ scale: pulseAnim }] }]} />

      {/* Core button */}
      <View style={[styles.inner, { backgroundColor: bgColor }]}>
        {isBusy ? (
          <View style={styles.busyDots}>
            <View style={[styles.dot, styles.dotAnimated]} />
            <View style={[styles.dot, styles.dotAnimated]} />
            <View style={[styles.dot, styles.dotAnimated]} />
          </View>
        ) : isRecording ? (
          <View style={styles.stopSquare} />
        ) : (
          <MicIcon />
        )}
      </View>

      <Text style={[styles.label, { color: isBusy ? '#5C7299' : isRecording ? '#FF6B6B' : '#8EA3C3' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MicIcon() {
  return (
    <View style={styles.micIcon}>
      <View style={styles.micBody} />
      <View style={styles.micBase} />
      <View style={styles.micStand} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', gap: 8 },

  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    top: -4,
    alignSelf: 'center',
  },

  inner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  busyDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#5C7299' },
  dotAnimated: {},

  micIcon: { alignItems: 'center', gap: 0 },
  micBody: { width: 18, height: 26, borderRadius: 9, backgroundColor: '#FFFFFF' },
  micBase: { width: 28, height: 14, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderWidth: 2.5, borderColor: '#FFFFFF', borderBottomWidth: 0, marginTop: -1, backgroundColor: 'transparent' },
  micStand: { width: 2.5, height: 6, backgroundColor: '#FFFFFF', marginTop: 0 },

  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});
