# Context + Hook Architecture

## Overview

Dellite uses a thin-context, fat-controller pattern:

- **Context files** (`XxxContext.tsx`): Thin providers that expose state + context hook
- **Controller hooks** (`useXxxController.ts`): Fat logic (state, effects, API calls, flow decisions)
- **Consumers** (screens/components): Import context hooks only, never controller hooks

## Pattern

### 1. Context File (Thin)

```typescript
// src/contexts/AuthContext.tsx
import { useAuthController } from '../hooks/useAuthController';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // ... state from controller
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }) {
  const controller = useAuthController();
  
  return (
    <AuthContext.Provider value={controller}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be inside AuthProvider');
  return context;
}
```

### 2. Controller Hook (Fat)

```typescript
// src/hooks/useAuthController.ts
export function useAuthController() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<Tokens | null>(null);

  // Effects for initialization, side effects, etc.
  useEffect(() => {
    initializeAuth();
  }, []);

  // API calls
  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authActions.login({ phone, password });
      setUser(response.user);
      setTokens(response.tokens);
      await saveTokens(response.tokens);
    } catch (error) {
      showApiErrorToast(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authActions.logout();
      setUser(null);
      setTokens(null);
      await clearTokens();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  return {
    user,
    isLoading,
    tokens,
    login,
    logout,
    // ... all state + logic
  };
}
```

### 3. Screen (Presentational)

```typescript
// src/screens/auth/LoginScreen.tsx
export function LoginScreen() {
  const { login, isLoading } = useAuthContext(); // Context hook only
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    await login(phone, password);
  };

  return (
    <View>
      <TextInput value={phone} onChangeText={setPhone} />
      <TextInput value={password} onChangeText={setPassword} />
      <Button onPress={handleLogin} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </Button>
    </View>
  );
}
```

## Rules (Strict)

### ✅ DO

- Use context for providing state to multiple screens
- Use controller hooks for orchestration, effects, API calls
- Screens import context hooks: `useAuthContext`, `useOnboardingContext`
- Keep context providers thin; delegate logic to controller
- Return controller state directly from context provider

### ❌ DON'T

- Put state machine logic in context files
- Put API orchestration in context files
- Put effects/side effects in context files
- Screens import controller hooks directly
- Create wrapper hook aliases like `useAuth.ts` → delete immediately if unused

## Examples

### AuthContext + useAuthController

**Context Provider** (`AuthContext.tsx`):
- Exposes `useAuthContext` hook
- Wraps `useAuthController`
- Provides state + login/logout functions

**Controller** (`useAuthController.ts`):
- Manages auth state (user, tokens, loading)
- Handles login/logout flows
- Token refresh, error handling
- Calls `authActions.*`

**Screen** (`LoginScreen.tsx`):
- Imports `useAuthContext` only
- Never imports `useAuthController`
- Calls `login()` on button press

### OnboardingContext + useOnboardingController

**Context Provider** (`OnboardingContext.tsx`):
- Exposes `useOnboardingContext` hook
- Wraps `useOnboardingController`
- Provides step, user data, actions

**Controller** (`useOnboardingController.ts`):
- Manages onboarding state (step, formData, errors)
- Handles step transitions, validation
- Calls `customerActions.createProfile`, etc.
- Manages side effects (analytics, cleanup)

**Screen** (`OnboardingStepScreen.tsx`):
- Imports `useOnboardingContext` only
- Calls `nextStep()`, `updateField()`, etc.
- Presentational logic only

## Testing

```typescript
// useAuthController.test.ts - Test logic directly
const { result } = renderHook(() => useAuthController());
await act(() => result.current.login('555-1234', 'password'));
expect(result.current.user).toBeDefined();

// AuthContext.test.tsx - Test provider + hook
<AuthProvider>
  <TestComponent />
</AuthProvider>
render(<TestComponent />);
const { user } = renderHook(() => useAuthContext());
```

## Parity Rules

Both apps must use identical context + controller patterns for:

- `AuthContext.tsx` + `useAuthController.ts`
- `OnboardingContext.tsx` + `useOnboardingController.ts`
- Equivalent feature contexts

See [AGENTS.md](/AGENTS.md#13-context--hook-architecture) for full rules.
