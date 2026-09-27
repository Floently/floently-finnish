import React, { useEffect } from 'react';
import HomeScreen from '@ui/screens/HomeScreen';

import { useAuthStore } from './authStore';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';
import { useStreakStore } from './streakStore';
import { useTranslator } from '../features/i18n';

type Props = {
  onOpenBilling: () => void;
  onOpenDailyPractice: () => void;
  onOpenHelp: () => void;
  onOpenProfessionalFinnish: () => void;
  onOpenProgress: () => void;
  onOpenSpeakingPractice: () => void;
  onOpenSettings: () => void;
  onOpenLearning: () => void;
  onOpenYkiExam: () => void;
  onOpenYkiPractice: () => void;
  onOpenMenu: () => void;
};

function professionalSummaryLabel(professions: string[] | undefined, t: ReturnType<typeof useTranslator>['t']) {
  if (!professions?.length) return undefined;
  if (professions.length > 1) return t('commonAllProfessions');
  const [first] = professions;
  switch (first) {
    case 'doctor':
      return t('professionalNameDoctor');
    case 'nurse':
      return t('professionalNameNurse');
    case 'practical_nurse':
      return t('professionalNamePracticalNurse');
    default:
      return t('commonProfessionSpecific');
  }
}

export default function HomeRoute({
  onOpenBilling,
  onOpenHelp,
  onOpenProfessionalFinnish,
  onOpenProgress,
  onOpenSpeakingPractice,
  onOpenSettings,
  onOpenLearning,
  onOpenYkiExam,
  onOpenYkiPractice,
  onOpenMenu,
}: Props) {
  const { t } = useTranslator();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const activeContext = useSubscriptionStore((state) => state.activeContext);
  const streakHasHydrated = useStreakStore((state) => state.hasHydrated);
  const hydrateStreak = useStreakStore((state) => state.hydrate);
  const currentStreak = useStreakStore((state) => state.currentStreak);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    if (!streakHasHydrated) void hydrateStreak();
  }, [hydrateStreak, streakHasHydrated]);

  const displayName =
    (user as { displayName?: string; name?: string; email?: string } | null)?.displayName?.trim() ||
    (user as { displayName?: string; name?: string; email?: string } | null)?.name?.trim() ||
    user?.email?.split('@')[0] ||
    t('homeLearnerFallbackName');

  const entitlements = subscriptionStatus?.entitlements;
  const professionalLabel = professionalSummaryLabel(entitlements?.professions, t);
  const bundle = subscriptionStatus?.plan.category === 'bundle';
  const isPreview = Boolean(subscriptionStatus?.isPreview);
  const hasLearningAccess = Boolean(
    subscriptionStatus?.isInternalAllAccess ||
    subscriptionStatus?.hasAnySubscription ||
    subscriptionStatus?.isActive ||
    entitlements?.learnAccess ||
    entitlements?.ykiAccess ||
    entitlements?.professionalAccess,
  );

  return (
    <HomeScreen
      isAuthenticated={Boolean(user)}
      userName={displayName}
      userEmail={user?.email ?? t('homeSidebarRoutesHint')}
      streakDays={currentStreak}
      themeMode={themeMode}
      accessState={{
        learn: hasLearningAccess,
        yki: Boolean(entitlements?.ykiAccess),
        professional: Boolean(
          entitlements?.professionalAccess ||
          subscriptionStatus?.isInternalAllAccess ||
          subscriptionStatus?.hasAnySubscription ||
          subscriptionStatus?.isActive
        ),
        professionalLabel,
        activeContext,
        bundle,
        isPreview,
        previewPath: subscriptionStatus?.previewPath ?? null,
      }}
      onToggleTheme={() => {
        void toggleTheme();
      }}
      onAuthAction={() => {
        void logout();
      }}
      onOpenMenu={onOpenMenu}
      onSelectMode={(mode) => {
        console.info('[floently-nav] HomeRoute.onSelectMode', {
          mode,
          learnAccess: Boolean(entitlements?.learnAccess),
          ykiAccess: Boolean(entitlements?.ykiAccess),
          professionalAccess: Boolean(entitlements?.professionalAccess),
          isInternalAllAccess: Boolean(subscriptionStatus?.isInternalAllAccess),
          hasAnySubscription: Boolean(subscriptionStatus?.hasAnySubscription),
          isActive: Boolean(subscriptionStatus?.isActive),
          isPreview,
          hasLearningAccess,
        });
        switch (mode) {
          case 'billing':
            onOpenBilling();
            break;
          case 'help':
            onOpenHelp();
            break;
          case 'learn':
            if (hasLearningAccess) onOpenLearning();
            else onOpenBilling();
            break;
          case 'progress':
            onOpenProgress();
            break;
          case 'settings':
            onOpenSettings();
            break;
          case 'yki':
            if (entitlements?.ykiAccess) onOpenYkiPractice();
            else onOpenBilling();
            break;
          case 'speak':
          case 'scenarios':
            if ((hasLearningAccess && !isPreview) || subscriptionStatus?.previewPath === 'doctor' || subscriptionStatus?.previewPath === 'nurse' || subscriptionStatus?.previewPath === 'practical_nurse') onOpenSpeakingPractice();
            else onOpenBilling();
            break;
          case 'work':
            if (entitlements?.professionalAccess || subscriptionStatus?.isInternalAllAccess || subscriptionStatus?.hasAnySubscription || subscriptionStatus?.isActive) onOpenProfessionalFinnish();
            else if (hasLearningAccess) onOpenLearning();
            else onOpenBilling();
            break;
          case 'exam':
            if (entitlements?.ykiAccess && !isPreview) onOpenYkiExam();
            else onOpenBilling();
            break;
          default:
            onOpenLearning();
            break;
        }
      }}
    />
  );
}
