import { create } from 'zustand';

export type OnboardingIntentType = 'YKI' | 'PROFESSIONAL' | 'BOTH';
export type OnboardingProfession = 'doctor' | 'nurse' | 'practical_nurse' | string;
export type OnboardingPracticeFrequency = 'daily' | 'few_times_week' | 'weekly' | string;
export type OnboardingBillingPeriod = 'monthly' | '3_months' | 'yearly' | 'annual';

export type OnboardingState = {
  intentType?: OnboardingIntentType;
  selectedPlan?: string;
  profession?: OnboardingProfession;
  practiceFrequency?: OnboardingPracticeFrequency;
  preferredBillingPeriod?: OnboardingBillingPeriod;
};

type Actions = {
  setIntentType: (intentType: NonNullable<OnboardingState['intentType']>) => void;
  setSelectedPlan: (selectedPlan: string) => void;
  setProfession: (profession: NonNullable<OnboardingState['profession']>) => void;
  setPracticeFrequency: (practiceFrequency: NonNullable<OnboardingState['practiceFrequency']>) => void;
  setPreferredBillingPeriod: (preferredBillingPeriod: NonNullable<OnboardingState['preferredBillingPeriod']>) => void;
  reset: () => void;
};

export const useOnboardingSession = create<OnboardingState & Actions>((set) => ({
  intentType: undefined,
  selectedPlan: undefined,
  profession: undefined,
  practiceFrequency: undefined,
  preferredBillingPeriod: undefined,

  setIntentType: (intentType) => set({ intentType }),
  setSelectedPlan: (selectedPlan) => set({ selectedPlan }),
  setProfession: (profession) => set({ profession }),
  setPracticeFrequency: (practiceFrequency) => set({ practiceFrequency }),
  setPreferredBillingPeriod: (preferredBillingPeriod) => set({ preferredBillingPeriod }),
  reset: () =>
    set({
      intentType: undefined,
      selectedPlan: undefined,
      profession: undefined,
      practiceFrequency: undefined,
      preferredBillingPeriod: undefined,
    }),
}));
