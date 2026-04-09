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
import { stripBearerPrefix } from '@/utils';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

function unwrapDataDeep(payload: unknown): Record<string, unknown> {
  let current = payload;
  let depth = 0;
  while (depth < 3 && typeof current === 'object' && current !== null && 'data' in (current as Record<string, unknown>)) {
    const next = (current as { data?: unknown }).data;
    if (typeof next === 'undefined' || next === null) break;
    current = next;
    depth += 1;
  }
  return (typeof current === 'object' && current !== null ? current : {}) as Record<string, unknown>;
}

function findPhoneTokenCandidate(root: unknown): string | undefined {
  const queue: Array<{ value: unknown; keyPath: string[] }> = [{ value: root, keyPath: [] }];
  let hops = 0;

  while (queue.length > 0 && hops < 200) {
    const current = queue.shift();
    hops += 1;
    if (!current) break;

    const { value, keyPath } = current;
    if (!value || typeof value !== 'object') continue;

    for (const [key, next] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = [...keyPath, key];
      const keyNormalized = key.toLowerCase();
      const pathNormalized = nextPath.join('.').toLowerCase();

      if (typeof next === 'string' && next.trim().length > 0) {
        const looksLikePhoneTokenKey =
          keyNormalized === 'phonetoken'
          || keyNormalized === 'phoneverificationtoken'
          || keyNormalized === 'phone_token'
          || keyNormalized === 'verificationtoken'
          || keyNormalized === 'phoneverification'
          || (keyNormalized === 'token' && /phone|verification/.test(pathNormalized));

        if (looksLikePhoneTokenKey) {
          return next;
        }
      }

      if (next && typeof next === 'object') {
        queue.push({ value: next, keyPath: nextPath });
      }
    }
  }

  return undefined;
}

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null;
}

function normalizeIdentityVerification(value: unknown): AuthUser['userIdentityVerification'] | undefined {
  if (!isRecord(value)) return undefined;

  const candidate = value as AnyRecord;
  const rawIsVerified = candidate.isVerified ?? candidate.is_verified;
  const normalized = rawIsVerified === true
    || rawIsVerified === 1
    || String(rawIsVerified ?? '').trim().toLowerCase() === 'true';

  return {
    ...candidate,
    isVerified: normalized,
  };
}

function normalizeCount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeWorkerLink(value: unknown): AuthUser['workerLink'] | undefined {
  if (!isRecord(value)) return undefined;

  const source = value as AnyRecord;
  return {
    ...source,
    skillCount: normalizeCount(source.skillCount),
    completedJobCount: normalizeCount(source.completedJobCount),
    certificatesCount: normalizeCount(source.certificatesCount),
  };
}

function normalizeAuthUser(rawUser: unknown, fallbackSource?: AnyRecord): AuthUser {
  const source = isRecord(rawUser) ? rawUser : {};
  const normalizedUser: AuthUser = {
    ...(source as AuthUser),
  };

  const createdAtValue = source.createdAt ?? source.created_at ?? fallbackSource?.createdAt ?? fallbackSource?.created_at;
  if (typeof createdAtValue === 'string' || typeof createdAtValue === 'number') {
    normalizedUser.createdAt = String(createdAtValue);
  }

  const identityVerification = normalizeIdentityVerification(
    source.userIdentityVerification ?? source.user_identity_verification,
  ) ?? normalizeIdentityVerification(
    fallbackSource?.userIdentityVerification ?? fallbackSource?.user_identity_verification,
  );

  if (identityVerification) {
    normalizedUser.userIdentityVerification = identityVerification;
  }

  const linksRecord = isRecord(fallbackSource?.links) ? (fallbackSource?.links as AnyRecord) : undefined;
  const workerLink = normalizeWorkerLink(source.workerLink) ?? normalizeWorkerLink(linksRecord?.worker);
  if (workerLink) {
    normalizedUser.workerLink = workerLink;
  }

  const referralFromUser = isRecord(source.referral) ? source.referral : undefined;
  const referralFromRoot = isRecord(fallbackSource?.referral) ? fallbackSource?.referral : undefined;
  if (referralFromUser || referralFromRoot) {
    normalizedUser.referral = (referralFromUser ?? referralFromRoot) as AuthUser['referral'];
  }

  const referralCodeFromUser = typeof source.referralCode === 'string' ? source.referralCode : undefined;
  const referralCodeFromRoot = isRecord(fallbackSource?.referral) && typeof fallbackSource?.referral.code === 'string'
    ? fallbackSource.referral.code
    : undefined;
  if (referralCodeFromUser || referralCodeFromRoot) {
    normalizedUser.referralCode = referralCodeFromUser ?? referralCodeFromRoot;
  }

  const rolesFromUser = isRecord(source.roles) ? source.roles : undefined;
  const rolesFromRoot = isRecord(fallbackSource?.roles) ? fallbackSource?.roles : undefined;
  if (rolesFromUser || rolesFromRoot) {
    normalizedUser.roles = (rolesFromUser ?? rolesFromRoot) as AuthUser['roles'];
  }

  return normalizedUser;
}

