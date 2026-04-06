import { useCallback, useEffect } from 'react';
import {
  createWorkerCertificates,
  createWorkerServices,
  getCategories,
  getMe,
  getWorkerStatus,
  updateWorkerCertificates,
} from '@/actions';
import { useAuth } from '@/hooks/useAuth';
import {
  ServiceCategory,
  WorkerCertificateCard,
  WorkerCertificateCreatePayload,
  WorkerCertificateUpdatePayload,
} from '@/types/auth';
import { OnboardingRouteName } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';

type WorkerOnboardingSource = {
  WORKER?: {
    hasUploadedRequiredCertificates?: boolean;
    isDocumentsCompleted?: boolean;
  };
  hasUploadedRequiredCertificates?: boolean;
  isDocumentsCompleted?: boolean;
};

type UseOnboardingGuardParams = {
  currentRoute: OnboardingRouteName;
  onRedirect: (route: OnboardingRouteName) => void;
  refreshOnMount?: boolean;
};

function isDocumentsCompletedFromMePayload(me: unknown): boolean {
  if (!me || typeof me !== 'object') return false;
  const payload = me as { onboarding?: unknown };
  const onboarding = payload.onboarding;
  if (!onboarding || typeof onboarding !== 'object') return false;

  const source = onboarding as WorkerOnboardingSource;

  if (typeof source.WORKER?.hasUploadedRequiredCertificates === 'boolean') {
    return source.WORKER.hasUploadedRequiredCertificates;
  }
  if (typeof source.WORKER?.isDocumentsCompleted === 'boolean') {
    return source.WORKER.isDocumentsCompleted;
  }
  if (typeof source.hasUploadedRequiredCertificates === 'boolean') {
    return source.hasUploadedRequiredCertificates;
  }
  if (typeof source.isDocumentsCompleted === 'boolean') {
    return source.isDocumentsCompleted;
  }
  return false;
}

export function useOnboarding() {
  const { getOnboardingRedirect, refreshOnboardingRoute } = useAuth();

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
  ): Promise<{ shouldShowWelcome: boolean; nextRoute: OnboardingRouteName }> => {
    await createWorkerServices({ city, services });
    const me = await getMe('WORKER');
    const shouldShowWelcome = isDocumentsCompletedFromMePayload(me);
    if (shouldShowWelcome) {
      return { shouldShowWelcome: true, nextRoute: ONBOARDING_SCREENS.welcome };
    }
    const nextRoute = await refreshOnboardingRoute();
    return { shouldShowWelcome: false, nextRoute };
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
  ): Promise<{ shouldShowWelcome: boolean; nextRoute: OnboardingRouteName }> => {
    if (Array.isArray(createPayload.certificates) && createPayload.certificates.length > 0) {
      await createWorkerCertificates(createPayload);
    }
    if (Array.isArray(updatePayload.certificates) && updatePayload.certificates.length > 0) {
      await updateWorkerCertificates(updatePayload);
    }

    const me = await getMe('WORKER');
    const shouldShowWelcome = isDocumentsCompletedFromMePayload(me);
    if (shouldShowWelcome) {
      return { shouldShowWelcome: true, nextRoute: ONBOARDING_SCREENS.welcome };
    }

    const nextRoute = await refreshOnboardingRoute();
    return { shouldShowWelcome: false, nextRoute };
  }, [refreshOnboardingRoute]);

  const syncOnboardingRoute = useCallback(async (): Promise<OnboardingRouteName> => {
    return refreshOnboardingRoute();
  }, [refreshOnboardingRoute]);

  const useScreenGuard = ({ currentRoute, onRedirect, refreshOnMount = false }: UseOnboardingGuardParams) => {
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
  };

  return {
    fetchServiceCategories,
    saveWorkerServicesAndResolve,
    fetchRequiredCertificates,
    submitCertificatesAndResolve,
    syncOnboardingRoute,
    useScreenGuard,
  };
}
