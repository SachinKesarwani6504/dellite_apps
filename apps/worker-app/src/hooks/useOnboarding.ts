import { useCallback, useEffect } from 'react';
import {
  createWorkerCertificates,
  createWorkerServices,
  getCategories,
  getMe,
  getWorkerStatus,
  updateWorkerProfile,
  updateWorkerCertificates,
} from '@/actions';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  ServiceCategory,
  WorkerCertificateCard,
  WorkerCertificateCreatePayload,
  WorkerCertificateUpdatePayload,
} from '@/types/auth';
import { OnboardingRouteName } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';

type UseOnboardingScreenGuardParams = {
  currentRoute: OnboardingRouteName;
  onRedirect: (route: OnboardingRouteName) => void;
  refreshOnMount?: boolean;
};

export function useOnboardingScreenGuard({
  currentRoute,
  onRedirect,
  refreshOnMount = false,
}: UseOnboardingScreenGuardParams) {
  const { getOnboardingRedirect, refreshOnboardingRoute } = useAuthContext();

  useEffect(() => {
    if (!refreshOnMount) return;
    void refreshOnboardingRoute()
      .then(route => {
        if (route !== currentRoute) {
          onRedirect(route);
        }
      })
      .catch(() => {
        // Existing onboarding route in auth context still guards the current screen.
      });
  }, [currentRoute, onRedirect, refreshOnMount, refreshOnboardingRoute]);

  useEffect(() => {
    const redirect = getOnboardingRedirect(currentRoute);
    if (redirect) {
      onRedirect(redirect);
    }
  }, [currentRoute, getOnboardingRedirect, onRedirect]);
}

export function useOnboarding() {
  const { refreshOnboardingRoute, markOnboardingStepSeen } = useAuthContext();

  const fetchServiceCategories = useCallback(async (city: string): Promise<ServiceCategory[]> => {
    const categories = await getCategories({
      city,
      includeSubcategory: true,
      includeServices: true,
      includePriceOptions: true,
    });
    return Array.isArray(categories) ? categories : [];
  }, []);

  const saveWorkerServicesAndResolve = useCallback(async (
    city: string,
    services: string[],
  ): Promise<{ nextRoute: OnboardingRouteName }> => {
    await createWorkerServices({ city, services });
    await getMe('WORKER');
    const nextRoute = await refreshOnboardingRoute();
    return { nextRoute };
  }, [refreshOnboardingRoute]);

  const fetchRequiredCertificates = useCallback(async (): Promise<WorkerCertificateCard[]> => {
    const status = await getWorkerStatus<{
      certificates?: WorkerCertificateCard[];
      requiredCertificates?: WorkerCertificateCard[];
    }>();
    if (Array.isArray(status.certificates)) return status.certificates;
    if (Array.isArray(status.requiredCertificates)) return status.requiredCertificates;
    return [];
  }, []);

  const submitCertificatesAndResolve = useCallback(async (
    createPayload: WorkerCertificateCreatePayload,
    updatePayload: WorkerCertificateUpdatePayload,
  ): Promise<{ nextRoute: OnboardingRouteName }> => {
    if (Array.isArray(createPayload.certificates) && createPayload.certificates.length > 0) {
      await createWorkerCertificates(createPayload);
    }
    if (Array.isArray(updatePayload.certificates) && updatePayload.certificates.length > 0) {
      await updateWorkerCertificates(updatePayload);
    }

    await getMe('WORKER');

    const nextRoute = await refreshOnboardingRoute();
    return { nextRoute };
  }, [refreshOnboardingRoute]);

  const syncOnboardingRoute = useCallback(async (): Promise<OnboardingRouteName> => {
    return refreshOnboardingRoute();
  }, [refreshOnboardingRoute]);

  const skipServiceSetup = useCallback(async (): Promise<OnboardingRouteName> => {
    try {
      await updateWorkerProfile({ hasSeenSkillSetup: true });
      return await refreshOnboardingRoute();
    } catch {
      return ONBOARDING_SCREENS.serviceSelection;
    }
  }, [refreshOnboardingRoute]);

  const skipCertificateSetup = useCallback(async () => {
    markOnboardingStepSeen('CERTIFICATE_UPLOAD');
    try {
      await updateWorkerProfile({ hasSeenCertificateSetup: true });
      await refreshOnboardingRoute();
    } catch {
      // local state already moved forward; backend can be refreshed later
    }
  }, [markOnboardingStepSeen, refreshOnboardingRoute]);

  return {
    fetchServiceCategories,
    saveWorkerServicesAndResolve,
    fetchRequiredCertificates,
    submitCertificatesAndResolve,
    syncOnboardingRoute,
    skipServiceSetup,
    skipCertificateSetup,
  };
}
