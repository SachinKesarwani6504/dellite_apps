# Parity Rules

## What is Parity?

Both apps (Worker + Customer) must implement foundational features identically to:
- Reduce bugs from divergence
- Enable code reuse/shared packages
- Make it easier for AI assistants to help with both apps
- Enable team members to switch between apps easily

## Fundamental Files (MUST BE IDENTICAL)

### HTTP Client

```
src/actions/http/httpClient.ts
```

Must be byte-for-byte identical:
- Request helpers: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`
- Auth header format: `Authorization: Bearer <token>`
- Error handling logic
- Toast integration
- Token refresh flow

**Worker app file:**
```typescript
export async function apiGet<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
  // Implementation
}
export async function apiPost<T>(endpoint: string, body?, options?: HttpRequestOptions): Promise<T> {
  // Implementation
}
// ... etc
```

**Customer app file:** Must be identical

### API Types

```
src/types/api.ts
src/types/http.ts
```

Must be identical in both apps:
- API request/response shapes
- HTTP error/request types
- Auth token types
- Common entity types

### Toast Utilities

```
src/utils/toast.tsx
```

Must have same function names and behavior:
- `showApiSuccessToast(message)`
- `showApiErrorToast(error)`
- `showToast(message, type?)`

### Key-Chain Storage

```
src/utils/key-chain-storage/session-token.ts
src/utils/key-chain-storage/phone-token.ts
```

Must use same keys and storage logic across both apps

### Context + Hook Patterns

Must follow identical architecture:

```
src/contexts/AuthContext.tsx
src/hooks/useAuthController.ts

src/contexts/OnboardingContext.tsx
src/hooks/useOnboardingController.ts
```

Same shape, same functions, same naming

## Checking Parity

### Command: Parity Check

```bash
npm run verify:all     # Runs both apps' typechecks and parity checks
npm run lint:repo      # Checks for repo-level issues
```

### Manual Review

Before merge, verify these files are synchronized:

1. **HTTP Client**
   ```bash
   diff apps/worker-app/src/actions/http/httpClient.ts \
        apps/customer-app/src/actions/http/httpClient.ts
   ```

2. **API Types**
   ```bash
   diff apps/worker-app/src/types/api.ts \
        apps/customer-app/src/types/api.ts
   ```

3. **Toast Utilities**
   ```bash
   diff apps/worker-app/src/utils/toast.tsx \
        apps/customer-app/src/utils/toast.tsx
   ```

4. **Storage Modules**
   ```bash
   diff apps/worker-app/src/utils/key-chain-storage/ \
        apps/customer-app/src/utils/key-chain-storage/
   ```

## Parity Workflow

### When Making a Fundamental Change

1. **Identify the file**: Is it foundational (http, auth, storage, types)?
2. **Update Worker App**: Make the change
3. **Update Customer App**: Apply identical change
4. **Test Both**: Run `npm run verify:all`
5. **Review Diffs**: Ensure files are identical
6. **Document**: Update PR description with parity notice
7. **Merge**: Only after all checks pass

### Example: Changing HTTP Client

```typescript
// Worker app: src/actions/http/httpClient.ts
export async function apiGet<T>(
  endpoint: string,
  options?: HttpRequestOptions & { usePhoneToken?: boolean }
): Promise<T> {
  // NEW: Support phone token for specific endpoints
  const token = options?.usePhoneToken 
    ? await getPhoneToken() 
    : await getAccessToken();
  
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
  
  return response.json();
}
```

Then apply **identical change** to:
```
Customer app: src/actions/http/httpClient.ts
```

### Example: Adding Auth Type

```typescript
// Worker app: src/types/auth.ts
export interface PhoneTokenPayload {
  phone: string;
  code: string;
}

export interface PhoneTokenResponse {
  token: string;
  expiresAt: string;
}
```

Then add **identical types** to:
```
Customer app: src/types/auth.ts
```

## Parity Rules (Strict)

### ✅ DO

- Apply foundational changes to both apps in the same PR/commit
- Test both apps before merging
- Document parity changes in PR description
- Use shared packages (app-core) for extraction when applicable
- Use `diff` tools to verify identical content

### ❌ DON'T

- Add a feature to one app without planning parallel implementation
- Update http client in only one app
- Change API types in only one app
- Ignore parity check failures
- Create duplicate implementations

## Phase: Extracting to Shared Core

Once foundational files stabilize, extract to `packages/app-core`:

```
packages/app-core/src/
├── utils/
│   ├── http-client.ts          # Shared HTTP logic
│   └── error-extraction.ts     # Shared error parsing
├── types/
│   ├── api.ts                  # Shared API types
│   └── http.ts                 # Shared HTTP types
└── storage/
    └── token-storage.ts        # Shared storage
```

Then both apps import from `@dellite/app-core`:

```typescript
// apps/worker-app/src/actions/http/httpClient.ts
export { apiGet, apiPost, apiPatch, apiDelete } from '@dellite/app-core/http-client';

// apps/customer-app/src/actions/http/httpClient.ts
export { apiGet, apiPost, apiPatch, apiDelete } from '@dellite/app-core/http-client';
```

See [mono-sync-plan.md](/docs/mono-sync-plan.md) for extraction phases.

## Parity Checklist

Before submitting PR:

- [ ] Change applied to both apps
- [ ] `npm run verify:all` passes
- [ ] `npm run lint:repo` passes
- [ ] `diff` tool confirms files are identical (if applicable)
- [ ] Both apps typecheck: `npm run typecheck:worker` + `npm run typecheck:customer`
- [ ] PR description mentions parity changes
- [ ] Deployment plan updated

See [AGENTS.md](/AGENTS.md#8-change-management-rules) for full parity rules.
