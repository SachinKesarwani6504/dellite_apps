import axios, { AxiosRequestConfig, Method } from 'axios';
import { getAuthTokens, saveAuthTokens } from '@/utils/key-chain-storage/auth-storage';
import { ApiError } from '@/types/api';
import { RequestOptions } from '@/types/http';
import { showApiErrorToast, showApiSuccessToast } from '@/utils/toast';
import { toBearerToken } from '@/utils';
import { AuthTokens } from '@/types/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (typeof payload === 'object' && payload !== null) {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }

    const maybeError = (payload as { error?: unknown }).error;
    if (typeof maybeError === 'string' && maybeError.trim().length > 0) {
      return maybeError;
    }
  }

  return fallback;
}

async function refreshTokensIfNeeded(): Promise<string | null> {
  const current = await getAuthTokens();
  const refreshToken = current?.refreshToken;
  if (!refreshToken) return null;

  const response = await client.post<{ data?: AuthTokens } | AuthTokens>('/auth/refresh', {
    refreshToken: toBearerToken(refreshToken),
  });

  const payload = response.data as { data?: AuthTokens } | AuthTokens;
  const refreshed = (typeof payload === 'object' && payload !== null && 'data' in payload
    ? payload.data
    : payload) as AuthTokens | undefined;

  if (!refreshed?.accessToken || !refreshed?.refreshToken) {
    return null;
  }

  await saveAuthTokens(refreshed);
  return refreshed.accessToken;
}

async function request<TResponse, TBody = unknown>(
  method: Method,
  path: string,
  body?: TBody,
  options: RequestOptions = {},
): Promise<TResponse> {
  const retryOnAuthFailure = options.retryOnAuthFailure ?? true;

  try {
    const config: AxiosRequestConfig = {
      method,
      url: path,
      data: body,
      headers: { ...(options.headers ?? {}) },
      withCredentials: options.withCredentials,
    };

    if (options.cache === 'no-store') {
      config.headers = {
        ...config.headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      };
    }

    if (options.auth) {
      const tokens = await getAuthTokens();
      if (tokens?.accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: toBearerToken(tokens.accessToken),
        };
      }
    }

    const response = await client.request<TResponse>(config);
    if (method !== 'GET' && options.toast?.showSuccess !== false) {
      showApiSuccessToast(extractMessage(response.data, 'Completed successfully'));
    }
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (
        retryOnAuthFailure &&
        options.auth &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        try {
          const accessToken = await refreshTokensIfNeeded();
          if (accessToken) {
            return request<TResponse, TBody>(method, path, body, {
              ...options,
              retryOnAuthFailure: false,
              headers: {
                ...(options.headers ?? {}),
                Authorization: toBearerToken(accessToken),
              },
            });
          }
        } catch {
          // If refresh fails, continue with the original API error handling.
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

    if (method !== 'GET' && options.toast?.showError !== false) {
      showApiErrorToast('Unknown network error');
    }

    throw new ApiError('Unknown network error', 500, error);
  }
}

export function apiGet<TResponse>(path: string, options?: RequestOptions) {
  return request<TResponse>('GET', path, undefined, options);
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: RequestOptions,
) {
  return request<TResponse, TBody>('POST', path, body, options);
}

export function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: RequestOptions,
) {
  return request<TResponse, TBody>('PATCH', path, body, options);
}

export function apiDelete<TResponse>(path: string, options?: RequestOptions) {
  return request<TResponse>('DELETE', path, undefined, options);
}
