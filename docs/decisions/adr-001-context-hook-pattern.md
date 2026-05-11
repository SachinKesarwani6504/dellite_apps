# ADR 001: Context + Hook Architecture Pattern

**Status**: Accepted

**Date**: 2024-01-15

## Context

We needed a state management pattern that:
- Keeps state accessible across multiple screens
- Separates business logic from UI components
- Makes testing easier
- Works well with React context API
- Scales without becoming bloated

## Decision

Use a **thin Context + fat Controller Hook** pattern:

1. **Context files** (`XxxContext.tsx`): Create and provide context, expose hook
2. **Controller hooks** (`useXxxController.ts`): Contain all logic (state, effects, API calls)
3. **Screens/Components**: Import context hooks only, never controller hooks

## Rationale

### Separation of Concerns
- Context = state provision
- Hooks = business logic
- Screens = presentation only

### Testability
- Test hook in isolation without React tree
- Test context provider with hook
- Test screen with mocked context

### Scalability
- Context stays thin and readable
- Business logic organized in hooks
- Easy to refactor logic without touching context

### Parity
- Same pattern required in both apps
- Easy to compare implementations
- Reduces bugs from divergence

## Alternatives Considered

### Redux/MobX
- **Pros**: Centralized state, powerful DevTools
- **Cons**: Overkill for current app, adds boilerplate, harder to learn

### Single Context with All State
- **Pros**: Simpler file structure
- **Cons**: Large context files, hard to test, logic scattered

### Prop Drilling
- **Pros**: No extra abstraction
- **Cons**: Components become deeply nested, hard to maintain

## Consequences

### Positive
- Clean separation: context files are thin and readable
- Logic is testable in isolation
- Easy to find where logic lives (hooks)
- Consistent pattern across both apps
- Easier to scale to many contexts

### Negative
- More files to maintain (context + hook pairs)
- Team must understand the pattern
- Requires discipline (not putting logic in context)

## Implementation Examples

### ✅ Correct Pattern

```typescript
// src/contexts/AuthContext.tsx (thin)
export function AuthProvider({ children }) {
  const controller = useAuthController(); // Use hook
  return (
    <AuthContext.Provider value={controller}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
```

```typescript
// src/hooks/useAuthController.ts (fat)
export function useAuthController() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Initialization logic
  }, []);
  
  const login = async (phone, password) => {
    // API call + state update
  };
  
  return { user, login, /* ... */ };
}
```

```typescript
// src/screens/LoginScreen.tsx (presentational)
export function LoginScreen() {
  const { login } = useAuthContext(); // Use context hook only
  return <Button onPress={() => login(phone, password)} />;
}
```

### ❌ Incorrect Pattern

```typescript
// ❌ Fat context (business logic in context file)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const login = async (phone, password) => {
    // Should be in controller hook
    const user = await apiPost('/auth/login', ...);
    setUser(user);
  };
  
  return <AuthContext.Provider value={{ user, login }}>{children}</AuthContext.Provider>;
}
```

```typescript
// ❌ Screen using controller directly
import { useAuthController } from '../hooks'; // Don't do this

export function LoginScreen() {
  const { login } = useAuthController(); // Should use useAuthContext instead
  return <Button onPress={login} />;
}
```

## Related ADRs

- [ADR 002: Monorepo Structure](adr-002-monorepo-structure.md) - Both apps use same pattern
- [ADR 003: Strict Type Placement](adr-003-strict-type-placement.md) - Types for context values

## References

- [Context + Hook Architecture Doc](/docs/architecture/context-hook-architecture.md)
- [State Management Doc](/docs/state-management/index.md)
- [AGENTS.md Section 13](/AGENTS.md#13-context--hook-architecture)
