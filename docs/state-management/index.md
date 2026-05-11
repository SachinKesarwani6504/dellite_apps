# State Management

## Overview

Dellite uses React Context + Custom Hooks for state management.

- **Context API** for providing state to multiple screens
- **Custom hooks** (`useXxxController`) for business logic, effects, API calls
- **Redux** (optional) for complex global state if needed

## Architecture Pattern

```
Context (thin provider)
    ↓ wraps
useXxxController (fat logic)
    ↓ provides state
Screen components (presentational)
```

See [/docs/architecture/context-hook-architecture.md](/docs/architecture/context-hook-architecture.md) for detailed pattern.

## Key Contexts

### AuthContext + useAuthController

**Purpose**: Manage authentication state and flows

**State**:
- `user: User | null`
- `isLoading: boolean`
- `isAuthenticated: boolean`
- `tokens: AuthTokens | null`

**Actions**:
- `login(phone, password): Promise<void>`
- `logout(): Promise<void>`
- `refreshToken(): Promise<void>`
- `clearError(): void`

**Location**:
- Context: `src/contexts/AuthContext.tsx`
- Controller: `src/hooks/useAuthController.ts`

### OnboardingContext + useOnboardingController

**Purpose**: Manage user onboarding flow and data collection

**State**:
- `step: OnboardingStep`
- `formData: OnboardingData`
- `isLoading: boolean`
- `errors: Record<string, string>`

**Actions**:
- `nextStep(): void`
- `prevStep(): void`
- `updateField(field, value): void`
- `submitStep(): Promise<void>`
- `reset(): void`

**Location**:
- Context: `src/contexts/OnboardingContext.tsx`
- Controller: `src/hooks/useOnboardingController.ts`

### Customer-Specific: BookingFlowContext + useBookingFlowController

**Purpose**: Manage booking flow (customer app only)

**State**:
- `bookingType: BookingType`
- `selectedService: Service | null`
- `selectedWorker: Worker | null`
- `selectedSlot: TimeSlot | null`
- `bookingData: BookingData`
- `currentStep: BookingStep`

**Actions**:
- `selectService(service): void`
- `selectWorker(worker): void`
- `selectSlot(slot): void`
- `updateBookingData(field, value): void`
- `submitBooking(): Promise<void>`
- `reset(): void`

**Location**:
- Context: `src/contexts/BookingFlowContext.tsx`
- Controller: `src/hooks/useBookingFlowController.ts`

## Usage Pattern

### 1. Wrap App with Provider

```typescript
// src/App.tsx
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { BookingFlowProvider } from './contexts/BookingFlowContext';

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <BookingFlowProvider>
          <Navigation />
        </BookingFlowProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}
```

### 2. Use Context in Screens

```typescript
// src/screens/auth/LoginScreen.tsx
import { useAuthContext } from '../contexts/AuthContext';

export function LoginScreen() {
  const { login, isLoading } = useAuthContext();
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

## State Structure Rules

### Context Value Shape

```typescript
interface AuthContextValue {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  error: string | null;
  
  // Actions
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
```

### Controller Hook Return

```typescript
export function useAuthController(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  // ... other state
  
  // Attach all logic here
  const login = async (phone: string, password: string) => {
    // Implementation
  };
  
  // Return full context value
  return {
    user,
    isLoading,
    isAuthenticated,
    tokens,
    error,
    login,
    logout,
    refreshToken,
    clearError,
  };
}
```

## Effects Management

### Initialization Effects

```typescript
// src/hooks/useAuthController.ts
useEffect(() => {
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (token) {
        // Verify token is valid
        const user = await authActions.getCurrentUser();
        setUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  initializeAuth();
}, []); // Run once on mount
```

### Side Effects (Token Refresh)

```typescript
useEffect(() => {
  // Setup auto-refresh timer
  const interval = setInterval(async () => {
    if (isAuthenticated && tokens) {
      try {
        await refreshToken();
      } catch (error) {
        logout(); // Clear on refresh failure
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(interval);
}, [isAuthenticated, tokens]);
```

## Error Handling

```typescript
export function useAuthController() {
  const [error, setError] = useState<string | null>(null);

  const login = async (phone: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authActions.login({ phone, password });
      
      setUser(response.user);
      await saveTokens(response.tokens);
      
      showApiSuccessToast('Login successful');
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      showApiErrorToast(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { /* ... */, error, clearError };
}
```

## Testing

```typescript
// Test hook in isolation
import { renderHook, act } from '@testing-library/react-native';
import { useAuthController } from '../hooks/useAuthController';

test('login sets user and tokens', async () => {
  const { result } = renderHook(() => useAuthController());
  
  await act(async () => {
    await result.current.login('555-1234', 'password');
  });
  
  expect(result.current.user).toBeDefined();
  expect(result.current.tokens).toBeDefined();
});

// Test context in component tree
import { render, screen } from '@testing-library/react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';

test('login screen uses auth context', () => {
  render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );
  
  expect(screen.getByPlaceholderText('Phone')).toBeTruthy();
});
```

## Performance Tips

### Memoization

```typescript
const contextValue = useMemo(
  () => ({
    user,
    isLoading,
    login,
    logout,
    // ... other values
  }),
  [user, isLoading, login, logout] // Dependencies
);

return (
  <AuthContext.Provider value={contextValue}>
    {children}
  </AuthContext.Provider>
);
```

### Splitting Contexts

If context has multiple unrelated state slices, split into multiple contexts:

```typescript
// ❌ Monolithic
<AuthProvider>        // Large context with many subscribers
  <UIProvider>
    <AppProvider>     // Causes re-renders of unrelated consumers
    </AppProvider>
  </UIProvider>
</AuthProvider>

// ✅ Modular
<AuthProvider>        // Only auth subscribers re-render on auth changes
  <UIProvider>        // Only UI subscribers re-render on UI changes
    <AppProvider>     // Only app subscribers re-render on app changes
    </AppProvider>
  </UIProvider>
</AuthProvider>
```

See [AGENTS.md](/AGENTS.md#13-context--hook-architecture) for full context + hook rules.
