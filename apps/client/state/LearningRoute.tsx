import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { usePreferencesStore } from './preferencesStore';
import { translate } from '../features/i18n';

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
  const language = usePreferencesStore((state) => state.language);
  const params = useLocalSearchParams<{ branch?: string | string[] }>();

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const rawBranch = Array.isArray(params.branch) ? params.branch[0] : params.branch;
  const initialBranch = useMemo<Branch>(() => (rawBranch === 'everyday' ? 'everyday' : 'hub'), [rawBranch]);
  const [branch, setBranch] = useState<Branch>(initialBranch);

  useEffect(() => {
    setBranch(initialBranch);
  }, [initialBranch]);

  if (branch === 'everyday') {
    return (
      <AppScaffold
        themeMode={themeMode}
        allowScroll
        header={
          <PageHeader
            eyebrow={translate(language, 'learningEverydayEyebrow')}
            title={translate(language, 'learningEverydayTitle')}
            subtitle={translate(language, 'learningEverydaySubtitle')}
            actionLabel={translate(language, 'learningWorkplaceFinnishAction')}
            onActionPress={() => {
              setBranch('hub');
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
            title={translate(language, 'learningEverydayFlashcardsTitle')}
            detail={translate(language, 'learningEverydayFlashcardsDetail')}
            meta={translate(language, 'learningEverydayFlashcardsMeta')}
            actionLabel={translate(language, 'learningOpenFlashcards')}
            onPress={() => router.push('/cards?mode=vocabulary&domain=general' as never)}
          />
          <TaskCard
            themeMode={themeMode}
            accent="yellow"
            title={translate(language, 'learningDailyRoleplayTitle')}
            detail={translate(language, 'learningDailyRoleplayDetail')}
            meta={translate(language, 'learningDailyRoleplayMeta')}
            actionLabel={translate(language, 'learningOpenRoleplay')}
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
            eyebrow={translate(language, 'learningHubEyebrow')}
            title={translate(language, 'learningHubTitle')}
            subtitle={translate(language, 'learningHubSubtitle')}
            actionLabel={translate(language, 'commonBack')}
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
          title={translate(language, 'learningEverydayTitle')}
          detail={translate(language, 'learningEverydayCardDetail')}
          meta={translate(language, 'learningEverydayCardMeta')}
          actionLabel={translate(language, 'learningOpenEveryday')}
          onPress={() => {
            setBranch('everyday');
          }}
        />
          <TaskCard
            themeMode={themeMode}
            accent="blue"
            title={translate(language, 'learningMyProfessionTitle')}
            detail={translate(language, 'learningMyProfessionDetail')}
            meta={translate(language, 'commonProfessionSpecific')}
            actionLabel={translate(language, 'learningOpenMyProfession')}
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
