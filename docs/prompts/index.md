# Prompts & AI Coding Standards

## Purpose

This document provides reusable prompts and coding standards to minimize repeated prompting and improve consistency when using AI coding assistants.

## Quick Reference Prompts

### When Adding a New Screen

```markdown
Add a new screen [ScreenName] following these standards:

1. **File Location**: `apps/[app]/src/screens/[feature]/[ScreenName].tsx`
2. **Controller Hook**: Create `useScreenNameController` in hooks (state + effects)
3. **Types**: Define props/data types in `src/types/screen-names.ts` if route params
4. **Imports**: Use utilities from `src/utils/index.ts`, contexts from `src/contexts/`
5. **Purity**: Keep screen presentational only - all business logic in controller hook
6. **Components**: Import from `src/components/common/` or feature folder
7. **Styling**: Use NativeWind classes, theme constants from `src/constants/theme.ts`
8. **Toast**: Use `showApiErrorToast()` and `showApiSuccessToast()` from utils

Reference:
- AGENTS.md → Screen Purity Rules (section 14)
- /docs/architecture/screen-purity.md
- /docs/architecture/monorepo-structure.md
```

### When Adding an API Endpoint

```markdown
Add a new API endpoint following these standards:

1. **Type**: Define request/response types in `src/types/api.ts`
2. **Action**: Create function in `src/actions/[feature]Actions.ts`
3. **HTTP**: Use `apiGet()`, `apiPost()`, `apiPatch()`, `apiDelete()` from httpClient
4. **Error Handling**: Let httpClient handle errors, catch in controller with try/catch
5. **Token**: Use default accessToken (or specify usePhoneToken for onboarding only)
6. **Toast**: Wrap with `showApiErrorToast(error)` in controller hook
7. **Parity**: If foundational (http client), must be identical in both apps

Reference:
- /docs/apis/index.md (HTTP Client)
- /docs/architecture/parity-rules.md
```

### When Adding Context State

```markdown
Add a new context following the thin-context, fat-controller pattern:

1. **File 1**: Create `src/contexts/[Feature]Context.tsx`
   - Thin provider (only creates context + exposes use hook)
   - Wraps use[Feature]Controller hook
   
2. **File 2**: Create `src/hooks/use[Feature]Controller.ts`
   - Fat logic (state, effects, API calls, orchestration)
   - Returns all state + actions
   
3. **Consumption**: Screens import `use[Feature]Context()` only
   - Never import controller hooks in screens
   - Never put business logic in context files

Reference:
- /docs/architecture/context-hook-architecture.md
- /docs/state-management/index.md
```

### When Changing Types

```markdown
Update API types following these strict rules:

1. **Update types first**: Modify `src/types/api.ts`
2. **Remove dead fields**: Delete fields removed from backend
3. **Use union types**: No string fallbacks for enums
4. **Update normalizers**: Change mappers/transformers using old types
5. **Update UI**: Fix components using changed fields
6. **Parity**: Both apps must have identical type files
7. **Verify**: Run typecheck for both apps

Reference:
- /docs/architecture/type-system.md
- AGENTS.md → API Type Hygiene Rules (section 15)
```

## Coding Standards Checklist

### File Naming

- ✅ Screens: `PascalCase.tsx` (e.g., `LoginScreen.tsx`)
- ✅ Components: `PascalCase.tsx` (e.g., `Button.tsx`)
- ✅ Hooks: `useXxx.ts` or `useXxxController.ts`
- ✅ Contexts: `XxxContext.tsx`
- ✅ Actions: `xxxActions.ts`
- ✅ Utilities: `kebab-case.ts` (e.g., `error-extraction.ts`)
- ✅ Types: `xxx.ts` in `src/types/` (e.g., `api.ts`, `auth.ts`)

### Type Placement

- ✅ Types in `src/types/*` only
- ❌ Types NOT in screens, components, hooks, or contexts
- ✅ Import from `src/types/`
- ❌ Never define types in feature files

### Screen Structure

```typescript
// ✅ GOOD: Thin screen, logic in controller
export function MyScreen() {
  const { data, loading } = useMyController();
  return <View>{/* JSX only */}</View>;
}

// ❌ BAD: Logic in screen
export function MyScreen() {
  const [data, setData] = useState(null);
  useEffect(() => { /* fetch logic */ }, []);
  return <View>{/* JSX + embedded functions */}</View>;
}
```

### Context Structure

