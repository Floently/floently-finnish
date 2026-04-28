import React from "react";
import { StyleSheet, View } from "react-native";
import { PageHeader, TaskCard } from "../components";
import { type FloentlyThemeMode } from "../theme/floentlyPalette";

type Props = {
  themeMode?: FloentlyThemeMode;
  onOpenMenu?: () => void;
  onOpenWorkPath?: () => void;
  onOpenIncidents?: () => void;
};

export default function ProfessionalFinnishScreen({
  themeMode = 'light',
  onOpenMenu,
  onOpenWorkPath,
  onOpenIncidents,
}: Props) {
  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Professional Finnish"
        subtitle="Useful work language in small, realistic steps."
        themeMode={themeMode}
        onMenuPress={onOpenMenu}
      />
      <View style={styles.stack}>
        <TaskCard
          themeMode={themeMode}
          title="Work path"
          detail="Follow one profession-aware path at a time."
          meta="Main route"
          onPress={onOpenWorkPath}
        />
        <TaskCard
          themeMode={themeMode}
          title="Incident lab"
          detail="Practise short high-pressure responses without clutter."
          meta="Scenario practice"
          onPress={onOpenIncidents}
        />
        <TaskCard
          themeMode={themeMode}
          title="Stable route"
          detail="Home → Work. Keep work language easy to return to."
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({ stack: { gap: 12 } });
