import { create } from "zustand";
import type { GuardedScreen, NavigationErrorState, RequestedScreen } from "./navigationModel";
import { getStackForScreen } from "./navigationModel";

type NavigationStatus = "idle" | "checking" | "resolved" | "error";

type AppFlowState = {
  activeScreen: GuardedScreen;
  error: NavigationErrorState | null;
  navigationStatus: NavigationStatus;
  navigationStack: GuardedScreen[];
  beginNavigationCheck: (screen: GuardedScreen | RequestedScreen) => void;
  clearNavigationError: () => void;
  resolveScreen: (screen: GuardedScreen, ykiSessionId?: string | null) => void;
  setNavigationError: (error: NavigationErrorState) => void;
};

export const useAppFlowStore = create<AppFlowState>((set) => ({
  activeScreen: "landing",
  error: null,
  navigationStatus: "idle",
  navigationStack: ["landing"],

  beginNavigationCheck(screen) {
    set({ navigationStatus: "checking", error: null });
    void screen; // acknowledge param
  },

  clearNavigationError() {
    set({ error: null, navigationStatus: "resolved" });
  },

  resolveScreen(screen, _ykiSessionId = null) {
    set({
      activeScreen: screen,
      navigationStack: getStackForScreen(screen),
      navigationStatus: "resolved",
      error: null,
    });
  },

  setNavigationError(error) {
    set({ error, navigationStatus: "error", activeScreen: "error" });
  },
}));
