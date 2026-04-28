import React, { useEffect } from 'react';
import HomeScreen from '@ui/screens/HomeScreen';

import { useAuthStore } from './authStore';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';
import { resolveProfessionalDisplayName } from '@core/api/entitlements';

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

function professionalSummaryLabel(professions: string[] | undefined) {
  if (!professions?.length) return undefined;
  if (professions.length > 1) return 'All professions';
  const [first] = professions;
  return resolveProfessionalDisplayName(
    first === 'doctor' || first === 'nurse' || first === 'practical_nurse' ? first : null,
  );
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
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const activeContext = useSubscriptionStore((state) => state.activeContext);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const displayName =
    (user as { displayName?: string; name?: string; email?: string } | null)?.displayName?.trim() ||
    (user as { displayName?: string; name?: string; email?: string } | null)?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Learner';

  const entitlements = subscriptionStatus?.entitlements;
  const professionalLabel = professionalSummaryLabel(entitlements?.professions);
  const bundle = subscriptionStatus?.plan.category === 'bundle';
  const isPreview = Boolean(subscriptionStatus?.isPreview);

  return (
    <HomeScreen
      isAuthenticated={Boolean(user)}
      userName={displayName}
      userEmail={user?.email ?? 'Use the sidebar for all routes'}
      themeMode={themeMode}
      accessState={{
        learn: Boolean(entitlements?.learnAccess),
        yki: Boolean(entitlements?.ykiAccess),
        professional: Boolean(entitlements?.professionalAccess),
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
        switch (mode) {
          case 'billing':
            onOpenBilling();
            break;
          case 'help':
            onOpenHelp();
            break;
          case 'learn':
            if (entitlements?.learnAccess && !isPreview) onOpenLearning();
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
            if ((entitlements?.learnAccess && !isPreview) || subscriptionStatus?.previewPath === 'doctor' || subscriptionStatus?.previewPath === 'nurse' || subscriptionStatus?.previewPath === 'practical_nurse') onOpenSpeakingPractice();
            else onOpenBilling();
            break;
          case 'work':
            if (entitlements?.learnAccess || entitlements?.professionalAccess) onOpenLearning();
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
