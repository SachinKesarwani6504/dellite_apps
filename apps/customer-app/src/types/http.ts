import type { ApiRequestOptions } from '@/types/api';

export type RequestOptions = ApiRequestOptions & {
  auth?: boolean;
  tokenType?: 'none' | 'access' | 'phone';
  withCredentials?: boolean;
  cache?: 'default' | 'no-store';
  retryOnAuthFailure?: boolean;
};

