# ADR 003: Strict Type Placement

**Status**: Accepted

**Date**: 2024-01-12

## Context

Type definitions were scattered across the codebase:
- Some in screens/components
- Some in hooks
- Some in context files
- Some in utils

This caused:
- Circular import errors
- Difficulty finding types
- Duplicate type definitions
- Inconsistent naming

## Decision

All type definitions must live in `src/types/*` only.

Types are **never** declared in:
- `src/screens/*`
- `src/components/*`
- `src/hooks/*`
- `src/contexts/*`
- `src/navigation/*`
- `src/actions/*`

## Rationale

### Single Source of Truth
- One place to find all types
- Easy to update backend contract changes
- No duplicate definitions

### Prevent Circular Imports
- Types import nothing (only other types)
- Features import types, but not vice versa
- No circular dependency issues

### Backend Contract Alignment
- Types file represents current backend exactly
- Easy to audit for unused fields
- Easy to remove dead code

### Developer Experience
- Always know where to find types
- Easier to onboard new developers
- Better tooling support (IDE can find types easily)

## Alternatives Considered

### Colocate Types with Features
- **Pros**: Types close to usage
- **Cons**: Hard to find types, circular imports, scattered definitions

### Single types.ts File
- **Pros**: Centralized
- **Cons**: One huge file, hard to find things

### Types in Separate Package
- **Pros**: Very clean separation
- **Cons**: Overkill for current scale

## Consequences

### Positive
- No circular import errors
- Easy to find and update types
- Clear separation of concerns
- Easier to enforce API contracts

### Negative
- Need to create new files when adding types
- Requires discipline from team
- May feel like boilerplate initially

## Type File Organization

```
src/types/
├── index.ts                 # Re-exports all types
├── api.ts                   # API request/response types
├── http.ts                  # HTTP client types
├── auth.ts                  # Auth types
├── screen-names.ts          # Route names
├── booking.ts               # Booking types (customer)
├── [feature].ts             # Feature-specific types
└── models.ts                # Data models
```

## ✅ Correct Pattern

```typescript
// src/types/auth.ts
export interface User {
  id: string;
  phone: string;
  name: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}
```

```typescript
// src/actions/authActions.ts
import { User, LoginRequest } from '../types/auth';

export const authActions = {
  login: async (req: LoginRequest): Promise<User> => {
    // Implementation
  },
};
```

```typescript
// src/hooks/useAuthController.ts
import { User } from '../types/auth';

export function useAuthController() {
  const [user, setUser] = useState<User | null>(null);
  // Implementation
}
```

```typescript
// src/screens/LoginScreen.tsx
import { useAuthContext } from '../contexts/AuthContext';

export function LoginScreen() {
  // Use context, which uses controller, which imports types
  const { login } = useAuthContext();
  // Implementation
}
```

## ❌ Incorrect Pattern

```typescript
// ❌ Types in screen
export function LoginScreen() {
  interface User {
    id: string;
    name: string;
  }
  
  const [user, setUser] = useState<User | null>(null);
  return <View>{/* JSX */}</View>;
}
```

```typescript
// ❌ Types in hook
export function useAuthController() {
  interface AuthState {
    user: User | null;
    loading: boolean;
  }
  
  const [state, setState] = useState<AuthState>({});
}
```

```typescript
// ❌ Types in context
export const AuthContext = createContext<{
  interface User {
    id: string;
  }
}>(undefined);
```

## Backend Contract Hygiene

When backend changes:

1. **Update type first**: `src/types/api.ts`
2. **Remove dead fields**: Delete fields removed from backend
3. **Update normalizers**: Fix mappers
4. **Update UI**: Fix components
5. **Verify**: Run typecheck

## Import Strategy

```typescript
// src/types/index.ts - Re-export everything
export * from './api';
export * from './http';
export * from './auth';
export * from './screen-names';
```

```typescript
// Then import from one place
import { User, LoginRequest, ApiError } from '../types';
```

## Related ADRs

- [ADR 001: Context + Hook Pattern](adr-001-context-hook-pattern.md) - Types in separate file
- [ADR 004: HTTP Client](adr-004-http-client.md) - HTTP types in src/types/

## References

- [Type System Doc](/docs/architecture/type-system.md)
- [AGENTS.md Section 16](/AGENTS.md#16-strict-type-placement--screen-logic-rules)
- [API Type Hygiene](/AGENTS.md#15-api-type-hygiene-rules-strict)
