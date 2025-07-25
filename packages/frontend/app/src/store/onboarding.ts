import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum OnboardingStep {
  Welcome = 0,
  Showcase,
  JoinNow,
  Submitted,
}

export interface OnboardingState {
  step: OnboardingStep;
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: OnboardingStep.Welcome,
      setStep: (step: OnboardingStep) => set({ step }),
      nextStep: () => {
        const current = get().step;
        const next = Math.min(current + 1, OnboardingStep.Submitted);
        set({ step: next });
      },
      prevStep: () => {
        const current = get().step;
        const prev = Math.max(current - 1, OnboardingStep.Welcome);
        set({ step: prev });
      },
    }),
    {
      name: 'onboarding-storage',
      partialize: state => ({
        step: state.step,
      }),
    }
  )
);
