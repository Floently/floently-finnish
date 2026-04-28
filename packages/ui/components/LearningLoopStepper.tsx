import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  steps: readonly string[];
  activeIndex?: number;
};

export default function LearningLoopStepper({ steps, activeIndex = 0 }: Props) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step} style={[styles.item, index === activeIndex && styles.activeItem]}>
          <View style={[styles.badge, index === activeIndex && styles.activeBadge]}>
            <Text style={[styles.badgeText, index === activeIndex && styles.activeBadgeText]}>{index + 1}</Text>
          </View>
          <Text numberOfLines={1} style={[styles.label, index === activeIndex && styles.activeLabel]}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#EEF2F7" },
  activeItem: { backgroundColor: "#E8EEFF" },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  activeBadge: { backgroundColor: "#1D4ED8" },
  badgeText: { color: "#0F172A", fontWeight: "800", fontSize: 12 },
  activeBadgeText: { color: "#FFFFFF" },
  label: { color: "#475569", fontSize: 12, fontWeight: "700" },
  activeLabel: { color: "#1D4ED8" },
});
