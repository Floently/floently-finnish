import React, { useEffect } from "react";
import { AppScaffold, NextBackDock, PageHeader, SmartHintPopup, TaskCard } from "@ui/components";
import IntegratedPracticeRoute from "../features/practice/IntegratedPracticeRoute";
import { usePreferencesStore } from "./preferencesStore";

type FeatureScreen = "daily-practice" | "professional-finnish" | "speaking-practice";

type Props = {
  screen: FeatureScreen;
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenLearning: () => void;
  onOpenYkiPractice: () => void;
  /** Navigate directly to this screen's feature destination */
  onOpenTarget: () => void;
};

const SCREEN_COPY: Record<FeatureScreen, { title: string; body: string; primary: string }> = {
  "daily-practice": {
    title: "Review",
    body: "Use one short review block instead of browsing several study tools at once.",
    primary: "Open Learn",
  },
  "professional-finnish": {
    title: "Work",
    body: "Professional Finnish lives under Home → Work so job language stays easy to return to.",
    primary: "Open Work",
  },
  "speaking-practice": {
    title: "Speak",
    body: "Speaking practice lives under Home → Speak. Keep it separate from exam pressure.",
    primary: "Open Speak",
  },
};

export default function FeatureEntryRoute({
  screen,
  onBack,
  onOpenMenu,
  onOpenLearning,
  onOpenYkiPractice,
  onOpenTarget,
}: Props) {
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const [showHint, setShowHint] = React.useState(true);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  if (screen === "daily-practice") {
    return <IntegratedPracticeRoute onBack={onBack} onOpenMenu={onOpenMenu} />;
  }

  const copy = SCREEN_COPY[screen];

  return (
    <>
      <AppScaffold
        themeMode={themeMode}
        header={
          <PageHeader
            eyebrow="Simple navigation"
            title={copy.title}
            subtitle={copy.body}
            themeMode={themeMode}
            actionLabel="Home"
            onActionPress={onBack}
            onMenuPress={onOpenMenu}
          />
        }
        footer={
          <NextBackDock
            backLabel="Home"
            nextLabel={copy.primary}
            onBack={onBack}
            onNext={onOpenTarget}
          />
        }
      >
        <TaskCard
          themeMode={themeMode}
          title="Need practice instead?"
          detail="Keep exam work together under Home → YKI → Practice."
          actionLabel="Open YKI"
          onPress={onOpenYkiPractice}
        />
        <TaskCard
          themeMode={themeMode}
          title="Need review instead?"
          detail="Use Home → Learn for cards, phrases, grammar, and revision."
          actionLabel="Open Learn"
          onPress={onOpenLearning}
        />
      </AppScaffold>
      <SmartHintPopup
        visible={showHint}
        title={`Looking for ${copy.title}?`}
        body={copy.body}
        onPrimary={() => {
          setShowHint(false);
          onOpenTarget();
        }}
        onSecondary={() => setShowHint(false)}
      />
    </>
  );
}
