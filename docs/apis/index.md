# HTTP Client

## Overview

The HTTP client is the single entry point for all API calls.

**Location**: `src/actions/http/httpClient.ts`

**Must be identical** in both `apps/worker-app` and `apps/customer-app`.

## Standard Request Helpers

```typescript
import { apiGet, apiPost, apiPatch, apiDelete } from '../actions/http/httpClient';

// GET request
const users = await apiGet<User[]>('/users');

// POST request
const created = await apiPost<User>('/users', {
  name: 'John',
  email: 'john@example.com',
});

// PATCH request
const updated = await apiPatch<User>('/users/123', {
  name: 'Jane',
});

// DELETE request
await apiDelete('/users/123');
```

## Auth Headers

All requests include auth header automatically:

```
Authorization: Bearer <token>
```

Requests use `accessToken` by default for authenticated APIs.

## Token Management

### Token Rules (Worker App Specific)

- **`phoneToken`**: Only for profile creation endpoints (onboarding)
- **`accessToken`**: For all authenticated APIs (default)
- **`refreshToken`**: Only in refresh endpoint payload, never as header

### Token Refresh Flow

When `accessToken` expires:

1. HTTP client detects 401 response
2. Calls `refreshToken` endpoint with refresh token
3. If successful: Saves new tokens, retries original request once
4. If fails: Clears all tokens, forces re-auth flow

```typescript
// Inside httpClient.ts
async function handleAuthError(response: Response) {
  if (response.status === 401) {
    // Try to refresh
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      // Retry original request
      return fetch(originalRequest);
    } else {
      // Clear tokens and redirect to login
      clearAllTokens();
      navigateToLogin();
    }
  }
}
```

## Error Handling

### Standard Error Extraction

```typescript
// Error response from backend
{
  "code": "INVALID_PHONE",
  "message": "Phone number is invalid",
  "details": { "field": "phone" }
}
```

Extract using:

```typescript
const { extractErrorMessage, extractErrorCode } = require('../utils/error-extraction');

try {
  await apiPost('/auth/login', { phone, password });
} catch (error) {
  const message = extractErrorMessage(error);
  const code = extractErrorCode(error);
  
  showApiErrorToast(message);
}
```

## Toast Integration

Wrap requests with automatic toast on error:

```typescript
try {
  await apiPost('/profile', profileData);
  showApiSuccessToast('Profile updated');
} catch (error) {
  showApiErrorToast(error);
  // Toast shows automatically
}
```

## Parity Contract

Both apps must have identical:

```typescript
export async function apiGet<T>(
  endpoint: string,
  options?: HttpRequestOptions
): Promise<T>

export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: HttpRequestOptions
): Promise<T>

export async function apiPatch<T>(
  endpoint: string,
  body?: any,
  options?: HttpRequestOptions
): Promise<T>

export async function apiDelete<T>(
  endpoint: string,
  options?: HttpRequestOptions
): Promise<T>
```

## Example Implementation

```typescript
// src/actions/http/httpClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken, getPhoneToken, refreshAccessToken } from '../../utils/key-chain-storage';
import { HttpRequestOptions, HttpErrorResponse } from '../../types/http';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.dellite.com';

async function getAuthHeader(usePhoneToken?: boolean): Promise<Record<string, string>> {
  let token: string | null = null;
  
  if (usePhoneToken) {
    token = await getPhoneToken();
  } else {
    token = await getAccessToken();
  }
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, try refresh
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw new Error('Authentication failed');
      }
    }
    
    const errorData: HttpErrorResponse = await response.json();
    const error = new Error(errorData.message);
    (error as any).code = errorData.code;
    (error as any).statusCode = response.status;
    throw error;
  }
  
  return response.json();
}

export async function apiGet<T>(
  endpoint: string,
  options?: HttpRequestOptions
): Promise<T> {
  const headers = await getAuthHeader(options?.usePhoneToken);
  
  const url = new URL(endpoint, BASE_URL);
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { ...headers, ...options?.headers },
    timeout: options?.timeout || 30000,
  });
  
  return handleResponse<T>(response);
}

export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: HttpRequestOptions
): Promise<T> {
  const headers = await getAuthHeader(options?.usePhoneToken);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...headers, ...options?.headers },
    body: body ? JSON.stringify(body) : undefined,
    timeout: options?.timeout || 30000,
  });
  
  return handleResponse<T>(response);
}

export async function apiPatch<T>(
  endpoint: string,
  body?: any,
  options?: HttpRequestOptions
): Promise<T> {
  const headers = await getAuthHeader(options?.usePhoneToken);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: { ...headers, ...options?.headers },
    body: body ? JSON.stringify(body) : undefined,
    timeout: options?.timeout || 30000,
  });
  
  return handleResponse<T>(response);
}

export async function apiDelete<T>(
  endpoint: string,
  options?: HttpRequestOptions
): Promise<T> {
  const headers = await getAuthHeader(options?.usePhoneToken);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: { ...headers, ...options?.headers },
    timeout: options?.timeout || 30000,
  });
  
  return handleResponse<T>(response);
}
```

See [parity-rules.md](parity-rules.md) to ensure this file stays identical in both apps.
