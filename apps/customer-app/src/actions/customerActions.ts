import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  CreateCustomerProfileResponse,
  CustomerProfile,
  CustomerProfileResponse,
  UpdateCustomerIdentityPayload,
  UpdateCustomerProfilePayload,
} from '@/types/customer';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

export async function getCustomerProfile(): Promise<CustomerProfile> {
  const response = await apiGet<ApiEnvelope<CustomerProfileResponse> | CustomerProfileResponse>(
    '/customer/profile',
    { auth: true },
  );
  return unwrapData(response).profile;
}

export async function createCustomerProfile(
  payload: UpdateCustomerIdentityPayload,
): Promise<CreateCustomerProfileResponse> {
  const response = await apiPost<
    ApiEnvelope<CreateCustomerProfileResponse> | CreateCustomerProfileResponse,
    UpdateCustomerIdentityPayload
  >('/customer/profile', payload, {
    tokenType: 'phone',
    retryOnAuthFailure: false,
  });

  return unwrapData(response);
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload): Promise<void> {
  await apiPatch<{ profile?: CustomerProfile }, UpdateCustomerProfilePayload>(
    '/customer/profile',
    payload,
    {
      auth: true,
      toast: {
        successMessage: 'Profile updated successfully',
      },
    },
  );
}

export async function markOnboardingWelcomeSeen(): Promise<void> {
  await apiPatch<{ profile?: CustomerProfile }, { hasSeenOnboardingWelcomeScreen: boolean }>(
    '/customer/profile',
    { hasSeenOnboardingWelcomeScreen: true },
    {
      auth: true,
      toast: {
        enabled: false,
        showSuccess: false,
        showError: false,
      },
    },
  );
}
