# ADR 004: HTTP Client Standardization

**Status**: Accepted

**Date**: 2024-01-14

## Context

Both apps (Worker and Customer) need to make HTTP requests to the backend. Without standardization:
- Different error handling in each app
- Inconsistent token management
- Duplicate code
- Bugs from divergence

## Decision

Create a **standardized HTTP client** with consistent helpers that must be identical in both apps:

- `apiGet<T>(endpoint, options): Promise<T>`
- `apiPost<T>(endpoint, body, options): Promise<T>`
- `apiPatch<T>(endpoint, body, options): Promise<T>`
- `apiDelete<T>(endpoint, options): Promise<T>`

**Location**: `src/actions/http/httpClient.ts` (IDENTICAL in both apps)

## Rationale

### Consistency
- Same API interface across apps
- Team knows what to expect
- Easier to debug issues

### Token Management
- Centralized token refresh logic
- Consistent auth header format: `Authorization: Bearer <token>`
- Clear token usage rules (phoneToken vs accessToken)

### Error Handling
- Centralized error extraction
- Consistent retry logic
- Toast integration in controller, not HTTP client

### Testability
- Easy to mock in tests
- Clear contract for endpoints
- Type-safe requests/responses

## Alternatives Considered

### Using Fetch Directly
- **Pros**: Simpler
- **Cons**: No error handling, token management scattered, inconsistent

### Axios/Libraries
- **Pros**: Feature-rich
- **Cons**: Heavy dependency, overkill for current needs

### Different Client per App
- **Pros**: Specific to each app's needs
- **Cons**: Maintenance nightmare, divergence bugs

## Consequences

### Positive
- Consistent API calls across apps
- Easy token refresh logic
- Parity on foundational code
- Easier to test
- Type-safe requests/responses

### Negative
- Parity requirement (must keep identical)
- Requires discipline when changing
- CI must verify identical files

## Implementation

### Request Helpers

```typescript
// src/actions/http/httpClient.ts
export async function apiGet<T>(
  endpoint: string,
  options?: HttpRequestOptions
): Promise<T> {
  const headers = await getAuthHeaders(options?.usePhoneToken);
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
  const headers = await getAuthHeaders(options?.usePhoneToken);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...headers, ...options?.headers },
    body: body ? JSON.stringify(body) : undefined,
    timeout: options?.timeout || 30000,
  });
  
  return handleResponse<T>(response);
}

// apiPatch and apiDelete similar
```

### Token Management

```typescript
// Worker app specific rules
async function getAuthHeaders(usePhoneToken?: boolean): Promise<Headers> {
  let token: string | null = null;
  
  if (usePhoneToken) {
    token = await getPhoneToken();  // Only for onboarding
  } else {
    token = await getAccessToken(); // Default for all APIs
  }
  
  if (!token) throw new Error('No authentication token');
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Token refresh
async function handleAuthError(response: Response): Promise<boolean> {
  if (response.status === 401) {
    try {
      const refreshed = await refreshAccessToken();
      return refreshed;
    } catch (error) {
      clearAllTokens();
      navigateToLogin();
      return false;
    }
  }
  return false;
}
```

### Error Handling

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      const refreshed = await handleAuthError(response);
      if (!refreshed) throw new Error('Authentication failed');
    }
    
    const errorData = await response.json();
    const error = new Error(errorData.message);
    (error as any).code = errorData.code;
    (error as any).statusCode = response.status;
    throw error;
  }
  
  return response.json();
}
```

## Token Rules

### Worker App

| Token | Use | Storage | Refresh |
|-------|-----|---------|---------|
| `phoneToken` | Onboarding endpoints only | Temporary | No |
| `accessToken` | All authenticated APIs (default) | Secure | Yes, on 401 |
| `refreshToken` | Refresh endpoint payload (never header) | Secure | No |

### Customer App

Same rules as Worker (PARITY)

## Usage in Actions

```typescript
// src/actions/authActions.ts
export const authActions = {
  // Use phoneToken for onboarding
  verifyPhone: async (code: string): Promise<User> => {
    return apiPost<User>('/auth/verify-phone', { code }, {
      usePhoneToken: true,
    });
  },
  
  // Use default accessToken
  login: async (phone: string, password: string): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/auth/login', { phone, password });
  },
  
  // GET request
  getProfile: async (): Promise<User> => {
    return apiGet<User>('/profile');
  },
};
```

## Error Handling in Controllers

```typescript
// src/hooks/useAuthController.ts
try {
  const response = await authActions.login(phone, password);
  setUser(response.user);
  await saveTokens(response.tokens);
} catch (error) {
  const message = extractErrorMessage(error);
  setError(message);
  showApiErrorToast(message);
  throw error;
}
```

## Parity Enforcement

Both apps must have identical:
- All helper functions: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`
- Error handling logic
- Token refresh flow
- Auth header format
- HTTP timeout defaults

CI checks file hash to ensure parity.

## Related ADRs

- [ADR 002: Monorepo Structure](adr-002-monorepo-structure.md) - HTTP client must be identical
- [ADR 003: Strict Type Placement](adr-003-strict-type-placement.md) - HTTP types in src/types/http.ts

## References

- [HTTP Client Doc](/docs/apis/index.md)
- [Parity Rules](/docs/architecture/parity-rules.md)
- [AGENTS.md Section 3](/AGENTS.md#3-http-client-rules)
