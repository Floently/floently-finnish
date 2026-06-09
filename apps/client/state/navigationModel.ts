export type GuardedScreen =
  | "landing"
  | "auth"
  | "home"
  | "learning"
  | "yki-practice"
  | "yki-exam"
  | "daily-practice"
  | "professional-finnish"
  | "speaking-practice"
  | "help"
  | "progress"
  | "settings"
  | "billing"
  | "read"
  | "create"
  | "error";

export type RequestedScreen =
  | "root"
  | "landing"
  | "auth"
  | "home"
  | "error"
  | "learning"
  | "yki-practice"
  | "yki-exam"
  | "daily-practice"
  | "professional-finnish"
  | "speaking-practice"
  | "help"
  | "progress"
  | "settings"
  | "billing"
  | "read"
  | "create";

export type NavigationErrorCode =
  | "AUTH_REQUIRED"
  | "SESSION_CORRUPTED"
  | "SESSION_OUTDATED"
  | "SESSION_INVALID"
  | "YKI_SESSION_REQUIRED"
  | "YKI_SESSION_INVALID"
  | "NAVIGATION_BLOCKED"
  | "LEARNING_STATE_INVALID"
  | "CONTRACT_VIOLATION";

export type NavigationErrorState = {
  code: NavigationErrorCode | string;
  message: string;
  requestedScreen: GuardedScreen | RequestedScreen;
};

const SCREEN_PATHS: Record<GuardedScreen, string> = {
  landing: "/",
  auth: "/auth/login",
  home: "/",
  learning: "/learn",
  "yki-practice": "/yki-practice",
  "yki-exam": "/yki-exam",
  "daily-practice": "/learn",
  "professional-finnish": "/professional",
  "speaking-practice": "/speaking",
  help: "/help",
  progress: "/progress",
  settings: "/settings",
  billing: "/billing/subscription",
  read: "/read",
  create: "/create",
  error: "/",
};

export function getPathForScreen(screen: GuardedScreen): string {
  return SCREEN_PATHS[screen] ?? "/";
}

export function getStackForScreen(screen: GuardedScreen): GuardedScreen[] {
  if (screen === "landing" || screen === "auth" || screen === "home" || screen === "error") {
    return [screen];
  }
  return ["home", screen];
}
