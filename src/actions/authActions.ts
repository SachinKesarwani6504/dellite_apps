import { apiGet, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import {
  AadhaarIdentityVerificationPayload,
  AadhaarIdentityVerificationRecord,
  AadhaarIdentityVerificationSaveResult,
  APP_AUTH_ROLE,
  AuthMeResponse,
  AuthTokens,
  AuthUser,
  SendOtpPayload,
  UserRole,
  VerifyOtpPayload,
  VerifyOtpResult,
  WorkerProfilePayload,
} from '@/types/auth';
import { toBearerToken } from '@/utils';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

type VerifyResponseData = {
  accessToken?: string;
  refreshToken?: string;
  phoneToken?: string;
  user?: AuthUser;
};

export async function sendOtp(payload: SendOtpPayload): Promise<void> {
  await apiPost<ApiEnvelope<{ otp?: string }>, SendOtpPayload>('/auth/send-otp', payload, {
    toast: {
      successTitle: 'OTP Sent',
      successMessage: 'Verification code sent to your phone.',
      errorTitle: 'OTP Send Failed',
    },
  });
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
  const response = await apiPost<ApiEnvelope<VerifyResponseData>, VerifyOtpPayload>(
    '/auth/verify-otp',
    payload,
    {
      toast: {
        successTitle: 'OTP Verified',
        successMessage: 'Your phone has been verified.',
        errorTitle: 'Verification Failed',
      },
    },
  );
  const data = unwrapData(response);
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    phoneToken: data.phoneToken,
    user: data.user,
  };
}

export async function resendOtp(phone: string): Promise<void> {
  await apiPost<ApiEnvelope<{ otp?: string }>, { phone: string }>('/auth/resend-otp', { phone }, {
    toast: {
      successTitle: 'OTP Resent',
      successMessage: 'A fresh OTP was sent to your phone.',
      errorTitle: 'Resend Failed',
    },
  });
}

export async function refreshAuth(refreshToken: string): Promise<AuthTokens> {
  const response = await apiPost<
    ApiEnvelope<{ accessToken: string; refreshToken: string }>,
    { refreshToken: string }
  >('/auth/refresh', { refreshToken: toBearerToken(refreshToken) }, { toast: { success: false } });
  return unwrapData(response);
}

export async function logoutCurrentSession(refreshToken: string): Promise<void> {
  await apiPost<ApiEnvelope<{ loggedOut: boolean }>, { refreshToken: string }>(
    '/auth/logout',
    {
      refreshToken: toBearerToken(refreshToken),
    },
    {
      toast: {
        successTitle: 'Logged Out',
        successMessage: 'Your session has been closed.',
        errorTitle: 'Logout Warning',
      },
    },
  );
}

export async function getMe(role: UserRole = APP_AUTH_ROLE): Promise<AuthMeResponse> {
  const response = await apiGet<ApiEnvelope<AuthMeResponse | AuthUser>>(`/auth/me?role=${role}`, {
    auth: true,
    withCredentials: true,
    cache: 'no-store',
  });
  const data = unwrapData(response) as AuthMeResponse | AuthUser;

  if (typeof data === 'object' && data !== null && 'user' in data) {
    return data as AuthMeResponse;
  }

  return { user: data as AuthUser };
}

export async function createProfileWithPhoneToken(
  payload: WorkerProfilePayload,
  phoneToken: string,
) {
  const headers = { Authorization: toBearerToken(phoneToken) };
  const workerResponse = await apiPost<ApiEnvelope<unknown>, WorkerProfilePayload>(
    '/worker/profile',
    payload,
    { headers },
  );
  return unwrapData(workerResponse);
}

export async function saveAadhaarIdentityVerification(
  payload: AadhaarIdentityVerificationPayload,
): Promise<AadhaarIdentityVerificationSaveResult> {
  const response = await apiPost<ApiEnvelope<unknown>, AadhaarIdentityVerificationPayload>(
    '/auth/identity-verifications/aadhaar',
    payload,
    {
      auth: true,
      toast: {
        successTitle: 'Aadhaar Saved',
        successMessage: 'Aadhaar verification saved successfully.',
        errorTitle: 'Aadhaar Save Failed',
      },
    },
  );

  const data = unwrapData(response) as AadhaarIdentityVerificationRecord & { message?: string };
  const isVerified = typeof data?.aadhaarVerificationStatus === 'string'
    && data.aadhaarVerificationStatus.toUpperCase() === 'VERIFIED';

  return {
    isVerified,
    message: data?.message,
    record: data,
  };
}
