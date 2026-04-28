import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  loopFocus?: string;
  tag?: string;
  isActive?: boolean;
  onPress?: () => void;
};

export default function ModeCard({ title, subtitle, loopFocus, tag, isActive = false, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, isActive && styles.activeCard, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {tag ? <View style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View> : null}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {loopFocus ? <Text style={styles.focus}>{loopFocus}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 122,
  },
  activeCard: { borderColor: "#3D5AFE", shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  pressed: { opacity: 0.94 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, lineHeight: 20, color: "#475569" },
  focus: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  tag: { borderRadius: 999, backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { color: "#3730A3", fontSize: 11, fontWeight: "700" },
});