```typescript
// ✅ GOOD: Thin context
export function AuthProvider({ children }) {
  const controller = useAuthController(); // Fat logic
  return (
    <AuthContext.Provider value={controller}>
      {children}
    </AuthContext.Provider>
  );
}

// ❌ BAD: Fat context
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // API calls, effects, business logic here
  return <AuthContext.Provider>{children}</AuthContext.Provider>;
}
```

### HTTP Usage

```typescript
// ✅ GOOD: Consistent helpers
const data = await apiGet<User>('/users/123');
const created = await apiPost<User>('/users', payload);
const updated = await apiPatch<User>('/users/123', payload);
await apiDelete('/users/123');

// ❌ BAD: Direct fetch
const response = await fetch(endpoint, options);
```

### Component Purity

```typescript
// ✅ GOOD: Helper in utils
// src/utils/formatters.ts
export const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// src/screens/OrderScreen.tsx
import { formatPrice } from '../utils';
<Text>{formatPrice(price)}</Text>

// ❌ BAD: Helper in screen
export function OrderScreen() {
  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`; // ❌
  return <Text>{formatPrice(price)}</Text>;
}
```

## Template Snippets

### New Screen

```typescript
// src/screens/[feature]/[ScreenName].tsx
import { useScreenNameController } from '../../hooks';
import { COLORS, SPACING } from '../../constants/theme';

interface Props {
  // Navigation params
}

export function ScreenName(props: Props) {
  const { /* state from controller */ } = useScreenNameController();

  return (
    <View style={{ padding: SPACING.md }}>
      {/* Presentational JSX only */}
    </View>
  );
}
```

### New Controller Hook

```typescript
// src/hooks/useScreenNameController.ts
import { useState, useEffect } from 'react';
import { showApiErrorToast } from '../utils';

export function useScreenNameController() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // API call
        setData(result);
      } catch (error) {
        showApiErrorToast(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading };
}
```

### New Context

```typescript
// src/contexts/[Feature]Context.tsx
import { createContext, useContext } from 'react';
import { use[Feature]Controller } from '../hooks/use[Feature]Controller';

const [Feature]Context = createContext<ReturnType<typeof use[Feature]Controller> | undefined>(undefined);

export function [Feature]Provider({ children }) {
  const controller = use[Feature]Controller();
  return (
    <[Feature]Context.Provider value={controller}>
      {children}
    </[Feature]Context.Provider>
  );
}

export function use[Feature]Context() {
  const context = useContext([Feature]Context);
  if (!context) throw new Error('use[Feature]Context must be inside [Feature]Provider');
  return context;
}
```

### New API Action

```typescript
// src/actions/[feature]Actions.ts
import { apiGet, apiPost } from './http/httpClient';
import { ApiResponse } from '../types/api';

export const [feature]Actions = {
  getItems: async (): Promise<ApiResponse<Item[]>> => {
    return apiGet<Item[]>('/items');
  },

  createItem: async (payload: CreateItemRequest): Promise<Item> => {
    return apiPost<Item>('/items', payload);
  },
};
```

## AI-Friendly Patterns

When prompting an AI assistant, reference:

1. **File paths** from `/docs/architecture/monorepo-structure.md`
2. **Coding standards** from `/AGENTS.md` (link to section)
3. **Patterns** from relevant doc (e.g., context pattern, screen pattern)
4. **Examples** from existing code in the monorepo

Example prompt:

```markdown
Add a new BookingDetails screen (customer-app).

Follow:
- /docs/architecture/screen-purity.md for screen structure
- /docs/architecture/context-hook-architecture.md for state management
- /AGENTS.md section 14 for booking flow purity rules

Use existing BookingFlowContext for state.
```

## Documentation Updates

When adding new features, update relevant docs:

- **New screen** → Update `/docs/architecture/monorepo-structure.md`
- **New API** → Update `/docs/apis/index.md`
- **New context** → Update `/docs/state-management/index.md`
- **New flow** → Create `/docs/flows/[flow-name].md`
- **New component** → Update `/docs/ui/index.md`
- **Deployment change** → Update `/docs/deployment/index.md`

## Quick Links

- **Coding Contract**: [AGENTS.md](/AGENTS.md)
- **Architecture**: [/docs/architecture](/docs/architecture/index.md)
- **State Management**: [/docs/state-management](/docs/state-management/index.md)
- **Flows**: [/docs/flows](/docs/flows/index.md)
- **APIs**: [/docs/apis](/docs/apis/index.md)
- **UI**: [/docs/ui](/docs/ui/index.md)
- **Firebase**: [/docs/firebase](/docs/firebase/index.md)
- **Deployment**: [/docs/deployment](/docs/deployment/index.md)
