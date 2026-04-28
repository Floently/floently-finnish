import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  code?: string;
  message?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  /** @deprecated Use onPrimaryAction */
  onRetry?: () => void;
};

export default function ApplicationErrorScreen({
  code,
  message,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel = "Try again",
  secondaryLabel,
  onRetry,
}: Props) {
  const primaryAction = onPrimaryAction ?? onRetry;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      {code ? <Text style={styles.code}>{code}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.actions}>
        {primaryAction ? (
          <Pressable style={styles.primaryButton} onPress={primaryAction}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </Pressable>
        ) : null}
        {onSecondaryAction && secondaryLabel ? (
          <Pressable style={styles.secondaryButton} onPress={onSecondaryAction}>
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  code: { fontSize: 12, color: "#9CA3AF", marginBottom: 4 },
  message: { fontSize: 15, color: "#374151", textAlign: "center", marginBottom: 24 },
  actions: { gap: 12 },
  primaryButton: { backgroundColor: "#0050A0", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  primaryButtonText: { color: "#ffffff", fontWeight: "600", textAlign: "center" },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 16 },
  secondaryButtonText: { color: "#6B7280", textAlign: "center" },
});
