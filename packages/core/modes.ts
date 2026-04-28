export type AppModeKey = "home" | "learn" | "yki" | "speak" | "work";

export type AppMode = {
  key: AppModeKey;
  title: string;
  subtitle: string;
  hint: string;
  enterpriseTag: string;
};

export const APP_MODES: readonly AppMode[] = [
  {
    key: "home",
    title: "Home",
    subtitle: "Resume the right thing fast.",
    hint: "Continue where you left off.",
    enterpriseTag: "Control center",
  },
  {
    key: "learn",
    title: "Learn",
    subtitle: "Words, phrases, grammar, review.",
    hint: "Small steps, strong recall.",
    enterpriseTag: "Retrieval-led",
  },
  {
    key: "yki",
    title: "YKI",
    subtitle: "Practice, mocks, exam readiness.",
    hint: "Find exam work in one place.",
    enterpriseTag: "Exam path",
  },
  {
    key: "speak",
    title: "Speak",
    subtitle: "Record, repair, repeat.",
    hint: "Short spoken turns, calmer fluency.",
    enterpriseTag: "Speaking lab",
  },
  {
    key: "work",
    title: "Work",
    subtitle: "Professional Finnish that you can use.",
    hint: "Real tasks, real language.",
    enterpriseTag: "Professional",
  },
] as const;

export const LEARNING_LOOP = ["Diagnose", "Learn", "Retrieve", "Produce", "Correct", "Schedule", "Review"] as const;
