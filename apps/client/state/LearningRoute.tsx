import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { PathwayBadge, ReducedMotionAwareMotion, SkillBadge } from '@ui/learningExperience';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
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
  const palette = useMemo(() => getFloentlyPalette(themeMode), [themeMode]);
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
            onActionPress={() => setBranch('hub')}
            onMenuPress={onOpenMenu}
            themeMode={themeMode}
          />
        }
      >
        <View style={styles.stack}>
          <View style={styles.badgeRow}>
            <PathwayBadge pathway="everyday" palette={palette} />
            <SkillBadge skill="reading" palette={palette} compact />
            <SkillBadge skill="writing" palette={palette} compact />
            <SkillBadge skill="speaking" palette={palette} compact />
            <SkillBadge skill="vocabulary" palette={palette} compact />
          </View>

          <ReducedMotionAwareMotion kind="task-enter">
            <TaskCard
              themeMode={themeMode}
              accent="blue"
              title={translate(language, 'learningEverydayFlashcardsTitle')}
              detail={translate(language, 'learningEverydayFlashcardsDetail')}
              meta={translate(language, 'learningEverydayFlashcardsMeta')}
              actionLabel={translate(language, 'learningOpenFlashcards')}
              onPress={() => router.push('/cards?mode=vocabulary&domain=general' as never)}
            />
          </ReducedMotionAwareMotion>

          <ReducedMotionAwareMotion kind="task-enter">
            <TaskCard
              themeMode={themeMode}
              accent="blue"
              title={translate(language, 'ykiRouteSkillReading')}
              detail={translate(language, 'learningEverydaySubtitle')}
              meta={translate(language, 'learningEverydayCardMeta')}
              actionLabel={translate(language, 'commonOpen')}
              onPress={() => router.push('/learn/reading' as never)}
            />
          </ReducedMotionAwareMotion>

          <ReducedMotionAwareMotion kind="task-enter">
            <TaskCard
              themeMode={themeMode}
              accent="blue"
              title={translate(language, 'ykiRouteSkillWriting')}
              detail={translate(language, 'learningEverydaySubtitle')}
              meta={translate(language, 'learningEverydayCardMeta')}
              actionLabel={translate(language, 'commonOpen')}
              onPress={() => router.push('/learn/writing' as never)}
            />
          </ReducedMotionAwareMotion>

          <ReducedMotionAwareMotion kind="task-enter">
            <TaskCard
              themeMode={themeMode}
              accent="yellow"
              title={translate(language, 'learningDailyRoleplayTitle')}
              detail={translate(language, 'learningDailyRoleplayDetail')}
              meta={translate(language, 'learningDailyRoleplayMeta')}
              actionLabel={translate(language, 'learningOpenRoleplay')}
              onPress={onOpenEverydayRoleplay}
            />
          </ReducedMotionAwareMotion>
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
          actionLabel={translate(language, 'commonHome')}
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
          themeMode={themeMode}
        />
      }
    >
      <View style={styles.stack}>
        <View style={styles.badgeRow}>
          <PathwayBadge pathway="everyday" palette={palette} />
          <PathwayBadge pathway="professional" palette={palette} />
        </View>
        <TaskCard
          themeMode={themeMode}
          accent="blue"
          title={translate(language, 'learningEverydayTitle')}
          detail={translate(language, 'learningEverydayCardDetail')}
          meta={translate(language, 'learningEverydayCardMeta')}
          actionLabel={translate(language, 'learningOpenEveryday')}
          onPress={() => setBranch('everyday')}
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
});