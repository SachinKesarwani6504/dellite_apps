import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import {
  extractWorkerOnboardingFlags,
  mergeWorkerOnboardingSessionFlags,
  resolveWorkerOnboarding,
  WorkerOnboardingSessionState,
} from '@/utils/worker-onboarding';

function logWorkerOnboardingFlow(step: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-onboarding][flow] ${step}`, payload);
}

const EMPTY_SESSION: WorkerOnboardingSessionState = {
  hasPhoneVerified: false,
  hasCompletedBasicProfile: false,
  hasSeenSkillSetup: false,
  hasSeenCertificateSetup: false,
  hasSeenOnboardingWelcomeScreen: false,
};

export function useOnboardingController(): OnboardingContextType {
  const {
    status,
    me,
    refreshMe,
    completeOnboarding,
  } = useAuthContext();
  const [onboardingRoute, setOnboardingRoute] = useState<OnboardingRouteName>(ONBOARDING_SCREENS.identity);
  const [loading, setLoading] = useState(true);
  const [isRouteReady, setIsRouteReady] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const localSeenSetupRef = useRef<WorkerOnboardingSessionState>({ ...EMPTY_SESSION });
  const holdSkillSetupUntilCompletedRef = useRef(false);
  const inFlightCertificatesRef = useRef<Promise<WorkerCertificateCard[]> | null>(null);

  const resetOnboardingSession = useCallback(() => {
    holdSkillSetupUntilCompletedRef.current = false;
    localSeenSetupRef.current = { ...EMPTY_SESSION };
    setIsRouteReady(false);
    setOnboardingRoute(ONBOARDING_SCREENS.identity);
    setIsOnboardingActive(false);
  }, []);

  const applyWorkerFlags = useCallback((flags?: WorkerOnboardingFlags) => {
    if (flags) {
      const routeFlags = mergeWorkerOnboardingSessionFlags(
        flags,
        localSeenSetupRef.current,
        holdSkillSetupUntilCompletedRef.current,
      );
      const mergedHasSeenSkillSetup = routeFlags.hasSeenSkillSetup === true;

      localSeenSetupRef.current = {
        hasPhoneVerified: routeFlags.hasPhoneVerified === true,
        hasCompletedBasicProfile: routeFlags.hasCompletedBasicProfile === true,
        hasSeenSkillSetup: mergedHasSeenSkillSetup,
        hasSeenCertificateSetup: routeFlags.hasSeenCertificateSetup === true,
        hasSeenOnboardingWelcomeScreen: routeFlags.hasSeenOnboardingWelcomeScreen === true,
      };

      const next = resolveWorkerOnboarding(routeFlags);
      setOnboardingRoute(next.route);
      setIsOnboardingActive(!next.isComplete);
      setIsRouteReady(true);
      return next;
    }

    const mergedFlags: WorkerOnboardingFlags | undefined =
      (localSeenSetupRef.current.hasPhoneVerified
        || localSeenSetupRef.current.hasCompletedBasicProfile
        || localSeenSetupRef.current.hasSeenSkillSetup
        || localSeenSetupRef.current.hasSeenCertificateSetup
        || localSeenSetupRef.current.hasSeenOnboardingWelcomeScreen
        ? { ...localSeenSetupRef.current }
        : undefined);

    const next = resolveWorkerOnboarding(mergedFlags);
    setOnboardingRoute(next.route);
    setIsOnboardingActive(!next.isComplete);
    setIsRouteReady(true);
    return next;
  }, []);

  const refreshOnboardingRoute = useCallback(async (forceServer = false): Promise<OnboardingRouteName> => {
    if (status === AuthStatus.ONBOARDING || status === AuthStatus.PHONE_VERIFIED) {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(true);
      setIsRouteReady(true);
      return ONBOARDING_SCREENS.identity;
    }

    if (status !== AuthStatus.AUTHENTICATED) {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(false);
      setIsRouteReady(true);
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
      if (me?.onboarding) {
        const flags = extractWorkerOnboardingFlags(me.onboarding);
        const next = applyWorkerFlags(flags);
        return next.route;
      }
      setIsRouteReady(true);
      return onboardingRoute;
    } finally {
      setLoading(false);
    }
  }, [applyWorkerFlags, me?.onboarding, onboardingRoute, refreshMe, status]);

  useLayoutEffect(() => {
    if (status === AuthStatus.BOOTSTRAPPING) {
      if (me?.onboarding) {
        const flags = extractWorkerOnboardingFlags(me.onboarding);
        applyWorkerFlags(flags);
      }
      setLoading(true);
      return;
    }

    if (status === AuthStatus.ONBOARDING || status === AuthStatus.PHONE_VERIFIED) {
      setOnboardingRoute(ONBOARDING_SCREENS.identity);
      setIsOnboardingActive(true);
      setIsRouteReady(true);
      setLoading(false);
      return;
    }

    if (status !== AuthStatus.AUTHENTICATED) {
      resetOnboardingSession();
      setIsRouteReady(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOnboardingActive(true);

    if (!me) {
      setLoading(false);
      setIsRouteReady(true);
      return;
    }

    if (me.onboarding) {
      const flags = extractWorkerOnboardingFlags(me.onboarding);
      applyWorkerFlags(flags);
      setLoading(false);
      return;
    }

    void refreshOnboardingRoute();
  }, [applyWorkerFlags, me?.onboarding, refreshOnboardingRoute, resetOnboardingSession, status]);

  const getOnboardingRedirect = useCallback((currentRoute: OnboardingRouteName) => {
    if (!isOnboardingActive) {
      return null;
    }
    if (
      currentRoute === ONBOARDING_SCREENS.serviceSelection
      && holdSkillSetupUntilCompletedRef.current
      && !localSeenSetupRef.current.hasSeenSkillSetup
    ) {
      return null;
    }
    return onboardingRoute === currentRoute ? null : onboardingRoute;
  }, [isOnboardingActive, onboardingRoute]);

  const markOnboardingStepSeen = useCallback((step: OnboardingCurrentStep) => {
    if (step === 'BASIC_PROFILE') {
      holdSkillSetupUntilCompletedRef.current = true;
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasPhoneVerified: true,
        hasCompletedBasicProfile: true,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.serviceSelection);
      setIsOnboardingActive(true);
      setIsRouteReady(true);
      return;
    }

    if (step === 'SERVICE_SELECTION') {
      holdSkillSetupUntilCompletedRef.current = false;
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasSeenSkillSetup: true,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.certification);
      setIsOnboardingActive(true);
      setIsRouteReady(true);
      return;
    }

    if (step === 'CERTIFICATE_UPLOAD') {
      localSeenSetupRef.current = {
        ...localSeenSetupRef.current,
        hasSeenCertificateSetup: true,
      };
      setOnboardingRoute(ONBOARDING_SCREENS.welcomeWorker);
      setIsOnboardingActive(true);
      setIsRouteReady(true);
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

  const completeOnboardingFlow = useCallback(async () => {
    await updateWorkerProfile(
      { hasSeenOnboardingWelcomeScreen: true },
      { showSuccessToast: false, showErrorToast: false },
    );
    markOnboardingStepSeen('WELCOME');
    try {
      await refreshMe();
    } catch {
      // The local onboarding state is already complete; a later refresh can reconcile.
    }
  }, [markOnboardingStepSeen, refreshMe]);

  const completeIdentityProfile = useCallback(async (payload: WorkerProfilePayload) => {
    logWorkerOnboardingFlow('completeIdentityProfile:start', {
      status,
      payload,
      onboardingRoute,
      isOnboardingActive,
      me,
    });
    holdSkillSetupUntilCompletedRef.current = true;
    await completeOnboarding(payload);
    logWorkerOnboardingFlow('completeIdentityProfile:completeOnboarding:success');
    markOnboardingStepSeen('BASIC_PROFILE');
    logWorkerOnboardingFlow('completeIdentityProfile:marked-basic-profile');
  }, [completeOnboarding, isOnboardingActive, markOnboardingStepSeen, me, onboardingRoute, status]);

  const getRequiredCertificates = useCallback(async (): Promise<WorkerCertificateCard[]> => {
    if (!inFlightCertificatesRef.current) {
      inFlightCertificatesRef.current = (async () => {
        const statusData = await getWorkerStatus<{
          certificates?: WorkerCertificateCard[];
          requiredCertificates?: WorkerCertificateCard[];
        }>();
        if (Array.isArray(statusData.certificates)) {
          return statusData.certificates;
        }
        return Array.isArray(statusData.requiredCertificates) ? statusData.requiredCertificates : [];
      })().finally(() => {
        inFlightCertificatesRef.current = null;
      });
    }

    return inFlightCertificatesRef.current;
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

  const onboardingLoading = loading || !isRouteReady;

  return useMemo<OnboardingContextType>(() => ({
    onboardingRoute,
    isOnboardingActive,
    loading: onboardingLoading,
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
    onboardingLoading,
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
