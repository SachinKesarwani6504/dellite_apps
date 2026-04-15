import axios from 'axios';
import { AuthTokens } from '@/types/auth';
import { ApiError } from '@/types/api';
import { RequestOptions } from '@/types/http';
import {
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
} from '@/utils/key-chain-storage/auth-storage';
import {
  clearOnboardingPhoneToken,
  getOnboardingPhoneToken,
} from '@/utils/key-chain-storage/onboarding-storage';
import { stripBearerPrefix, toBearerToken } from '@/utils/token';
import { showApiErrorToast, showApiSuccessToast } from '@/utils/toast';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type TokenType = NonNullable<RequestOptions['tokenType']>;

const runtimeGlobal = globalThis as {
  process?: { env?: Record<string, string | undefined> };
};

const API_BASE_URL = runtimeGlobal.process?.env?.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const PROFILE_CREATE_PATHS = new Set(['/worker/profile', '/customer/profile']);
const PHONE_TOKEN_EXPIRED_MESSAGE = 'Session expired. Please verify OTP again to continue onboarding.';

function normalizePath(path: string) {
  return path.split('?')[0].trim().toLowerCase();
}

function extractApiMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (!payload || typeof payload !== 'object') return fallback;

  const obj = payload as { message?: unknown; error?: unknown; data?: unknown };
  if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;

  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as { message?: unknown; error?: unknown };
    if (typeof nested.message === 'string' && nested.message.trim()) return nested.message;
    if (typeof nested.error === 'string' && nested.error.trim()) return nested.error;
  }
  return fallback;
}

function normalizeBearerToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }
  return stripBearerPrefix(token);
}

function enforceTokenPolicy(method: HttpMethod, path: string, tokenType: TokenType) {
  const isProfileCreate = method === 'POST' && PROFILE_CREATE_PATHS.has(normalizePath(path));
  if (isProfileCreate && tokenType !== 'phone') {
    throw new ApiError('Profile creation must use phoneToken. Please verify OTP again.', 400);
  }
  if (!isProfileCreate && tokenType === 'phone') {
    throw new ApiError('phoneToken can only be used for profile creation APIs.', 400);
  }
}

async function resolveToken(tokenType: TokenType): Promise<string | null> {
  if (tokenType === 'none') return null;

  if (tokenType === 'phone') {
    const raw = await getOnboardingPhoneToken();
    return normalizeBearerToken(raw);
  }

  const tokens = await getAuthTokens();
  return normalizeBearerToken(tokens?.accessToken);
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getAuthTokens();
  const refreshToken = normalizeBearerToken(tokens?.refreshToken);
  if (!refreshToken) return null;

  const refreshResponse = await client.post<{ data?: AuthTokens } | AuthTokens>('/auth/refresh', {
    refreshToken,
  });

  const payload = refreshResponse.data as { data?: AuthTokens } | AuthTokens;
  const refreshed = (typeof payload === 'object' && payload !== null && 'data' in payload
    ? payload.data
    : payload) as AuthTokens | undefined;

  if (!refreshed?.accessToken || !refreshed?.refreshToken) return null;

  await saveAuthTokens({
    accessToken: normalizeBearerToken(refreshed.accessToken) as string,
    refreshToken: normalizeBearerToken(refreshed.refreshToken) as string,
  });
  return normalizeBearerToken(refreshed.accessToken);
}

async function clearAuthSessionTokens() {
  await clearAuthTokens();
}

async function clearPhoneTokenOnly() {
  await clearOnboardingPhoneToken();
}

function shouldRefresh(errorStatus: number | undefined, tokenType: TokenType, options: RequestOptions, hasExplicitAuthorization: boolean) {
  if (tokenType !== 'access') return false;
  if (options.retryOnAuthFailure === false) return false;
  if (hasExplicitAuthorization) return false;
  return errorStatus === 401 || errorStatus === 403;
}

function buildRequestUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function parseFetchPayload(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request<TResponse, TBody = unknown>(
  method: HttpMethod,
  path: string,
  body?: TBody,
  options: RequestOptions = {},
): Promise<TResponse> {
  const tokenType: TokenType = options.tokenType ?? (options.auth ? 'access' : 'none');
  const hasExplicitAuthorization = Boolean(options.headers?.Authorization?.trim());
  enforceTokenPolicy(method, path, tokenType);

  const token = hasExplicitAuthorization ? null : await resolveToken(tokenType);
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: toBearerToken(token) } : {}),
  };
  const isMultipartRequest = typeof FormData !== 'undefined' && body instanceof FormData;
  if (isMultipartRequest) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  if (options.cache === 'no-store') {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    headers.Pragma = 'no-cache';
    headers.Expires = '0';
  }

  const config = {
    method,
    url: path,
    data: body,
    headers,
    withCredentials: options.withCredentials,
    transformRequest: isMultipartRequest ? ((data: unknown) => data) : undefined,
  };

  if (isMultipartRequest) {
    const sendMultipart = async (requestHeaders: Record<string, string>) => fetch(buildRequestUrl(path), {
      method,
      headers: requestHeaders,
      body: body as unknown as BodyInit,
    });

    try {
      let multipartResponse = await sendMultipart(headers);

      if (!multipartResponse.ok && shouldRefresh(multipartResponse.status, tokenType, options, hasExplicitAuthorization)) {
        const nextAccessToken = await refreshAccessToken();
        if (!nextAccessToken) {
          await clearAuthSessionTokens();
          throw new ApiError('Session expired. Please login again.', 401);
        }

        multipartResponse = await sendMultipart({
          ...headers,
          Authorization: toBearerToken(nextAccessToken),
        });
      }

      const payload = await parseFetchPayload(multipartResponse);
      if (!multipartResponse.ok) {
        if (tokenType === 'phone' && (multipartResponse.status === 401 || multipartResponse.status === 403)) {
          await clearPhoneTokenOnly();
          if (method !== 'GET' && options.toast?.showError !== false) {
            showApiErrorToast(PHONE_TOKEN_EXPIRED_MESSAGE);
          }
          throw new ApiError(PHONE_TOKEN_EXPIRED_MESSAGE, multipartResponse.status, payload);
        }
        const message = extractApiMessage(payload, multipartResponse.statusText || 'Request failed');
        if (method !== 'GET' && options.toast?.showError !== false) {
          showApiErrorToast(message);
        }
        throw new ApiError(message, multipartResponse.status, payload);
      }

      if (method !== 'GET' && options.toast?.showSuccess !== false) {
        showApiSuccessToast(extractApiMessage(payload, 'Completed successfully'));
      }
      return payload as TResponse;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (method !== 'GET' && options.toast?.showError !== false) {
        showApiErrorToast('Network Error');
      }
      throw new ApiError('Network Error', 500, error);
    }
  }

  try {
    const response = await client.request<TResponse>(config);
    if (method !== 'GET' && options.toast?.showSuccess !== false) {
      showApiSuccessToast(extractApiMessage(response.data, 'Completed successfully'));
    }
    return response.data;
  } catch (error: unknown) {
    if (!axios.isAxiosError(error)) {
      if (method !== 'GET' && options.toast?.showError !== false) {
        showApiErrorToast('Unknown network error');
      }
      throw new ApiError('Unknown network error', 500, error);
    }

    if (shouldRefresh(error.response?.status, tokenType, options, hasExplicitAuthorization)) {
      try {
        const nextAccessToken = await refreshAccessToken();
        if (!nextAccessToken) {
          await clearAuthSessionTokens();
          throw new ApiError('Session expired. Please login again.', 401, error.response?.data);
        }

        const retryResponse = await client.request<TResponse>({
          ...config,
          headers: {
            ...headers,
            Authorization: toBearerToken(nextAccessToken),
          },
        });

        if (method !== 'GET' && options.toast?.showSuccess !== false) {
          showApiSuccessToast(extractApiMessage(retryResponse.data, 'Completed successfully'));
        }
        return retryResponse.data;
      } catch {
        await clearAuthSessionTokens();
        throw new ApiError('Session expired. Please login again.', 401, error.response?.data);
      }
    }

    if (tokenType === 'phone' && (error.response?.status === 401 || error.response?.status === 403)) {
      await clearPhoneTokenOnly();
      if (method !== 'GET' && options.toast?.showError !== false) {
        showApiErrorToast(PHONE_TOKEN_EXPIRED_MESSAGE);
      }
      throw new ApiError(PHONE_TOKEN_EXPIRED_MESSAGE, error.response?.status ?? 401, error.response?.data);
    }

    const statusCode = error.response?.status ?? 500;
    const payload = error.response?.data;
    const message = extractApiMessage(payload, error.message ?? 'Request failed');
    if (method !== 'GET' && options.toast?.showError !== false) {
      showApiErrorToast(message);
    }
    throw new ApiError(message, statusCode, payload);
  }
}

export function apiGet<TResponse>(path: string, options?: RequestOptions) {
  return request<TResponse>('GET', path, undefined, options);
}

export function apiPost<TResponse, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions) {
  return request<TResponse, TBody>('POST', path, body, options);
}

export function apiPatch<TResponse, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions) {
  return request<TResponse, TBody>('PATCH', path, body, options);
}

export function apiDelete<TResponse>(path: string, options?: RequestOptions) {
  return request<TResponse>('DELETE', path, undefined, options);
}
