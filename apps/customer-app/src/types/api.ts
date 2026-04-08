export type ApiMeta = {
  requestId?: string;
  timestamp?: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: ApiMeta;
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
};

export type ApiRequestOptions = {
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  toast?: ApiToastOptions;
};
