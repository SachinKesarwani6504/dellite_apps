import { apiGet, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import type {
  AuthMeResponse,
  LogoutPayload,
  LogoutResponse,
  RefreshTokensPayload,
  RefreshTokensResponse,
  ResendOtpResponse,
  RequestOtpPayload,
  RequestOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from '@/types/auth';
import { stripBearerPrefix } from '@/utils/token';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

export async function sendOtp(payload: RequestOtpPayload): Promise<RequestOtpResponse> {
  const requestBody = { phone: payload.phone, role: payload.role ?? 'CUSTOMER' };

  try {
    const response = await apiPost<ApiEnvelope<RequestOtpResponse> | RequestOtpResponse>(
      '/auth/send-otp',
      requestBody,
      {
        retryOnAuthFailure: false,
      },
    );
    return unwrapData(response);
  } catch {
    const response = await apiPost<ApiEnvelope<RequestOtpResponse> | RequestOtpResponse>(
      '/auth/request-otp',
      requestBody,
      {
        retryOnAuthFailure: false,
      },
    );
    return unwrapData(response);
  }
}

export async function requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResponse> {
  return sendOtp(payload);
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const response = await apiPost<ApiEnvelope<VerifyOtpResponse> | VerifyOtpResponse>('/auth/verify-otp', payload, {
    retryOnAuthFailure: false,
  });
  return unwrapData(response);
}

export async function resendOtp(phone: string): Promise<ResendOtpResponse> {
  const response = await apiPost<ApiEnvelope<ResendOtpResponse> | ResendOtpResponse>('/auth/resend-otp', { phone }, {
    retryOnAuthFailure: false,
  });
  return unwrapData(response);
}

export async function refreshAuth(refreshToken: string): Promise<RefreshTokensResponse> {
  const response = await apiPost<
    ApiEnvelope<RefreshTokensResponse> | RefreshTokensResponse,
    { refreshToken: string }
  >('/auth/refresh', { refreshToken: stripBearerPrefix(refreshToken) }, { toast: { showSuccess: false }, retryOnAuthFailure: false });
  return unwrapData(response);
}

export async function refreshTokens(
  payload: RefreshTokensPayload,
): Promise<RefreshTokensResponse> {
  return refreshAuth(payload.refreshToken);
}

export async function logoutCurrentSession(refreshToken: string): Promise<LogoutResponse> {
  const response = await apiPost<ApiEnvelope<LogoutResponse> | LogoutResponse, { refreshToken: string }>(
    '/auth/logout',
    {
      refreshToken: stripBearerPrefix(refreshToken),
    },
    {
      retryOnAuthFailure: false,
    },
  );

  return unwrapData(response);
}

export async function logout(payload: LogoutPayload): Promise<LogoutResponse> {
  return logoutCurrentSession(payload.refreshToken);
}

export async function getMe(role: 'CUSTOMER' | 'WORKER' | 'ADMIN' = 'CUSTOMER') {
  const response = await apiGet<ApiEnvelope<AuthMeResponse> | AuthMeResponse>(`/auth/me?role=${role}`, {
    auth: true,
    withCredentials: true,
    cache: 'no-store',
  });

  return unwrapData(response);
}
