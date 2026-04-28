import React, { type PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = PropsWithChildren<{
  center?: boolean;
}>;

export default function ScreenContainer({ children, center }: Props) {
  if (center) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, styles.center, styles.centerInner]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FC" },
  content: { flexGrow: 1, padding: 20, gap: 16 },
  center: { alignItems: "center", justifyContent: "center" },
  centerInner: { width: "100%", maxWidth: 400, gap: 16, alignSelf: "center" },
});
