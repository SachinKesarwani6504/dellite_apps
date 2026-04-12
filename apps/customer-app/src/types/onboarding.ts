import type { OnboardingStackParamList } from '@/types/navigation';

export type OnboardingRouteName = keyof OnboardingStackParamList;

export type OnboardingCurrentStep = 'IDENTITY' | 'WELCOME';
