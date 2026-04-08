export type ApiMeta = {
  requestId?: string;
  timestamp?: string;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: ApiMeta;
  [key: string]: unknown;
};

export type ApiErrorPayload = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export type ApiToastOptions = {
  enabled?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
  errorMessage?: string;
  successMessage?: string;
  [key: string]: unknown;
};

export type ApiRequestOptions = {
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  toast?: ApiToastOptions;
};

export class ApiError extends Error {
  statusCode: number;
  payload?: unknown;

  constructor(message: string, statusCode: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
