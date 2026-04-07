import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import { UserBankInfo, UserBankInfoPayload } from '@/types/auth';

type UserBankInfoEnvelope = {
  bankInfo?: UserBankInfo | null;
};

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

function extractBankInfo(payload: unknown): UserBankInfo | null {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as UserBankInfoEnvelope;
  return source.bankInfo ?? null;
}

export async function getUserBankInfo(): Promise<UserBankInfo | null> {
  const response = await apiGet<ApiEnvelope<UserBankInfoEnvelope> | UserBankInfoEnvelope>(
    '/user/bank-info',
    {
      auth: true,
      withCredentials: true,
      cache: 'no-store',
    },
  );
  const data = unwrapData(response as ApiEnvelope<UserBankInfoEnvelope>);
  return extractBankInfo(data);
}

export async function createUserBankInfo(payload: UserBankInfoPayload): Promise<UserBankInfo | null> {
  const response = await apiPost<ApiEnvelope<UserBankInfoEnvelope>, UserBankInfoPayload>(
    '/user/bank-info',
    payload,
    {
      auth: true,
      toast: {
        successTitle: 'Bank Info Saved',
        successMessage: 'Your payout information was saved successfully.',
        errorTitle: 'Bank Info Save Failed',
      },
    },
  );
  const data = unwrapData(response);
  return extractBankInfo(data);
}

export async function updateUserBankInfo(payload: Partial<UserBankInfoPayload>): Promise<UserBankInfo | null> {
  const response = await apiPatch<ApiEnvelope<UserBankInfoEnvelope>, Partial<UserBankInfoPayload>>(
    '/user/bank-info',
    payload,
    {
      auth: true,
      toast: {
        successTitle: 'Bank Info Updated',
        successMessage: 'Your payout information was updated successfully.',
        errorTitle: 'Bank Info Update Failed',
      },
    },
  );
  const data = unwrapData(response);
  return extractBankInfo(data);
}
