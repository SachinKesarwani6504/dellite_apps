export type RequestOptions = {
  auth?: boolean;
  tokenType?: 'none' | 'access' | 'phone';
  headers?: Record<string, string>;
  withCredentials?: boolean;
  cache?: 'default' | 'no-store';
  retryOnAuthFailure?: boolean;
  toast?: {
    showSuccess?: boolean;
    showError?: boolean;
    [key: string]: unknown;
  };
};

