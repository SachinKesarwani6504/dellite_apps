import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import { AadharFileMeta, UserAadharData, UserBankInfo, UserBankInfoPayload } from '@/types/auth';
import type { MultipartFile } from '@/types/http';
import { toFormData } from '@/utils/form-data';

type UserBankInfoEnvelope = {
  bankInfo?: UserBankInfo | null;
};
type UserAadharEnvelope = {
  aadhar?: UserAadharData | null;
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

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeAadharFile(value: unknown): AadharFileMeta | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return {
    id: toOptionalString(raw.id),
    filename: toOptionalString(raw.filename),
    filepath: toOptionalString(raw.filepath),
    url: toOptionalString(raw.url),
  };
}

function normalizeAadhar(value: unknown): UserAadharData | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return {
    id: toOptionalString(raw.id),
    status: toOptionalString(raw.status),
    isVerified: toOptionalBoolean(raw.isVerified),
    hasAadharFrontFile: toOptionalBoolean(raw.hasAadharFrontFile ?? raw.hasAadhaarFrontFile),
    hasAadharBackFile: toOptionalBoolean(raw.hasAadharBackFile ?? raw.hasAadhaarBackFile),
    aadharFrontFileId: toOptionalString(raw.aadharFrontFileId ?? raw.aadhaarFrontFileId),
    aadharBackFileId: toOptionalString(raw.aadharBackFileId ?? raw.aadhaarBackFileId),
    aadharFrontFile: normalizeAadharFile(raw.aadharFrontFile ?? raw.aadhaarFrontFile),
    aadharBackFile: normalizeAadharFile(raw.aadharBackFile ?? raw.aadhaarBackFile),
    createdAt: toOptionalString(raw.createdAt),
    updatedAt: toOptionalString(raw.updatedAt),
  };
}

function extractAadhar(payload: unknown): UserAadharData | null {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as UserAadharEnvelope & UserAadharData;
  if ('aadhar' in source) {
    return normalizeAadhar(source.aadhar);
  }
  return normalizeAadhar(source);
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

type UpdateUserAadharPayload = {
  aadharFront?: MultipartFile;
  aadharBack?: MultipartFile;
  aadhaarFront?: MultipartFile;
  aadhaarBack?: MultipartFile;
};

export async function getUserAadhar(): Promise<UserAadharData | null> {
  const response = await apiGet<ApiEnvelope<UserAadharEnvelope> | UserAadharEnvelope>(
    '/user/aadhar',
    {
      auth: true,
      cache: 'no-store',
    },
  );
  const data = unwrapData(response as ApiEnvelope<UserAadharEnvelope>);
  return extractAadhar(data);
}

export async function updateUserAadhar(payload: UpdateUserAadharPayload): Promise<UserAadharData | null> {
  const aadharFront = payload.aadharFront ?? payload.aadhaarFront;
  const aadharBack = payload.aadharBack ?? payload.aadhaarBack;
  const formData = toFormData(
    {},
    {
      aadharFront,
      aadharBack,
    },
  );
  const response = await apiPatch<ApiEnvelope<UserAadharEnvelope>, FormData>(
    '/user/aadhar',
    formData,
    {
      auth: true,
      toast: {
        showSuccess: true,
        showError: true,
      },
    },
  );
  const data = unwrapData(response);
  return extractAadhar(data);
}
