import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APP_MODES, AppModeKey } from "../../core/modes";

type Props = {
  active: AppModeKey;
  onSelect: (mode: AppModeKey) => void;
};

export default function BottomModeBar({ active, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {APP_MODES.filter((mode) => mode.key !== "home").map((mode) => {
        const selected = active === mode.key;
        return (
          <Pressable key={mode.key} onPress={() => onSelect(mode.key)} style={styles.item}>
            <View style={[styles.dot, selected && styles.activeDot]} />
            <Text style={[styles.label, selected && styles.activeLabel]}>{mode.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", gap: 8 },
  item: { minWidth: 60, alignItems: "center", gap: 6, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD5E1" },
  activeDot: { width: 22, backgroundColor: "#1D4ED8" },
  label: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  activeLabel: { color: "#0F172A" },
});
