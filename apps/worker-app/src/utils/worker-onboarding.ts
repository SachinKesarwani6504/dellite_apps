import { AuthMeResponse, WorkerOnboardingFlags } from '@/types/auth';
import { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';

type OnboardingPayload = AuthMeResponse['onboarding'];

export type WorkerOnboardingResolution = {
  route: OnboardingRouteName;
  isComplete: boolean;
};

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (let index = 0; index < keys.length; index += 1) {
    const next = toBoolean(source[keys[index]]);
    if (typeof next === 'boolean') {
      return next;
    }
  }
  return undefined;
}

function mapCurrentStepToRoute(currentStep?: OnboardingCurrentStep): OnboardingRouteName | null {
  if (!currentStep) return null;
  const normalized = currentStep.trim().toUpperCase();
  if (normalized === 'BASIC_PROFILE') return ONBOARDING_SCREENS.identity;
  if (normalized === 'AADHAAR_VERIFICATION') return ONBOARDING_SCREENS.serviceSelection;
  if (normalized === 'SERVICE_SELECTION') return ONBOARDING_SCREENS.serviceSelection;
  if (normalized === 'CERTIFICATE_UPLOAD') return ONBOARDING_SCREENS.certification;
  if (normalized === 'WELCOME') return ONBOARDING_SCREENS.welcomeWorker;
  return null;
}

export function extractWorkerOnboardingFlags(onboarding?: OnboardingPayload): WorkerOnboardingFlags | undefined {
  if (!onboarding || typeof onboarding !== 'object') {
    return undefined;
  }

  const normalizeFlags = (raw: unknown): WorkerOnboardingFlags | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const source = raw as Record<string, unknown>;
    return {
      hasPhoneVerified: pickBoolean(source, ['hasPhoneVerified']),
      hasCompletedBasicProfile: pickBoolean(source, ['hasCompletedBasicProfile', 'hasBasicInfoCompleted', 'isBasicInfoCompleted']),
      hasAddedServiceSkills: pickBoolean(source, ['hasAddedServiceSkills', 'isServicesSelected']),
      hasUploadedRequiredCertificates: pickBoolean(source, ['hasUploadedRequiredCertificates', 'isDocumentsCompleted']),
      hasSeenSkillSetup: pickBoolean(source, ['hasSeenSkillSetup']),
      hasSeenCertificateSetup: pickBoolean(source, ['hasSeenCertificateSetup']),
      hasSeenOnboardingWelcomeScreen: pickBoolean(source, ['hasSeenOnboardingWelcomeScreen']),
      isAnyServiceApprovedToEarnMoney: pickBoolean(source, ['isAnyServiceApprovedToEarnMoney']),
      currentStep: typeof source.currentStep === 'string' ? source.currentStep : undefined,
    };
  };

  if ('WORKER' in onboarding && onboarding.WORKER && typeof onboarding.WORKER === 'object') {
    return normalizeFlags(onboarding.WORKER);
  }

  const hasFlatFlags =
    'hasPhoneVerified' in onboarding
    || 'hasCompletedBasicProfile' in onboarding
    || 'hasBasicInfoCompleted' in onboarding
    || 'isBasicInfoCompleted' in onboarding
    || 'hasAddedServiceSkills' in onboarding
    || 'isServicesSelected' in onboarding
    || 'hasUploadedRequiredCertificates' in onboarding
    || 'isDocumentsCompleted' in onboarding
    || 'hasSeenSkillSetup' in onboarding
    || 'hasSeenCertificateSetup' in onboarding
    || 'hasSeenOnboardingWelcomeScreen' in onboarding
    || 'isAnyServiceApprovedToEarnMoney' in onboarding;

  if (!hasFlatFlags) {
    return undefined;
  }

  return normalizeFlags(onboarding);
}

export function resolveWorkerOnboarding(flags?: WorkerOnboardingFlags): WorkerOnboardingResolution {
  if (!flags) {
    return { route: ONBOARDING_SCREENS.identity, isComplete: false };
  }

  const inferredPhoneVerified = typeof flags.hasPhoneVerified === 'boolean'
    ? flags.hasPhoneVerified
    : (flags.hasCompletedBasicProfile === true ? true : undefined);
  const hasPhoneVerified = inferredPhoneVerified === true;
  const hasCompletedBasicProfile = flags.hasCompletedBasicProfile === true;
  const hasSeenSkillSetup = flags.hasSeenSkillSetup === true;
  const hasSeenCertificateSetup = flags.hasSeenCertificateSetup === true;
  const hasSeenOnboardingWelcomeScreen = flags.hasSeenOnboardingWelcomeScreen === true;
  const hasAnyFlag =
    typeof inferredPhoneVerified === 'boolean'
    || typeof flags.hasCompletedBasicProfile === 'boolean'
    || typeof flags.hasSeenSkillSetup === 'boolean'
    || typeof flags.hasSeenCertificateSetup === 'boolean'
    || typeof flags.hasSeenOnboardingWelcomeScreen === 'boolean'
    || typeof flags.hasAddedServiceSkills === 'boolean'
    || typeof flags.hasUploadedRequiredCertificates === 'boolean';

  if (!hasAnyFlag) {
    const routeFromCurrentStep = mapCurrentStepToRoute(flags.currentStep);
    if (routeFromCurrentStep) {
      return { route: routeFromCurrentStep, isComplete: false };
    }
    return { route: ONBOARDING_SCREENS.identity, isComplete: false };
  }

  if (!hasPhoneVerified || !hasCompletedBasicProfile) {
    return { route: ONBOARDING_SCREENS.identity, isComplete: false };
  }

  if (!hasSeenSkillSetup) {
    return { route: ONBOARDING_SCREENS.serviceSelection, isComplete: false };
  }

  if (!hasSeenCertificateSetup) {
    return { route: ONBOARDING_SCREENS.certification, isComplete: false };
  }

  if (!hasSeenOnboardingWelcomeScreen) {
    return { route: ONBOARDING_SCREENS.welcomeWorker, isComplete: false };
  }

  return { route: ONBOARDING_SCREENS.welcomeWorker, isComplete: true };
}
