type ApiErrorHeaders = Record<string, unknown> | Headers | undefined;

export type ParsedApiError = {
  friendlyMessage: string;
  statusCode?: number;
  isRetryable: boolean;
  rawError?: unknown;
};

type ParseApiErrorParams = {
  error?: unknown;
  statusCode?: number;
  payload?: unknown;
  headers?: ApiErrorHeaders;
  malformedResponse?: boolean;
};

const SERVER_UNAVAILABLE_MESSAGE = 'Service is temporarily unavailable. Please try again.';
const NETWORK_UNAVAILABLE_MESSAGE = 'Unable to connect right now. Please check your internet and try again.';

const UNSAFE_MESSAGE_PATTERNS = [
  /<html/i,
  /<!doctype/i,
  /<\/html>/i,
  /<body/i,
  /request failed with status code/i,
  /\bbad gateway\b/i,
  /\bsocket hang up\b/i,
  /\bnetwork error\b/i,
  /unexpected token\s*</i,
  /\btimeout\b/i,
  /\bnginx\b/i,
  /\bcloudflare\b/i,
  /\btraceback\b/i,
  /\bat\s+\w+\s*\(/i,
];

function getFallbackByStatus(statusCode?: number): string {
  switch (statusCode) {
    case 400:
    case 422:
      return 'Please check the details and try again.';
    case 401:
      return 'Your session has expired. Please login again.';
    case 403:
      return 'You are not allowed to perform this action.';
    case 404:
      return 'We could not find what you requested.';
    case 409:
      return 'This action could not be completed right now.';
    case 429:
      return 'Too many requests. Please try again shortly.';
    case 500:
      return 'Something went wrong. Please try again.';
    case 502:
    case 503:
    case 504:
      return SERVER_UNAVAILABLE_MESSAGE;
    default:
      return 'Something went wrong. Please try again.';
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function readHeaderValue(headers: ApiErrorHeaders, headerName: string): string {
  if (!headers) return '';
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(headerName) ?? '';
  }
  if (typeof headers !== 'object') return '';
  const direct = (headers as Record<string, unknown>)[headerName];
  if (typeof direct === 'string') return direct;
  const lower = (headers as Record<string, unknown>)[headerName.toLowerCase()];
  return typeof lower === 'string' ? lower : '';
}

function isHtmlLikeContentType(headers: ApiErrorHeaders): boolean {
  const contentType = readHeaderValue(headers, 'content-type').toLowerCase();
  return contentType.includes('text/html');
}

function containsHtmlMarkup(value: string): boolean {
  const normalized = value.toLowerCase();
  return normalized.includes('<html')
    || normalized.includes('<!doctype')
    || normalized.includes('<body')
    || normalized.includes('</html>');
}

export function sanitizeApiMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const normalized = normalizeText(value);
  if (!normalized) return fallback;
  if (containsHtmlMarkup(normalized)) return fallback;
  if (UNSAFE_MESSAGE_PATTERNS.some(pattern => pattern.test(normalized))) return fallback;
  if (normalized.length > 220) return fallback;
  return normalized;
}

function getStatusFromPayload(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const raw = payload as { statusCode?: unknown; status?: unknown };
  if (typeof raw.statusCode === 'number') return raw.statusCode;
  if (typeof raw.status === 'number') return raw.status;
  return undefined;
}

function getMessageFromPayload(payload: unknown): string | undefined {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return undefined;
  const raw = payload as { message?: unknown; error?: unknown; data?: unknown };
  if (typeof raw.message === 'string') return raw.message;
  if (typeof raw.error === 'string') return raw.error;
  if (raw.data && typeof raw.data === 'object') {
    const nested = raw.data as { message?: unknown; error?: unknown };
    if (typeof nested.message === 'string') return nested.message;
    if (typeof nested.error === 'string') return nested.error;
  }
  return undefined;
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const raw = error as { code?: unknown; message?: unknown };
  const code = typeof raw.code === 'string' ? raw.code.toLowerCase() : '';
  const message = typeof raw.message === 'string' ? raw.message.toLowerCase() : '';
  return code === 'ecconnaborted'
    || code === 'enotfound'
    || code === 'econnrefused'
    || code === 'etimedout'
    || message.includes('network error')
    || message.includes('timeout')
    || message.includes('socket')
    || message.includes('failed to fetch')
    || message.includes('network request failed');
}

export function isAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('statusCode' in error)) {
    return false;
  }
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return statusCode === 401 || statusCode === 403;
}

export function isTransientApiError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode === 429 || statusCode >= 500;
    }
  }
  return isNetworkError(error);
}

export function parseApiError(params: ParseApiErrorParams): ParsedApiError {
  const statusCode = params.statusCode ?? getStatusFromPayload(params.payload);
  const statusFallback = getFallbackByStatus(statusCode);
  const isRetryable = statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504;
  const payloadMessage = getMessageFromPayload(params.payload);

  if (isHtmlLikeContentType(params.headers)) {
    return {
      friendlyMessage: SERVER_UNAVAILABLE_MESSAGE,
      statusCode,
      isRetryable: true,
      rawError: params.error ?? params.payload,
    };
  }

  if (params.malformedResponse) {
    const safeMalformedMessage = sanitizeApiMessage(payloadMessage, '');
    if (safeMalformedMessage) {
      return {
        friendlyMessage: safeMalformedMessage,
        statusCode,
        isRetryable,
        rawError: params.error ?? params.payload,
      };
    }
    return {
      friendlyMessage: SERVER_UNAVAILABLE_MESSAGE,
      statusCode,
      isRetryable: true,
      rawError: params.error ?? params.payload,
    };
  }

  if (typeof payloadMessage === 'string' && containsHtmlMarkup(payloadMessage)) {
    return {
      friendlyMessage: SERVER_UNAVAILABLE_MESSAGE,
      statusCode,
      isRetryable: true,
      rawError: params.error ?? params.payload,
    };
  }

  if (isNetworkError(params.error)) {
    return {
      friendlyMessage: NETWORK_UNAVAILABLE_MESSAGE,
      statusCode,
      isRetryable: true,
      rawError: params.error,
    };
  }

  if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return {
      friendlyMessage: SERVER_UNAVAILABLE_MESSAGE,
      statusCode,
      isRetryable: true,
      rawError: params.error ?? params.payload,
    };
  }

  const safePayloadMessage = sanitizeApiMessage(payloadMessage, statusFallback);
  return {
    friendlyMessage: safePayloadMessage,
    statusCode,
    isRetryable,
    rawError: params.error ?? params.payload,
  };
}

export function isAuthSessionInvalidStatusCode(statusCode?: number): boolean {
  return statusCode === 401 || statusCode === 403;
}
