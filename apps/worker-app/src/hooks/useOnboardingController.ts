import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createWorkerCertificates,
  getWorkerStatus,
  updateWorkerProfile,
} from '@/actions';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthStatus } from '@/types/auth-status';
import {
  WorkerCertificateCard,
  WorkerCertificateCreatePayload,
  WorkerOnboardingFlags,
  WorkerProfilePayload,
} from '@/types/auth';
import { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';
import { OnboardingContextType } from '@/types/onboarding-context';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { extractWorkerOnboardingFlags, resolveWorkerOnboarding } from '@/utils/worker-onboarding';

export function useOnboardingController(): OnboardingContextType {
  const {
    status,
    me,
    refreshMe,
    completeOnboarding,
  } = useAuthContext();
  const [onboardingRoute, setOnboardingRoute] = useState<OnboardingRouteName>(ONBOARDING_SCREENS.identity);
  const [loading, setLoading] = useState(true);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const localSeenSetupRef = useRef<{
    hasPhoneVerified: boolean;
    hasCompletedBasicProfile: boolean;
    hasSeenSkillSetup: boolean;
    hasSeenCertificateSetup: boolean;
    hasSeenOnboardingWelcomeScreen: boolean;
  }>({
    hasPhoneVerified: false,
    hasCompletedBasicProfile: false,
    hasSeenSkillSetup: false,
    hasSeenCertificateSetup: false,
    hasSeenOnboardingWelcomeScreen: false,
  });

  const applyWorkerFlags = useCallback((flags?: WorkerOnboardingFlags) => {
    if (flags) {
      const normalizedFlags: WorkerOnboardingFlags = {
        ...flags,
        hasPhoneVerified: flags.hasPhoneVerified === true,
        hasCompletedBasicProfile: flags.hasCompletedBasicProfile === true,
        hasSeenSkillSetup: flags.hasSeenSkillSetup === true,
        hasSeenCertificateSetup: flags.hasSeenCertificateSetup === true,
        hasSeenOnboardingWelcomeScreen: flags.hasSeenOnboardingWelcomeScreen === true,
      };

      localSeenSetupRef.current = {
        hasPhoneVerified: normalizedFlags.hasPhoneVerified === true,
        hasCompletedBasicProfile: normalizedFlags.hasCompletedBasicProfile === true,
        hasSeenSkillSetup: normalizedFlags.hasSeenSkillSetup === true,
        hasSeenCertificateSetup: normalizedFlags.hasSeenCertificateSetup === true,
        hasSeenOnboardingWelcomeScreen: normalizedFlags.hasSeenOnboardingWelcomeScreen === true,
      };

      const next = resolveWorkerOnboarding(normalizedFlags);
      setOnboardingRoute(next.route);
      setIsOnboardingActive(!next.isComplete);
      return next;
    }

    const mergedFlags: WorkerOnboardingFlags | undefined =
      (localSeenSetupRef.current.hasPhoneVerified
        || localSeenSetupRef.current.hasCompletedBasicProfile
        || localSeenSetupRef.current.hasSeenSkillSetup
        || localSeenSetupRef.current.hasSeenCertificateSetup
        || localSeenSetupRef.current.hasSeenOnboardingWelcomeScreen
        ? {
          hasPhoneVerified: localSeenSetupRef.current.hasPhoneVerified,
          hasCompletedBasicProfile: localSeenSetupRef.current.hasCompletedBasicProfile,
          hasSeenSkillSetup: localSeenSetupRef.current.hasSeenSkillSetup,
          hasSeenCertificateSetup: localSeenSetupRef.current.hasSeenCertificateSetup,
          hasSeenOnboardingWelcomeScreen: localSeenSetupRef.current.hasSeenOnboardingWelcomeScreen,
        }
        : undefined);

    const next = resolveWorkerOnboarding(mergedFlags);
    setOnboardingRoute(next.route);
    setIsOnboardingActive(!next.isComplete);
    return next;
  }, []);

  const refreshOnboardingRoute = useCallback(async (forceServer = false): Promise<OnboardingRouteName> => {
    if (status === AuthStatus.PHONE_VERIFIED) {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(true);
      return ONBOARDING_SCREENS.identity;
    }

    if (status !== AuthStatus.AUTHENTICATED) {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(false);
      return ONBOARDING_SCREENS.identity;
    }

    if (!forceServer && me?.onboarding) {
      const flags = extractWorkerOnboardingFlags(me.onboarding);
      const next = applyWorkerFlags(flags);
      return next.route;
    }

    setLoading(true);
    try {
      const meResponse = await refreshMe();
      const flags = extractWorkerOnboardingFlags(meResponse.onboarding);
      const next = applyWorkerFlags(flags);
      return next.route;
    } catch {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(true);
      return ONBOARDING_SCREENS.identity;
    } finally {
      setLoading(false);
    }
  }, [applyWorkerFlags, me?.onboarding, refreshMe, status]);

  useEffect(() => {
    if (status === AuthStatus.PHONE_VERIFIED) {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(true);
      setLoading(false);
      return;
    }

    if (status !== AuthStatus.AUTHENTICATED) {
      localSeenSetupRef.current = {
        hasPhoneVerified: false,
        hasCompletedBasicProfile: false,
        hasSeenSkillSetup: false,
        hasSeenCertificateSetup: false,
        hasSeenOnboardingWelcomeScreen: false,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(false);
      setLoading(false);
      return;
    }

    if (me?.onboarding) {
      const flags = extractWorkerOnboardingFlags(me.onboarding);
      applyWorkerFlags(flags);
      setLoading(false);
      return;
    }

    void refreshOnboardingRoute();
  }, [applyWorkerFlags, me?.onboarding, refreshOnboardingRoute, status]);

  const getOnboardingRedirect = useCallback((currentRoute: OnboardingRouteName) => {
    if (!isOnboardingActive) {
      return null;
    }
    return onboardingRoute === currentRoute ? null : onboardingRoute;
  }, [isOnboardingActive, onboardingRoute]);

  const markOnboardingStepSeen = useCallback((step: OnboardingCurrentStep) => {
    if (step === 'BASIC_PROFILE') {
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasPhoneVerified: true,
        hasCompletedBasicProfile: true,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.serviceSelection);
      setIsOnboardingActive(true);
      return;
    }

    if (step === 'SERVICE_SELECTION') {
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasSeenSkillSetup: true,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.certification);
      setIsOnboardingActive(true);
      return;
    }

    if (step === 'CERTIFICATE_UPLOAD') {
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasSeenCertificateSetup: true,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.welcomeWorker);
      setIsOnboardingActive(true);
      return;
    }

    if (step === 'WELCOME') {
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasSeenOnboardingWelcomeScreen: true,
      };
      setIsOnboardingActive(false);
    }
  }, []);

  const completeOnboardingFlow = useCallback(() => {
    markOnboardingStepSeen('WELCOME');
  }, [markOnboardingStepSeen]);

  const completeIdentityProfile = useCallback(async (payload: WorkerProfilePayload) => {
    await completeOnboarding(payload);
    markOnboardingStepSeen('BASIC_PROFILE');
  }, [completeOnboarding, markOnboardingStepSeen]);

  const getRequiredCertificates = useCallback(async (): Promise<WorkerCertificateCard[]> => {
    const statusData = await getWorkerStatus<{
      certificates?: WorkerCertificateCard[];
      requiredCertificates?: WorkerCertificateCard[];
    }>();
    if (Array.isArray(statusData.certificates)) {
      return statusData.certificates;
    }
    return Array.isArray(statusData.requiredCertificates) ? statusData.requiredCertificates : [];
  }, []);

  const completeCertificateUpload = useCallback(async (payload: WorkerCertificateCreatePayload) => {
    await createWorkerCertificates(payload);
    markOnboardingStepSeen('CERTIFICATE_UPLOAD');
    await updateWorkerProfile(
      { hasSeenCertificateSetup: true },
      { showSuccessToast: false },
    );
  }, [markOnboardingStepSeen]);

  const skipCertificateUpload = useCallback(async () => {
    await updateWorkerProfile(
      { hasSeenCertificateSetup: true },
      { showSuccessToast: false, showErrorToast: false },
    );
    markOnboardingStepSeen('CERTIFICATE_UPLOAD');
  }, [markOnboardingStepSeen]);

  return useMemo<OnboardingContextType>(() => ({
    onboardingRoute,
    isOnboardingActive,
    loading,
    completeIdentityProfile,
    refreshOnboardingRoute,
    getOnboardingRedirect,
    markOnboardingStepSeen,
    completeOnboardingFlow,
    getRequiredCertificates,
    completeCertificateUpload,
    skipCertificateUpload,
  }), [
    onboardingRoute,
    isOnboardingActive,
    loading,
    completeIdentityProfile,
    refreshOnboardingRoute,
    getOnboardingRedirect,
    markOnboardingStepSeen,
    completeOnboardingFlow,
    getRequiredCertificates,
    completeCertificateUpload,
    skipCertificateUpload,
  ]);
}
