import React from "react";
import { StyleSheet, View } from "react-native";
import { PageHeader, TaskCard } from "../components";
import { type FloentlyThemeMode } from "../theme/floentlyPalette";

type Props = {
  themeMode?: FloentlyThemeMode;
  onOpenMenu?: () => void;
  onOpenRecording?: () => void;
  onOpenRepair?: () => void;
};

export default function SpeakingLabScreen({
  themeMode = 'light',
  onOpenMenu,
  onOpenRecording,
  onOpenRepair,
}: Props) {
  return (
    <>
      <PageHeader
        eyebrow="Speak"
        title="Speaking Lab"
        subtitle="Short turns. Clear repair. Less pressure."
        themeMode={themeMode}
        onMenuPress={onOpenMenu}
      />
      <View style={styles.stack}>
        <TaskCard
          themeMode={themeMode}
          title="Record once"
          detail="Answer with one calm spoken turn."
          meta="Step 1"
          onPress={onOpenRecording}
        />
        <TaskCard
          themeMode={themeMode}
          title="Repair once"
          detail="Listen, fix one thing, and repeat."
          meta="Step 2"
          onPress={onOpenRepair}
        />
        <TaskCard
          themeMode={themeMode}
          title="Stable route"
          detail="Home → Speak. Keep speaking practice separate from exam pressure."
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({ stack: { gap: 12 } });
