import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { usePreferencesStore } from './preferencesStore';
import { goToLearn, isLearnHost } from './learnRouting';

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenEverydayRoleplay: () => void;
  onOpenProfessionalHub: () => void;
};

type Branch = 'hub' | 'everyday';

export default function LearningRoute({ onBack, onOpenMenu, onOpenEverydayRoleplay, onOpenProfessionalHub }: Props) {
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const params = useLocalSearchParams<{ branch?: string | string[] }>();

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const rawBranch = Array.isArray(params.branch) ? params.branch[0] : params.branch;
  const branch: Branch = rawBranch === 'everyday' ? 'everyday' : 'hub';

  if (branch === 'everyday') {
    return (
      <AppScaffold
        themeMode={themeMode}
        allowScroll
        header={
          <PageHeader
            eyebrow="Everyday Finnish"
            title="Everyday Finnish"
            subtitle="Choose the shared daily-language branch first, then open only the general flashcards or the YKI-linked daily roleplay from here."
            actionLabel="Workplace Finnish"
            onActionPress={() => {
              if (typeof window !== 'undefined' && !isLearnHost()) {
                goToLearn('/learn');
                return;
              }
              router.replace('/learn' as never);
            }}
            onMenuPress={onOpenMenu}
            themeMode={themeMode}
          />
        }
      >
        <View style={styles.stack}>
          <TaskCard
            themeMode={themeMode}
            accent="blue"
            title="Flashcards"
            detail="Open the shared general-language flashcards for everyday Finnish, work readiness, and YKI-linked fluency."
            meta="General flashcards"
            actionLabel="Open flashcards"
            onPress={() => router.push('/cards?mode=vocabulary&domain=general' as never)}
          />
          <TaskCard
            themeMode={themeMode}
            accent="yellow"
            title="Daily roleplay"
            detail="Open the shared general conversation route. This should stay connected to the everyday or YKI side, not the workplace-specific profession roleplay."
            meta="Everyday roleplay"
            actionLabel="Open roleplay"
            onPress={onOpenEverydayRoleplay}
          />
        </View>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold
      themeMode={themeMode}
      allowScroll
      header={
        <PageHeader
          eyebrow="Workplace readiness"
          title="Workplace Finnish"
          subtitle="Choose the right branch first. Everyday Finnish stays shared. My Profession keeps the paid profession route and its own flashcards, workplace roleplay, and interview view."
          actionLabel="Home"
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
          themeMode={themeMode}
        />
      }
    >
      <View style={styles.stack}>
        <TaskCard
          themeMode={themeMode}
          accent="blue"
          title="Everyday Finnish"
          detail="Open the shared everyday branch first. After that, choose only between general flashcards and daily roleplay."
          meta="Shared language"
          actionLabel="Open Everyday Finnish"
          onPress={() => {
            if (typeof window !== 'undefined' && !isLearnHost()) {
              goToLearn('/learn?branch=everyday');
              return;
            }
            router.push('/learn?branch=everyday' as never);
          }}
        />
        <TaskCard
          themeMode={themeMode}
          accent="blue"
          title="My Profession"
          detail="Open your profession branch. Choose Nurse, Doctor, or Practical Nurse there, then use the full profession page with flashcards, workplace roleplay, and interview practice."
          meta="Profession-specific"
          actionLabel="Open My Profession"
          onPress={onOpenProfessionalHub}
        />
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
});
