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

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const PROFILE_CREATE_PATHS = new Set(['/worker/profile', '/customer/profile']);

function normalizePath(path: string) {
  return path.split('?')[0].trim().toLowerCase();
}

function extractMessage(payload: unknown, fallback: string) {
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
    return raw ? stripBearerPrefix(raw) : null;
  }

  const tokens = await getAuthTokens();
  return tokens?.accessToken ? stripBearerPrefix(tokens.accessToken) : null;
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getAuthTokens();
  const refreshToken = tokens?.refreshToken ? stripBearerPrefix(tokens.refreshToken) : null;
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
    accessToken: stripBearerPrefix(refreshed.accessToken),
    refreshToken: stripBearerPrefix(refreshed.refreshToken),
  });
  return stripBearerPrefix(refreshed.accessToken);
}

async function clearAllTokens() {
  await clearAuthTokens();
  await clearOnboardingPhoneToken();
}

function shouldRefresh(errorStatus: number | undefined, tokenType: TokenType, options: RequestOptions, hasExplicitAuthorization: boolean) {
  if (tokenType !== 'access') return false;
  if (options.retryOnAuthFailure === false) return false;
  if (hasExplicitAuthorization) return false;
  return errorStatus === 401 || errorStatus === 403;
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
  };

  try {
    const response = await client.request<TResponse>(config);
    if (method !== 'GET' && options.toast?.showSuccess !== false) {
      showApiSuccessToast(extractMessage(response.data, 'Completed successfully'));
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
          await clearAllTokens();
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
          showApiSuccessToast(extractMessage(retryResponse.data, 'Completed successfully'));
        }
        return retryResponse.data;
      } catch {
        await clearAllTokens();
        throw new ApiError('Session expired. Please login again.', 401, error.response?.data);
      }
    }

    const statusCode = error.response?.status ?? 500;
    const payload = error.response?.data;
    const message = extractMessage(payload, error.message ?? 'Request failed');
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
