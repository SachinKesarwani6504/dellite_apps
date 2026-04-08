import { apiGet, apiPost } from '@/actions/http/httpClient';
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

export async function requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResponse> {
  const requestBody = { phone: payload.phone, role: payload.role ?? 'CUSTOMER' };

  try {
    const envelope = await apiPost<RequestOtpResponse>('/auth/send-otp', requestBody, {
      auth: false,
    });
    return envelope.data;
  } catch {
    const envelope = await apiPost<RequestOtpResponse>('/auth/request-otp', requestBody, {
      auth: false,
    });
    return envelope.data;
  }
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const envelope = await apiPost<VerifyOtpResponse>('/auth/verify-otp', payload, {
    auth: false,
  });
  return envelope.data;
}

export async function resendOtp(phone: string): Promise<ResendOtpResponse> {
  const envelope = await apiPost<ResendOtpResponse>('/auth/resend-otp', { phone }, {
    auth: false,
  });
  return envelope.data;
}

export async function refreshTokens(
  payload: RefreshTokensPayload,
): Promise<RefreshTokensResponse> {
  const envelope = await apiPost<RefreshTokensResponse>('/auth/refresh', payload, {
    auth: false,
  });
  return envelope.data;
}

export async function logout(payload: LogoutPayload): Promise<LogoutResponse> {
  const envelope = await apiPost<LogoutResponse>('/auth/logout', payload, {
    auth: false,
  });
  return envelope.data;
}

export async function getMe(role: 'CUSTOMER' | 'WORKER' | 'ADMIN' = 'CUSTOMER') {
  const envelope = await apiGet<AuthMeResponse>(`/auth/me?role=${role}`, {
    cache: 'no-store',
  });

  return envelope.data;
}
