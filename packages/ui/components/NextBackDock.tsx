import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  backLabel?: string;
  nextLabel?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
};

export default function NextBackDock({ backLabel = "Back", nextLabel = "Next", onBack, onNext, nextDisabled = false }: Props) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>{backLabel}</Text>
      </Pressable>
      <Pressable disabled={nextDisabled} onPress={onNext} style={({ pressed }) => [styles.primary, nextDisabled && styles.disabled, pressed && !nextDisabled && styles.pressed]}>
        <Text style={styles.primaryText}>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 12 },
  secondary: { flex: 1, minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  primary: { flex: 1.2, minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  disabled: { backgroundColor: "#CBD5E1" },
  pressed: { opacity: 0.9 },
  secondaryText: { color: "#0F172A", fontWeight: "800" },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
});
