import type { ApiEnvelope, ApiRequestOptions } from '@/types/api';
import { showApiErrorToast, showApiSuccessToast } from '@/utils/toast';

const runtimeGlobal = globalThis as {
  process?: { env?: Record<string, string | undefined> };
};

const API_BASE_URL = runtimeGlobal.process?.env?.EXPO_PUBLIC_API_BASE_URL;

let authToken: string | null = null;

export class ApiHttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = ApiRequestOptions & {
  auth?: boolean;
  cache?: 'default' | 'no-store';
};

function extractApiMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const obj = payload as {
    message?: unknown;
    error?: unknown;
    data?: unknown;
  };

  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }

  if (Array.isArray(obj.message) && obj.message.length > 0) {
    return obj.message
      .map((entry) => (typeof entry === 'string' ? entry : String(entry)))
      .join(', ');
  }

  if (typeof obj.error === 'string' && obj.error.trim()) {
    return obj.error.trim();
  }

  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as { message?: unknown; error?: unknown };
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message.trim();
    }
    if (typeof nested.error === 'string' && nested.error.trim()) {
      return nested.error.trim();
    }
  }

  return fallback;
}

function normalizeBearerToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  return token.replace(/^Bearer\s+/i, '').trim();
}

export function setAuthToken(token: string | null) {
  authToken = normalizeBearerToken(token);
}

export function getAuthToken() {
  return authToken;
}

function createUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
  }

  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function normalizeEnvelope<T>(payload: unknown, fallbackMessage: string): ApiEnvelope<T> {
  if (payload && typeof payload === 'object') {
    const raw = payload as {
      success?: boolean;
      message?: string;
      data?: unknown;
      statusCode?: number;
    };

    if ('success' in raw && 'data' in raw) {
      return {
        success: Boolean(raw.success),
        message: extractApiMessage(raw, fallbackMessage),
        data: raw.data as T,
      };
    }

    if ('data' in raw) {
      return {
        success: raw.success ?? (raw.statusCode ? raw.statusCode < 400 : true),
        message: extractApiMessage(raw, fallbackMessage),
        data: raw.data as T,
      };
    }
  }

  return {
    success: true,
    message: fallbackMessage,
    data: payload as T,
  };
}

async function handleResponse<T>(response: Response, toastEnabled: boolean): Promise<ApiEnvelope<T>> {
  const responseText = await response.text();
  let responseData: unknown = null;
  try {
    responseData = responseText ? (JSON.parse(responseText) as unknown) : null;
  } catch {
    responseData = { message: responseText };
  }

  if (!response.ok) {
    const message = extractApiMessage(responseData, 'Something went wrong');

    if (toastEnabled) {
      showApiErrorToast(message);
    }

    throw new ApiHttpError(message, response.status, undefined, responseData);
  }

  return normalizeEnvelope<T>(responseData, 'Request succeeded');
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiEnvelope<T>> {
  const resolvedToken = normalizeBearerToken(options?.token ?? authToken);
  const isMutatingRequest = method === 'POST' || method === 'PATCH' || method === 'DELETE';
  const defaultToastEnabled = options?.toast?.enabled ?? isMutatingRequest;
  const showSuccessToast = options?.toast?.showSuccess ?? defaultToastEnabled;
  const showErrorToast = options?.toast?.showError ?? defaultToastEnabled;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };

  if (options?.auth !== false && resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const envelope = await handleResponse<T>(
    await fetch(createUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    }),
    showErrorToast,
  );

  if (envelope.success && showSuccessToast) {
    showApiSuccessToast(options?.toast?.successMessage ?? envelope.message ?? 'Request succeeded');
  }

  if (!envelope.success) {
    const message = options?.toast?.errorMessage ?? envelope.message ?? 'Request failed';
    if (showErrorToast) {
      showApiErrorToast(message);
    }
    throw new ApiHttpError(message, 200, undefined, envelope);
  }

  return envelope;
}

export function apiGet<T>(path: string, options?: RequestOptions) {
  return request<T>('GET', path, undefined, options);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>('POST', path, body, options);
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>('PATCH', path, body, options);
}

export function apiDelete<T>(path: string, options?: RequestOptions) {
  return request<T>('DELETE', path, undefined, options);
}
