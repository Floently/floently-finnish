import React from "react";
import { StyleSheet, View } from "react-native";
import { LearningLoopStepper, PageHeader, TaskCard } from "../components";
import { getFloentlyPalette, type FloentlyThemeMode } from "../theme/floentlyPalette";
import { LEARNING_LOOP } from "../../core/modes";

type Props = {
  themeMode?: FloentlyThemeMode;
  onOpenMenu?: () => void;
  onOpenPlanner?: () => void;
  onOpenPhraseBank?: () => void;
  onOpenConfidence?: () => void;
  onOpenRevisionVault?: () => void;
};

export default function LearnScreen({
  themeMode = 'light',
  onOpenMenu,
  onOpenPlanner,
  onOpenPhraseBank,
  onOpenConfidence,
  onOpenRevisionVault,
}: Props) {
  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="One thing at a time"
        subtitle="Choose the next short action instead of scanning a long page."
        themeMode={themeMode}
        onMenuPress={onOpenMenu}
      />
      <LearningLoopStepper steps={LEARNING_LOOP} activeIndex={2} />
      <View style={styles.stack}>
        <TaskCard
          themeMode={themeMode}
          title="Planner"
          detail="See the next study step and keep your week simple."
          meta="Home → Learn → Planner"
          onPress={onOpenPlanner}
        />
        <TaskCard
          themeMode={themeMode}
          title="Phrase bank"
          detail="Save useful chunks and review them fast."
          meta="Home → Learn → Phrase bank"
          onPress={onOpenPhraseBank}
        />
        <TaskCard
          themeMode={themeMode}
          title="Confidence"
          detail="Separate hesitation from real skill gaps."
          meta="Home → Learn → Confidence"
          onPress={onOpenConfidence}
        />
        <TaskCard
          themeMode={themeMode}
          title="Revision vault"
          detail="Protect important items with spaced review."
          meta="Home → Learn → Revision vault"
          onPress={onOpenRevisionVault}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({ stack: { gap: 12 } });
