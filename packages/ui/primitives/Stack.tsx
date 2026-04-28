import React, { type PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

type SpacingToken = "xs" | "sm" | "md" | "lg" | "xl";

const GAP: Record<SpacingToken, number> = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

type Props = PropsWithChildren<{
  gap?: SpacingToken | number;
  direction?: "row" | "column";
  style?: ViewStyle;
}>;

export default function Stack({ children, gap = "md", direction = "column", style }: Props) {
  const resolvedGap = typeof gap === "number" ? gap : GAP[gap];
  return (
    <View style={[styles.base, { gap: resolvedGap, flexDirection: direction }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexShrink: 1 },
});