function normalizeAuthMePayload(payload: unknown): AuthMeResponse {
  if (!isRecord(payload)) {
    return { user: {} as AuthUser };
  }

  const root = isRecord(payload.data) ? (payload.data as AnyRecord) : payload;
  if (isRecord(root.user)) {
    const linksRecord = isRecord(root.links) ? (root.links as AnyRecord) : undefined;
    const normalizedLinks: AuthMeResponse['links'] | undefined = linksRecord
      ? {
        ...(linksRecord as AuthMeResponse['links']),
        worker: normalizeWorkerLink(linksRecord.worker),
      }
      : undefined;
    return {
      ...(root as AuthMeResponse),
      links: normalizedLinks,
      referral: (isRecord(root.referral) ? root.referral : undefined) as AuthMeResponse['referral'],
      roles: (isRecord(root.roles) ? root.roles : undefined) as AuthMeResponse['roles'],
      user: normalizeAuthUser(root.user, root),
    };
  }

  return {
    ...(root as AuthMeResponse),
    user: normalizeAuthUser(root, root),
  };
}

type VerifyResponseData = {
  accessToken?: string;
  refreshToken?: string;
  phoneToken?: string;
  phoneVerificationToken?: string;
  phone_token?: string;
  verificationToken?: string;
  phoneVerification?: {
    token?: string;
    phoneToken?: string;
  };
  access_token?: string;
  refresh_token?: string;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    phoneToken?: string;
    phone_token?: string;
  };
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
  const data = unwrapDataDeep(response) as VerifyResponseData;
  const nestedTokens = (data.tokens ?? {}) as NonNullable<VerifyResponseData['tokens']>;
  const discoveredPhoneToken = findPhoneTokenCandidate(data);
  return {
    accessToken: data.accessToken ?? data.access_token ?? nestedTokens.accessToken ?? nestedTokens.access_token,
    refreshToken: data.refreshToken ?? data.refresh_token ?? nestedTokens.refreshToken ?? nestedTokens.refresh_token,
    phoneToken:
      data.phoneToken
      ?? data.phoneVerificationToken
      ?? data.phone_token
      ?? data.verificationToken
      ?? data.phoneVerification?.token
      ?? data.phoneVerification?.phoneToken
      ?? nestedTokens.phoneToken
      ?? nestedTokens.phone_token
      ?? discoveredPhoneToken,
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
  >('/auth/refresh', { refreshToken: stripBearerPrefix(refreshToken) }, { toast: { showSuccess: false } });
  return unwrapData(response);
}

export async function logoutCurrentSession(refreshToken: string): Promise<void> {
  await apiPost<ApiEnvelope<{ loggedOut: boolean }>, { refreshToken: string }>(
    '/auth/logout',
    {
      refreshToken: stripBearerPrefix(refreshToken),
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
  const response = await apiGet<ApiEnvelope<unknown> | unknown>(`/auth/me?role=${role}`, {
    auth: true,
    withCredentials: true,
    cache: 'no-store',
  });
  const data = unwrapData(response as ApiEnvelope<unknown>);
  return normalizeAuthMePayload(data);
}

export async function createProfileWithPhoneToken(
  payload: WorkerProfilePayload,
) {
  const workerResponse = await apiPost<ApiEnvelope<unknown>, WorkerProfilePayload>(
    '/worker/profile',
    payload,
    {
      tokenType: 'phone',
      retryOnAuthFailure: false,
    },
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
