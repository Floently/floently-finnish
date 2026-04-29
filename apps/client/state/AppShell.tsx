import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from "react-native";
import { usePathname, useRouter } from "expo-router";

import { setAuthToken } from "@core/api/apiClient";
import { logger } from "@core/logging/logger";
import { getLearningSystem } from "../features/learning/services/learningService";
import ApplicationErrorScreen from "@ui/screens/ApplicationErrorScreen";
import Card from "@ui/primitives/Card";
import ScreenContainer from "@ui/primitives/ScreenContainer";
import Stack from "@ui/primitives/Stack";
import Text from "@ui/primitives/Text";

import { useAppFlowStore } from "./appFlowStore";
import AuthRoute from "./AuthRoute";
import BillingRoute from "./BillingRoute";
import FeatureEntryRoute from "./FeatureEntryRoute";
import HelpRoute from "./HelpRoute";
import HomeRoute from "./HomeRoute";
import LandingRoute from "./LandingRoute";
import LearningRoute from "./LearningRoute";
import ProgressRoute from "./ProgressRoute";
import SettingsRoute from "./SettingsRoute";
import { useNetworkStore } from "./networkStore";
import type {
  GuardedScreen,
  NavigationErrorCode,
  NavigationErrorState,
  RequestedScreen,
} from "./navigationModel";
import { getPathForScreen, getStackForScreen } from "./navigationModel";
import {
  clearPersistedLearningSession,
  clearPersistedNavigationState,
  clearPersistedYkiExamSession,
  clearPersistedYkiPracticeSession,
  loadPersistedLearningSession,
  loadPersistedNavigationState,
  persistNavigationState,
} from "./sessionPersistence";
import YkiPracticeRoute from "./YkiPracticeRoute";
import YkiExamRoute from "./YkiExamRoute";
import SpeakingRoute from "./SpeakingRoute";
import ProfessionalRoute from "./ProfessionalRoute";
import PlacementRoute from "./PlacementRoute";
import { useAuthStore } from "./authStore";
import { usePreferencesStore } from "./preferencesStore";
import { useTranslator } from "../features/i18n";
import { useSubscriptionStore } from "./subscriptionStore";
import { usePlacementStore } from "./placementStore";
import createDrawerSections from "../config/navigation/AppShell_sidebar_sections";
import { UtilityDrawer } from "@ui/components";
import { audioSession } from "../features/shared/services/audioSession";
import { goToLearn, isLearnHost } from "./learnRouting";

type YkiLevelBand = 'A1-A2' | 'B1-B2' | 'C1-C2';
type SpeakingPreset = {
  initialLevelBand: YkiLevelBand;
  initialSurface: 'menu' | 'conversation' | 'recorded';
  initialProfession?: 'general' | 'nurse' | 'doctor' | 'practical_nurse';
  initialScenarioId?: string | null;
  lockProfession?: boolean;
  entryMode?: 'workplace' | 'interview';
  contextLabel?: string;
} | null;

type Props = {
  requestedScreen?: RequestedScreen;
};

type LearningGuardResult =
  | {
      decisionVersion: string;
      governanceStatus: "governed" | "legacy_uncontrolled";
      governanceVersion: string;
      ok: true;
      policyVersion: string;
    }
  | {
      code: string;
      ok: false;
    };

function isTransportError(code?: string) {
  return code === "TRANSPORT_ERROR";
}

function toRequestedScreen(screen: GuardedScreen | RequestedScreen): RequestedScreen {
  return screen === "home" ? "root" : screen;
}

function isFeatureEntryScreen(
  screen: GuardedScreen | RequestedScreen,
): screen is "daily-practice" | "professional-finnish" | "speaking-practice" {
  return (
    screen === "daily-practice" ||
    screen === "professional-finnish" ||
    screen === "speaking-practice"
  );
}

function isSecondaryScreen(
  screen: GuardedScreen | RequestedScreen,
): screen is "help" | "progress" | "settings" | "billing" {
  return (
    screen === "help" ||
    screen === "progress" ||
    screen === "settings" ||
    screen === "billing"
  );
}

