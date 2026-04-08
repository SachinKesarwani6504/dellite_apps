import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import type {
  CreateCustomerProfileResponse,
  CustomerProfile,
  CustomerProfileResponse,
  UpdateCustomerIdentityPayload,
  UpdateCustomerProfilePayload,
} from '@/types/customer';
import { getAuthTokens } from '@/utils/key-chain-storage';

export async function getCustomerProfile(): Promise<CustomerProfile> {
  const envelope = await apiGet<CustomerProfileResponse>('/customer/profile');
  return envelope.data.profile;
}

export async function createCustomerProfile(
  payload: UpdateCustomerIdentityPayload,
  token: string,
): Promise<CreateCustomerProfileResponse> {
  const envelope = await apiPost<CreateCustomerProfileResponse>('/customer/profile', payload, {
    token,
  });

  return envelope.data;
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload): Promise<void> {
  await apiPatch<{ profile?: CustomerProfile }>(
    '/customer/profile',
    payload,
    {
      toast: {
        successMessage: 'Profile updated successfully',
      },
    },
  );
}

export async function markOnboardingWelcomeSeen(token?: string | null): Promise<void> {
  let resolvedToken = token ?? null;
  if (!resolvedToken) {
    const tokens = await getAuthTokens();
    resolvedToken = tokens?.accessToken ?? null;
  }

  await apiPatch<{ profile?: CustomerProfile }>(
    '/customer/profile',
    { hasSeenOnboardingWelcomeScreen: true },
    {
      token: resolvedToken ?? undefined,
      toast: {
        enabled: false,
        showSuccess: false,
        showError: false,
      },
    },
  );
}
