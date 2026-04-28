import React from "react";
import { Text as RNText, StyleSheet, type TextStyle } from "react-native";

type Variant = "body" | "h1" | "h2" | "h3" | "title" | "caption" | "label";
type Tone = "default" | "muted" | "success" | "warning" | "danger";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  tone?: Tone;
  style?: TextStyle;
  color?: string;
};

const variantStyles: Record<Variant, TextStyle> = {
  h1: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "600", lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
  title: { fontSize: 20, fontWeight: "700", lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "500" },
  caption: { fontSize: 12, lineHeight: 16 },
};

const toneColors: Record<Tone, string> = {
  default: "#111827",
  muted: "#6B7280",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
};

export default function Text({ children, variant = "body", tone = "default", style, color }: Props) {
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        { color: color ?? toneColors[tone] },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {},
});