async function validateLearningGuard(): Promise<LearningGuardResult> {
  const learningResponse = await getLearningSystem();

  if (!learningResponse.ok || !learningResponse.data) {
    return {
      code: learningResponse.error?.code ?? "CONTRACT_VIOLATION",
      ok: false,
    };
  }

  return {
    decisionVersion: learningResponse.data.decisionVersion,
    governanceStatus: learningResponse.data.governanceStatus,
    governanceVersion: learningResponse.data.governanceVersion,
    ok: true,
    policyVersion: learningResponse.data.policyVersion,
  };
}

export default function AppShell({ requestedScreen = "root" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeScreen = useAppFlowStore((state) => state.activeScreen);
  const error = useAppFlowStore((state) => state.error);
  const navigationStatus = useAppFlowStore((state) => state.navigationStatus);
  const navigationStack = useAppFlowStore((state) => state.navigationStack);
  const beginNavigationCheck = useAppFlowStore((state) => state.beginNavigationCheck);
  const clearNavigationError = useAppFlowStore((state) => state.clearNavigationError);
  const resolveScreen = useAppFlowStore((state) => state.resolveScreen);
  const setNavigationError = useAppFlowStore((state) => state.setNavigationError);
  const isOffline = useNetworkStore((state) => state.isOffline);
  const startMonitoring = useNetworkStore((state) => state.startMonitoring);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const language = usePreferencesStore((state) => state.language);
  const clockFormat = usePreferencesStore((state) => state.clockFormat);
  const profilePhotoUri = usePreferencesStore((state) => state.profilePhotoUri);
  const avatarMode = usePreferencesStore((state) => state.avatarMode);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const placementHydrate = usePlacementStore((state) => state.hydrate);
  const placementHasHydrated = usePlacementStore((state) => state.hasHydrated);
  const placementShouldPrompt = usePlacementStore((state) => state.shouldPrompt());
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const subscriptionGuardKey = [
    subscriptionStatus?.billingTier ?? '',
    subscriptionStatus?.tier ?? '',
    subscriptionStatus?.isActive ? 'active' : 'inactive',
    subscriptionStatus?.isInternalAllAccess ? 'internal' : 'external',
    subscriptionStatus?.hasAnySubscription ? 'subscribed' : 'free',
    subscriptionStatus?.entitlements?.learnAccess ? 'learn' : 'no-learn',
    subscriptionStatus?.entitlements?.ykiAccess ? 'yki' : 'no-yki',
    subscriptionStatus?.entitlements?.professionalAccess ? 'professional' : 'no-professional',
    (subscriptionStatus?.entitlements?.professions ?? []).join(','),
  ].join('|');
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const clearSubscription = useSubscriptionStore((state) => state.clear);
  const setActiveContext = useSubscriptionStore((state) => state.setActiveContext);
  const { t } = useTranslator();
  const lastLoggedScreenRef = useRef<string | null>(null);
  const [examPresetLevel, setExamPresetLevel] = useState<YkiLevelBand>('B1-B2');
  const [speakingPreset, setSpeakingPreset] = useState<SpeakingPreset>(null);
  // ── Roleplay UX restructuring (per-profession isolation) ──────────────────
  // Returns a speaking preset locked to the user's primary profession so a
  // user opening speaking-practice from a generic entry point (home,
  // progress, learning) lands directly inside THEIR profession area instead
  // of seeing a multi-track picker.
  //
  // For users with multiple profession entitlements, we pick the first one.
  // The strategic plan calls for a richer profession-picker hub; for now,
  // first-entitlement-wins is a safe default that never shows scenarios
  // from a profession the user hasn't picked.
  const buildProfessionLockedPreset = useCallback((overrides?: Partial<NonNullable<SpeakingPreset>>): NonNullable<SpeakingPreset> => {
    const professions = subscriptionStatus?.entitlements?.professions ?? [];
    const activeContext = subscriptionStatus?.entitlements?.activeContext;
    let primaryProfession: 'doctor' | 'nurse' | 'practical_nurse' | 'general' = 'general';
    if (activeContext === 'doctor' || activeContext === 'nurse' || activeContext === 'practical_nurse') {
      primaryProfession = activeContext;
    } else if (professions.length > 0) {
      primaryProfession = professions[0];
    }
    return {
      initialLevelBand: 'B1-B2',
      initialSurface: 'menu',
      initialProfession: primaryProfession,
      initialScenarioId: null,
      lockProfession: primaryProfession !== 'general',
      entryMode: 'workplace',
      contextLabel: primaryProfession === 'general' ? 'General workplace Finnish' : 'Professional workplace roleplay',
      ...overrides,
    };
  }, [subscriptionStatus?.entitlements]);

  const displayName =
    (user as { displayName?: string; name?: string; email?: string } | null)?.displayName?.trim() ||
    (user as { displayName?: string; name?: string; email?: string } | null)?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Learner';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const drawerClockLabel = clockFormat === '12h'
    ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const drawerAvatarUri = avatarMode === 'photo' ? profilePhotoUri : null;

  const openSidebar = () => setDrawerOpen(true);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      clearSubscription();
      return;
    }
    void hydrateSubscription(user);
  }, [clearSubscription, hasHydrated, hydrateSubscription, user]);

  useEffect(() => {
    void placementHydrate();
  }, [placementHydrate]);

  useEffect(() => startMonitoring(), [startMonitoring]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void audioSession.releaseAll('background');
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    logger.setCurrentScreen(activeScreen);
    if (lastLoggedScreenRef.current === activeScreen) {
      return;
    }
    lastLoggedScreenRef.current = activeScreen;
    logger.info("Screen transition resolved.", {
      actionType: "SCREEN_TRANSITION",
      currentScreen: activeScreen,
    });
  }, [activeScreen]);

  function replaceIfNeeded(screen: GuardedScreen) {
    if (screen === 'learning' && typeof window !== 'undefined' && !isLearnHost()) {
      goToLearn('/learn');
      return;
    }

    const path = getPathForScreen(screen);
    if (pathname !== path) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(path as any);
    }
  }


  function isEntitledForScreen(screen: GuardedScreen | RequestedScreen) {
    const entitlements = subscriptionStatus?.entitlements;
    const isPreview = Boolean(subscriptionStatus?.isPreview);
    const previewPath = subscriptionStatus?.previewPath;
    const hasUnlockedAccess = Boolean(
      subscriptionStatus?.isInternalAllAccess ||
      subscriptionStatus?.isPreview ||
      subscriptionStatus?.hasAnySubscription ||
      subscriptionStatus?.isActive,
    );
    if (!entitlements) {
      // Do not send authenticated users to billing while subscription status is still hydrating.
      // The backend remains the source of truth; this only prevents premature frontend redirects.
      if (user && !subscriptionStatus && screen !== 'landing' && screen !== 'auth') {
        return true;
      }
      return screen === 'landing' || screen === 'auth' || screen === 'billing';
    }

    if (!hasUnlockedAccess) {
      return screen === 'landing' || screen === 'auth' || screen === 'billing';
    }

    if (screen === 'learning' || screen === 'daily-practice') {
      return !isPreview && Boolean(
        entitlements.learnAccess ||
        entitlements.ykiAccess ||
        entitlements.professionalAccess
      );
    }

    if (screen === 'speaking-practice') {
      if (isPreview) return previewPath === 'doctor' || previewPath === 'nurse' || previewPath === 'practical_nurse';
      return entitlements.learnAccess;
    }

    if (screen === 'yki-practice') {
      if (isPreview) return previewPath === 'yki';
      return entitlements.ykiAccess;
    }

    if (screen === 'yki-exam') {
      if (isPreview) return false;
      return entitlements.ykiAccess;
    }

    if (screen === 'professional-finnish') {
      if (isPreview) return previewPath === 'doctor' || previewPath === 'nurse' || previewPath === 'practical_nurse';
      return entitlements.professionalAccess;
    }

    return true;
  }

  async function clearRuntimePersistence() {
    await Promise.all([
      clearPersistedLearningSession(),
      clearPersistedNavigationState(),
      clearPersistedYkiExamSession(),
      clearPersistedYkiPracticeSession(),
    ]);
  }

  async function resolveAndPersist(
    screen: GuardedScreen,
    requested: GuardedScreen | RequestedScreen,
    ykiSessionId: string | null = null,
  ) {
    logger.setLastUserAction(`navigate:${screen}`);
    resolveScreen(screen, ykiSessionId);
    await persistNavigationState({
      activeScreen: screen,
      navigationStack: getStackForScreen(screen),
      requestedScreen: toRequestedScreen(requested),
      ykiSessionId,
    });
  }

  async function blockNavigation(errorState: NavigationErrorState, clearStoredState = false) {
    if (clearStoredState) {
      await clearRuntimePersistence();
    }

    logger.warn("Navigation was blocked by runtime validation.", {
      actionType: "NAVIGATION_BLOCKED",
      currentScreen: errorState.requestedScreen,
    });
    setNavigationError(errorState);
  }

  async function restoreLearningSession() {
    const persistedLearning = await loadPersistedLearningSession();

    if (persistedLearning.status === "invalid") {
      await blockNavigation(
        {
          code: persistedLearning.reason === "corrupted" ? "SESSION_CORRUPTED" : "SESSION_OUTDATED",
          message:
            persistedLearning.reason === "corrupted"
              ? "Stored learning session state is corrupted and cannot be trusted."
              : "Stored learning session state is outdated and cannot be restored.",
          requestedScreen: "learning",
        },
        true,
      );
      return;
    }

    if (persistedLearning.status === "missing" || !persistedLearning.value) {
      await clearRuntimePersistence();
      resolveScreen("learning");
      await persistNavigationState({
        activeScreen: "learning",
        navigationStack: getStackForScreen("learning"),
        requestedScreen: "learning",
        ykiSessionId: null,
      });
      return;
    }

    if (isOffline) {
      await blockNavigation({
        code: "NAVIGATION_BLOCKED",
        message: "Learning restore requires backend revalidation and is blocked while offline.",
        requestedScreen: "learning",
      });
      return;
    }

    const learningGuard = await validateLearningGuard();

    if (!learningGuard.ok) {
      await blockNavigation(
        {
          code: isTransportError(learningGuard.code) ? "NAVIGATION_BLOCKED" : "SESSION_INVALID",
          message: isTransportError(learningGuard.code)
            ? "Learning restore requires backend revalidation and is currently unavailable."
            : "Learning restore is blocked because the current backend state does not validate.",
          requestedScreen: "learning",
        },
        !isTransportError(learningGuard.code),
      );
      return;
    }

    if (
      persistedLearning.value.decisionVersion !== learningGuard.decisionVersion ||
      persistedLearning.value.policyVersion !== learningGuard.policyVersion ||
      persistedLearning.value.governanceVersion !== learningGuard.governanceVersion ||
      persistedLearning.value.governanceStatus !== learningGuard.governanceStatus
    ) {
      await blockNavigation(
        {
          code: "SESSION_OUTDATED",
          message: "Learning restore was rejected because stored governed versions no longer match the backend.",
          requestedScreen: "learning",
        },
        true,
      );
      return;
    }

    replaceIfNeeded("learning");
    await resolveAndPersist("learning", "learning");
  }

  async function restoreFromNavigationState() {
    const persistedNavigation = await loadPersistedNavigationState();

    if (persistedNavigation.status === "invalid") {
      await blockNavigation(
        {
          code:
            persistedNavigation.reason === "corrupted" ? "SESSION_CORRUPTED" : "SESSION_OUTDATED",
          message:
            persistedNavigation.reason === "corrupted"
              ? "Stored navigation state is corrupted and cannot be trusted."
              : "Stored navigation state is outdated and cannot be restored.",
          requestedScreen: "root",
        },
        true,
      );
      return;
    }

    if (persistedNavigation.status === "missing" || !persistedNavigation.value) {
      await resolveAndPersist("home", "root");
      return;
    }

    if (persistedNavigation.value.activeScreen === "home") {
      if (!subscriptionStatus) {
        replaceIfNeeded("home");
        await resolveAndPersist("home", persistedNavigation.value.requestedScreen);
        return;
      }

      const hasUnlockedAccess = Boolean(
        subscriptionStatus?.isInternalAllAccess ||
        subscriptionStatus?.isPreview ||
        subscriptionStatus?.hasAnySubscription ||
        subscriptionStatus?.isActive,
      );
      const canShowPlacement = Boolean(user && placementHasHydrated && placementShouldPrompt);
      if (!hasUnlockedAccess && !canShowPlacement) {
        replaceIfNeeded("billing");
        await resolveAndPersist("billing", "billing");
        return;
      }
      replaceIfNeeded("home");
      await resolveAndPersist("home", persistedNavigation.value.requestedScreen);
      return;
    }

    if (persistedNavigation.value.activeScreen === "learning") {
      await restoreLearningSession();
      return;
    }

    if (persistedNavigation.value.activeScreen === "yki-exam") {
      replaceIfNeeded("yki-exam");
      await resolveAndPersist("yki-exam", persistedNavigation.value.requestedScreen);
      return;
    }

    if (isFeatureEntryScreen(persistedNavigation.value.activeScreen)) {
      replaceIfNeeded(persistedNavigation.value.activeScreen);
      await resolveAndPersist(
        persistedNavigation.value.activeScreen,
        persistedNavigation.value.requestedScreen,
      );
      return;
    }

    if (isSecondaryScreen(persistedNavigation.value.activeScreen)) {
      replaceIfNeeded(persistedNavigation.value.activeScreen);
      await resolveAndPersist(
        persistedNavigation.value.activeScreen,
        persistedNavigation.value.requestedScreen,
      );
      return;
    }

    if (persistedNavigation.value.activeScreen === "yki-practice") {
      replaceIfNeeded("yki-practice");
      await resolveAndPersist("yki-practice", persistedNavigation.value.requestedScreen);
      return;
    }

    replaceIfNeeded("home");
    await resolveAndPersist("home", "root");
  }

  async function resolveRequestedRoute(target: RequestedScreen) {
    beginNavigationCheck(target);

    if (!user) {
      if (target === "root" || target === "landing") {
        replaceIfNeeded("landing");
        await clearRuntimePersistence();
        await resolveAndPersist("landing", "root");
        return;
      }

      if (target === "auth") {
        replaceIfNeeded("auth");
        await clearRuntimePersistence();
        await resolveAndPersist("auth", "auth");
        return;
      }

      await blockNavigation({
        code: "AUTH_REQUIRED",
        message: `Access to ${target} requires an authenticated session.`,
        requestedScreen: target,
      });
      return;
    }

    if (target === "root") {
      if (!subscriptionStatus) {
        // Do not force users home while subscription status is refreshing.
        // Restore the last known navigation state instead, especially for
        // already-open protected feature screens such as roleplay/speaking.
        await restoreFromNavigationState();
        return;
      }

      const hasUnlockedAccess = Boolean(
        subscriptionStatus?.isInternalAllAccess ||
        subscriptionStatus?.isPreview ||
        subscriptionStatus?.hasAnySubscription ||
        subscriptionStatus?.isActive,
      );
      const canShowPlacement = Boolean(user && placementHasHydrated && placementShouldPrompt);
      if (!hasUnlockedAccess && !canShowPlacement) {
        replaceIfNeeded("billing");
        await resolveAndPersist("billing", "billing");
        return;
      }
      await restoreFromNavigationState();
      return;
    }

    if (!isEntitledForScreen(target)) {
      replaceIfNeeded('billing');
      await resolveAndPersist('billing', 'billing');
      return;
    }

    if (target === "auth") {
      await clearRuntimePersistence();
      replaceIfNeeded("home");
      await resolveAndPersist("home", "root");
      return;
    }

    if (target === "learning") {
      if (isOffline) {
        await blockNavigation({
          code: "NAVIGATION_BLOCKED",
          message: "Learning navigation requires backend validation and is blocked while offline.",
          requestedScreen: target,
        });
        return;
      }

      replaceIfNeeded("learning");
      await resolveAndPersist("learning", target);
      return;
    }

    if (target === "yki-exam") {
      replaceIfNeeded("yki-exam");
      await resolveAndPersist("yki-exam", target);
      return;
    }

    if (isFeatureEntryScreen(target)) {
      replaceIfNeeded(target);
      await resolveAndPersist(target, target);
      return;
    }

    if (isSecondaryScreen(target)) {
      replaceIfNeeded(target);
      await resolveAndPersist(target, target);
      return;
    }

    replaceIfNeeded("yki-practice");
    await resolveAndPersist("yki-practice", target, null);
  }

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const isStableProtectedScreen =
      activeScreen !== "landing" &&
      activeScreen !== "auth" &&
      activeScreen !== "home" &&
      activeScreen !== "billing" &&
      activeScreen !== "error";

    if (
      requestedScreen === "root" &&
      user &&
      isStableProtectedScreen
    ) {
      // A root-route refresh must not eject an already-open protected screen.
      // During subscription refresh, subscriptionStatus can briefly be missing.
      // In that case, keep the current feature screen stable and let backend
      // remain the real security layer.
      if (!subscriptionStatus || isEntitledForScreen(activeScreen)) {
        return;
      }
    }

    void resolveRequestedRoute(requestedScreen);
  }, [hasHydrated, requestedScreen, user?.id, activeScreen, subscriptionGuardKey]);

  async function navigateTo(screen: GuardedScreen) {
    beginNavigationCheck(screen);

    if (screen === "auth") {
      replaceIfNeeded("auth");
      await resolveAndPersist("auth", "auth");
      return;
    }

    if (screen === "landing") {
      replaceIfNeeded("landing");
      await resolveAndPersist("landing", "root");
      return;
    }

    if (!user) {
      await blockNavigation({
        code: "AUTH_REQUIRED",
        message: `Access to ${screen} requires an authenticated session.`,
        requestedScreen: screen,
      });
      return;
    }

    if (!isEntitledForScreen(screen)) {
      replaceIfNeeded('billing');
      await resolveAndPersist('billing', 'billing');
      return;
    }

    if (screen === "home") {
      clearNavigationError();
      replaceIfNeeded("home");
      await resolveAndPersist("home", "root");
      return;
    }

    if (screen === "daily-practice") {
      clearNavigationError();
      setActiveContext("none");
      replaceIfNeeded("daily-practice");
      await resolveAndPersist("daily-practice", "daily-practice");
      return;
    }

    if (screen === "learning") {
      clearNavigationError();
      if (subscriptionStatus?.entitlements?.activeContext) setActiveContext(subscriptionStatus.entitlements.activeContext);
      replaceIfNeeded("learning");
      await resolveAndPersist("learning", screen);
      return;
    }

    if (screen === "yki-exam") {
      clearNavigationError();
      setActiveContext('yki');
      replaceIfNeeded("yki-exam");
      await resolveAndPersist("yki-exam", screen);
      return;
    }

    if (isFeatureEntryScreen(screen)) {
      clearNavigationError();
      if (screen === 'professional-finnish') {
        const firstProfession = subscriptionStatus?.entitlements?.professions?.[0];
        if (firstProfession === 'doctor' || firstProfession === 'nurse' || firstProfession === 'practical_nurse') {
          setActiveContext(firstProfession);
        }
      }
      if (screen === 'speaking-practice' && subscriptionStatus?.entitlements?.activeContext) {
        setActiveContext(subscriptionStatus.entitlements.activeContext);
      }
      replaceIfNeeded(screen);
      await resolveAndPersist(screen, screen);
      return;
    }

    if (isSecondaryScreen(screen)) {
      clearNavigationError();
      replaceIfNeeded(screen);
      await resolveAndPersist(screen, screen);
      return;
    }

    clearNavigationError();
    replaceIfNeeded("yki-practice");
    await resolveAndPersist("yki-practice", screen, null);
  }

  async function handleLogout() {
    await logout();
    await clearRuntimePersistence();
    setAuthToken(null);
    replaceIfNeeded("landing");
    await resolveAndPersist("landing", "root");
  }

  function navigateBack() {
    const previousScreen =
      navigationStack.length > 1 ? navigationStack[navigationStack.length - 2] : null;

    if (!previousScreen) {
      void navigateTo(user ? "home" : "auth");
      return;
    }

    void navigateTo(previousScreen);
  }

  const drawerSections = createDrawerSections((route) => {
    void navigateTo(route);
  }, { ...(subscriptionStatus?.entitlements ?? {}), isPreview: subscriptionStatus?.isPreview, previewPath: subscriptionStatus?.previewPath ?? null }, language);

  const drawer = (
    <UtilityDrawer
      visible={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      sections={drawerSections}
      themeMode={themeMode}
      isAuthenticated={Boolean(user)}
      userName={displayName}
      userEmail={user?.email ?? ''}
      avatarUri={drawerAvatarUri}
      clockLabel={drawerClockLabel}
      languageLabel={t('commonLanguage')}
      themeLabel={t('commonTheme')}
      sessionLabel={t('commonSession')}
      signInLabel={t('commonLogIn')}
      signOutLabel={t('commonLogOut')}
      darkModeLabel={t('commonDarkMode')}
      lightModeLabel={t('commonLightMode')}
      onToggleTheme={() => void toggleTheme()}
      onAuthAction={() => void handleLogout()}
    />
  );

  if (!hasHydrated || navigationStatus === "checking") {
    return (
      <ScreenContainer center>
        <Stack gap="sm">
              <Card>
                <Stack gap="xs">
                  <Text variant="title">KieliTaika</Text>
              <Text tone="muted">{t('appShellValidating')}</Text>
                </Stack>
              </Card>
            </Stack>
          </ScreenContainer>
    );
  }

  if (activeScreen === "error" && error) {
    return (
      <ApplicationErrorScreen
        code={error.code}
        message={error.message}
        onPrimaryAction={() => {
          void navigateTo(user ? "home" : "landing");
        }}
        onSecondaryAction={
          user
            ? () => {
                void handleLogout();
              }
            : undefined
        }
        primaryLabel={user ? t('appShellReturnHome') : t('appShellOpenAuth')}
        secondaryLabel={user ? t('appLogOut') : undefined}
      />
    );
  }

  if (activeScreen === "landing") {
    return (
      <LandingRoute
        onOpenAuth={() => {
          void navigateTo("auth");
        }}
      />
    );
  }

  if (activeScreen === "auth") {
    return <AuthRoute />;
  }

  if (activeScreen === "learning") {
    return (
      <>
        <LearningRoute
          onBack={() => navigateBack()}
          onOpenMenu={openSidebar}
          onOpenEverydayRoleplay={() => {
            setSpeakingPreset({
              initialLevelBand: 'B1-B2',
              initialSurface: 'conversation',
              initialProfession: 'general',
              contextLabel: 'Everyday Finnish roleplay',
            });
            void navigateTo('speaking-practice');
          }}
          onOpenProfessionalHub={() => void navigateTo('professional-finnish')}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "progress") {
    return (
      <>
        <ProgressRoute
          onBack={() => void navigateTo("home")}
          onOpenLearning={() => void navigateTo("learning")}
          onOpenSpeaking={() => {
            // Roleplay UX restructuring: lock to user's primary profession
            setSpeakingPreset(buildProfessionLockedPreset());
            void navigateTo("speaking-practice");
          }}
          onOpenYki={() => void navigateTo("yki-exam")}
          onOpenMenu={openSidebar}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "settings") {
    return (
      <>
        <SettingsRoute
          onBack={() => void navigateTo("home")}
          onOpenBilling={() => void navigateTo("billing")}
          onOpenHelp={() => void navigateTo("help")}
          onOpenMenu={openSidebar}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "help") {
    return (
      <>
        <HelpRoute
          onBack={() => void navigateTo("home")}
          onOpenBilling={() => void navigateTo("billing")}
          onOpenSettings={() => void navigateTo("settings")}
          onOpenYki={() => void navigateTo("yki-exam")}
          onOpenMenu={openSidebar}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "billing") {
    return (
      <>
        <BillingRoute
          onBack={() => void navigateTo("home")}
          onOpenMenu={openSidebar}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "speaking-practice") {
    return (
      <>
        <SpeakingRoute
          onBack={() => navigateBack()}
          onOpenMenu={openSidebar}
          initialLevelBand={speakingPreset?.initialLevelBand}
          initialSurface={speakingPreset?.initialSurface}
          initialProfession={speakingPreset?.initialProfession}
          initialScenarioId={speakingPreset?.initialScenarioId}
          lockProfession={speakingPreset?.lockProfession}
          entryMode={speakingPreset?.entryMode}
          contextLabel={speakingPreset?.contextLabel}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "professional-finnish") {
    return (
      <>
        <ProfessionalRoute
          onBack={() => navigateBack()}
          onOpenMenu={openSidebar}
          onOpenRoleplay={(profession, scenarioId, entryMode = 'workplace') => {
            setSpeakingPreset({
              initialLevelBand: 'B1-B2',
              initialSurface: 'conversation',
              initialProfession: profession,
              initialScenarioId: scenarioId ?? null,
              lockProfession: true,
              entryMode,
              contextLabel: entryMode === 'interview' ? 'Structured interview practice' : 'Professional workplace roleplay',
            });
            void navigateTo('speaking-practice');
          }}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "daily-practice") {
    return (
      <>
        <FeatureEntryRoute
          screen="daily-practice"
          onBack={() => navigateBack()}
          onOpenMenu={openSidebar}
          onOpenLearning={() => void navigateTo("learning")}
          onOpenYkiPractice={() => void navigateTo("yki-practice")}
          onOpenTarget={() => void navigateTo("learning")}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "yki-exam") {
    return (
      <>
        <YkiExamRoute
          onExit={() => void navigateTo("home")}
          onOpenMenu={openSidebar}
          initialLevelBand={examPresetLevel}
          onOpenPractice={(levelBand) => { if (levelBand) setExamPresetLevel(levelBand); void navigateTo("yki-practice"); }}
          onOpenSpeakingRecording={(levelBand) => { setSpeakingPreset({ initialLevelBand: levelBand, initialSurface: 'recorded', initialProfession: 'general', contextLabel: 'YKI recorded speaking prep' }); void navigateTo("speaking-practice"); }}
          onOpenSpeakingConversation={(levelBand) => { setSpeakingPreset({ initialLevelBand: levelBand, initialSurface: 'conversation', initialProfession: 'general', contextLabel: 'YKI conversation speaking prep' }); void navigateTo("speaking-practice"); }}
        />
        {drawer}
      </>
    );
  }

  if (activeScreen === "yki-practice") {
    return (
      <>
        <YkiPracticeRoute
          onBack={() => navigateBack()}
          onOpenMenu={openSidebar}
          onOpenExam={(levelBand) => { if (levelBand) setExamPresetLevel(levelBand); void navigateTo("yki-exam"); }}
          onOpenSpeaking={(config) => {
            setSpeakingPreset({
              initialLevelBand: config.levelBand ?? 'B1-B2',
              initialSurface: 'conversation',
              initialProfession: (config.profession ?? 'general') as NonNullable<SpeakingPreset>['initialProfession'],
              contextLabel: 'YKI speaking practice',
            });
            void navigateTo("speaking-practice");
          }}
        />
        {drawer}
      </>
    );
  }

  // Value-first onboarding: placement runs for any signed-in user who hasn't completed it.
  // Removing the learnAccess gate lets placement happen BEFORE any paywall — the user
  // experiences real value (their CEFR level) before being asked to choose a plan.
  // After placement completes, if they don't yet have a subscription, we route them to
  // billing (now framed as "start your 7-day free trial"); otherwise they land on home.
  if (activeScreen === 'home' && user && placementHasHydrated && placementShouldPrompt) {
    return (
      <>
        <PlacementRoute
          onDone={() => {
            const hasUnlockedAccess = Boolean(
              subscriptionStatus?.isInternalAllAccess ||
              subscriptionStatus?.isPreview ||
              subscriptionStatus?.hasAnySubscription ||
              subscriptionStatus?.isActive,
            );
            void navigateTo(hasUnlockedAccess ? 'home' : 'billing');
          }}
        />
        {drawer}
      </>
    );
  }

  return (
    <>
      <HomeRoute
        onOpenBilling={() => void navigateTo("billing")}
        onOpenDailyPractice={() => void navigateTo("daily-practice")}
        onOpenHelp={() => void navigateTo("help")}
        onOpenProfessionalFinnish={() => void navigateTo("professional-finnish")}
        onOpenProgress={() => void navigateTo("progress")}
        onOpenSpeakingPractice={() => {
          setSpeakingPreset(buildProfessionLockedPreset());
          void navigateTo("speaking-practice");
        }}
        onOpenSettings={() => void navigateTo("settings")}
        onOpenLearning={() => void navigateTo("learning")}
        onOpenYkiExam={() => { setExamPresetLevel('B1-B2'); void navigateTo("yki-exam"); }}
        onOpenYkiPractice={() => void navigateTo("yki-practice")}
        onOpenMenu={openSidebar}
      />
      {drawer}
    </>
  );
}
