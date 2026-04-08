export interface ApiEnvelope<T> {
  statusCode?: number;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

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
