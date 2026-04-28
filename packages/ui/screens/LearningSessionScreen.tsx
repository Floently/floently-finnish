import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { LEARNING_LOOP } from "../../core/modes";
import { AppScaffold, LearningLoopStepper, TaskCard } from "../components";

export default function LearningSessionScreen() {
  return (
    <AppScaffold
      header={
        <>
          <Text>Learning session</Text>
          <Text>A focused study block should always move all the way from diagnosis to scheduled review.</Text>
        </>
      }
    >
      <LearningLoopStepper steps={LEARNING_LOOP} />
      <View style={styles.section}>
        <Text style={styles.title}>Session recipe</Text>
        <TaskCard title="Diagnose" detail="Start with one short task that exposes a real weakness." />
        <TaskCard title="Retrieve" detail="Answer before checking notes or models." />
        <TaskCard title="Produce" detail="Say or write the repaired answer in full, not only as a fragment." />
        <TaskCard title="Schedule" detail="Finish by choosing when the repaired item should be seen again." />
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
});
