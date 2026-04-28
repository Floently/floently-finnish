import React, { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 16 }}>{children}</View>
    </ScrollView>
  );
}
