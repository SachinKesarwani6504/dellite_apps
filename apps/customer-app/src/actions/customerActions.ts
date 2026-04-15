import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  CreateCustomerProfileResponse,
  CustomerProfile,
  CustomerProfileResponse,
  UpdateCustomerIdentityPayload,
  UpdateCustomerProfilePayload,
} from '@/types/customer';
import { toFormData } from '@/utils/form-data';

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
  // Example: await createCustomerProfile({ firstName: 'Sachin', gender: 'MALE', file: { uri, name, type } });
  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      referralCode: payload.referralCode,
    },
    payload.file ? { file: payload.file } : undefined,
  );

  const response = await apiPost<
    ApiEnvelope<CreateCustomerProfileResponse> | CreateCustomerProfileResponse,
    FormData
  >('/customer/profile', formData, {
    tokenType: 'phone',
    retryOnAuthFailure: false,
  });

  return unwrapData(response);
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload): Promise<void> {
  // Example: await updateCustomerProfile({ preferredLanguage: 'EN', hasSeenOnboardingWelcomeScreen: true });
  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      preferredLanguage: payload.preferredLanguage,
      hasSeenOnboardingWelcomeScreen: payload.hasSeenOnboardingWelcomeScreen,
    },
    payload.file ? { file: payload.file } : undefined,
  );

  await apiPatch<{ profile?: CustomerProfile }, FormData>(
    '/customer/profile',
    formData,
    {
      auth: true,
      toast: {
        successMessage: 'Profile updated successfully',
      },
    },
  );
}

export async function markOnboardingWelcomeSeen(): Promise<void> {
  const formData = toFormData({ hasSeenOnboardingWelcomeScreen: true });
  await apiPatch<{ profile?: CustomerProfile }, FormData>(
    '/customer/profile',
    formData,
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
