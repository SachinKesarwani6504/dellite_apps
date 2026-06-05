import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import {
  APP_AUTH_ROLE,
  AuthMeResponse,
  AuthTokens,
  AuthUser,
  CreateWorkerProfileResponse,
  DeviceSessionUpsertPayload,
  SendOtpPayload,
  UserRole,
  VerifyOtpPayload,
  VerifyOtpResult,
  WorkerOnboardingPrefillData,
  WorkerProfilePayload,
} from '@/types/auth';
import { toFormData } from '@/utils/form-data';
import { getStableDeviceId, stripBearerPrefix, toBearerToken } from '@/utils';

function logWorkerAuthAction(step: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-auth][action] ${step}`, payload);
}

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

function extractEnvelopeMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;
  const message = (payload as { message?: unknown }).message;
  return typeof message === 'string' && message.trim().length > 0 ? message.trim() : undefined;
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

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function normalizeWorkerLink(value: unknown): AuthUser['workerLink'] | undefined {
  if (!isRecord(value)) return undefined;

  const source = value as AnyRecord;
  const currentStatusRaw = isRecord(source.currentStatus)
    ? source.currentStatus
    : (isRecord(source.current_status) ? source.current_status : undefined);
  const currentStatus = isRecord(currentStatusRaw)
    ? {
      ...currentStatusRaw,
      showStatusInUi: normalizeOptionalBoolean(currentStatusRaw.showStatusInUi ?? currentStatusRaw.show_status_in_ui),
    }
    : undefined;

  return {
    ...source,
    currentStatus: currentStatus as NonNullable<AuthUser['workerLink']>['currentStatus'],
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

  const workerOperatingCities = Array.isArray(source.workerOperatingCities)
    ? source.workerOperatingCities
    : (Array.isArray(source.worker_operating_cities) ? source.worker_operating_cities : undefined);
  if (workerOperatingCities) {
    normalizedUser.workerOperatingCities = workerOperatingCities
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map(value => value.trim().toUpperCase());
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
  status?: string;
  accessToken?: string;
  refreshToken?: string;
  phoneToken?: string;
  firebaseCustomToken?: string;
  firebase_custom_token?: string;
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
    firebaseCustomToken?: string;
    firebase_custom_token?: string;
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
      toast: { showSuccess: false },
    },
  );
  const data = unwrapDataDeep(response) as VerifyResponseData;
  const responseRecord = (typeof response === 'object' && response !== null ? response : {}) as Record<string, unknown>;
  const responseStatus =
    (typeof data.status === 'string' ? data.status : undefined)
    ?? (typeof responseRecord.status === 'string' ? responseRecord.status : undefined);
  const nestedTokens = (data.tokens ?? {}) as NonNullable<VerifyResponseData['tokens']>;
  const discoveredPhoneToken = findPhoneTokenCandidate(data);
  const message = extractEnvelopeMessage(response);
  return {
    message,
    status: responseStatus,
    accessToken: data.accessToken ?? data.access_token ?? nestedTokens.accessToken ?? nestedTokens.access_token,
    refreshToken: data.refreshToken ?? data.refresh_token ?? nestedTokens.refreshToken ?? nestedTokens.refresh_token,
    firebaseCustomToken:
      data.firebaseCustomToken
      ?? data.firebase_custom_token
      ?? nestedTokens.firebaseCustomToken
      ?? nestedTokens.firebase_custom_token,
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

export async function getWorkerOnboardingPrefill(phoneToken: string): Promise<WorkerOnboardingPrefillData | null> {
  const normalizedPhoneToken = stripBearerPrefix(phoneToken);
  if (!normalizedPhoneToken) {
    return null;
  }

  const response = await apiGet<ApiEnvelope<WorkerOnboardingPrefillData> | WorkerOnboardingPrefillData>(
    '/worker/onboarding/prefill',
    {
      tokenType: 'none',
      retryOnAuthFailure: false,
      headers: {
        Authorization: toBearerToken(normalizedPhoneToken),
      },
    },
  );

  const data = unwrapData(response);
  if (!data || typeof data !== 'object') {
    return null;
  }

  return data as WorkerOnboardingPrefillData;
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
  const deviceId = await getStableDeviceId();
  const response = await apiPost<
    ApiEnvelope<{ accessToken: string; refreshToken: string; firebaseCustomToken?: string }> | { accessToken: string; refreshToken: string; firebaseCustomToken?: string },
    { refreshToken: string; deviceId: string }
  >('/auth/refresh', { refreshToken: stripBearerPrefix(refreshToken), deviceId }, { toast: { showSuccess: false } });
  return unwrapData(response) as AuthTokens;
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
): Promise<CreateWorkerProfileResponse> {
  logWorkerAuthAction('createProfileWithPhoneToken:payload', payload);
  const workerOperatingCities = Array.isArray(payload.workerOperatingCities)
    ? payload.workerOperatingCities
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map(value => value.trim().toUpperCase())
    : [];

  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      bio: payload.bio,
      experienceYears: payload.experienceYears,
      referralCode: payload.referralCode,
      aadhaarFrontFilepath: payload.aadhaarFrontFilepath ?? payload.aadhaarFrontFilePath,
      aadhaarFrontFilename: payload.aadhaarFrontFilename ?? payload.aadhaarFrontFileName,
      aadhaarBackFilepath: payload.aadhaarBackFilepath ?? payload.aadhaarBackFilePath,
      aadhaarBackFilename: payload.aadhaarBackFilename ?? payload.aadhaarBackFileName,
      workerOperatingCities,
      deviceInfo: payload.deviceInfo ? JSON.stringify(payload.deviceInfo) : undefined,
    },
    {
      profileImage: payload.profileImage,
      aadhaarFront: payload.aadhaarFront,
      aadhaarBack: payload.aadhaarBack,
    },
  );
  const workerResponse = await apiPost<ApiEnvelope<CreateWorkerProfileResponse> | CreateWorkerProfileResponse, FormData>(
    '/worker/profile',
    formData,
    {
      tokenType: 'phone',
      retryOnAuthFailure: false,
    },
  );
  const unwrapped = unwrapData(workerResponse);
  logWorkerAuthAction('createProfileWithPhoneToken:response', {
    workerResponse,
    unwrapped,
  });
  return unwrapped;
}

export async function updateDeviceSession(payload: DeviceSessionUpsertPayload) {
  await apiPatch<ApiEnvelope<{ success?: boolean }> | { success?: boolean }, DeviceSessionUpsertPayload>(
    '/auth/device/upsert',
    payload,
    {
      auth: true,
      toast: { showError: false, showSuccess: false },
    },
  );
}
