# Codex Agent Guide: React Native (Android + iOS) Boilerplate

This file is a ready-to-use guide and starter boilerplate for building a cross-platform mobile app with React Native using a clean `src/` architecture, hybrid state management, secure token storage, and production-ready patterns.

## 1) Project Architecture (All App Code in `src/`)

```text
src/
  actions/                # centralized API calls and HTTP helpers
    http/
      httpClient.ts       # apiGet/apiPost/apiPatch/apiDelete
    authActions.ts
    workerActions.ts
  assets/                 # images, icons, fonts
    lottie/               # lottie json files
  icons/                  # central icon registry and shared icon component
    index.tsx
  components/             # reusable UI components
    common/
      AppButton.tsx
      AppSpinner.tsx
      AppInput.tsx
      AppList.tsx
  contexts/               # feature-level shared state (Context API)
    AuthFlowContext.tsx
  hooks/                  # custom hooks and reusable logic
    useAuth.ts
    useAsync.ts
  navigation/             # React Navigation config
    AppNavigator.tsx
    types.ts
  screens/                # app screens
    auth/
      LoginScreen.tsx
      SignupScreen.tsx
    home/
      HomeScreen.tsx
  services/               # APIs, token handling, business logic
    apiClient.ts
    authService.ts
    keychainService.ts
  store/                  # top-level global state (Redux)
    index.ts
    hooks.ts
    slices/
      authSlice.ts
  types/                  # TypeScript types/interfaces/models
    index.ts              # re-export all types from one place
    api.ts
    auth.ts
    navigation.ts
    global.d.ts           # css and other ambient declarations
  utils/                  # pure helper functions
    validators.ts
    platform.ts
    options.ts            # shared static option lists (dropdown/radio/chips)
App.tsx                   # app providers + navigator
```

## 2) Why This Structure (Industry Best Practice)

- `components/`: Shared, reusable UI primitives reduce duplication.
- `screens/`: Keeps screen concerns isolated and testable.
- `services/`: Centralizes API and side effects (network, secure storage).
- `contexts/`: Best for feature-level shared state that does not need global store overhead.
- `store/`: Redux is reserved for app-wide, high-impact state like auth/session.
- `hooks/`: Encapsulates reusable behavior and keeps components lean.
- `types/`: Type-safe contracts prevent runtime bugs and keep every interface, enum, and shared shape in one controlled area.
- `navigation/`: Single source of truth for route setup and types.
- `utils/`: Pure functions improve portability and testability.

## 3) State Management Strategy (No Conflicts)

Use this split consistently:

- `useState` / `useReducer`: local component state (form fields, loading UI, toggles).
- `Context API`: feature/module shared state (multi-step signup flow, temporary wizard data).
- `Redux`: top-level global state only (auth token presence, user session, app boot status).

Rule: Redux owns canonical auth/session. Context owns feature UI flow state. Components own local screen state.

## 3.1) Navigation Safety Rule (Required)

- Never call `navigation.goBack()` without guarding it via `navigation.canGoBack()`.
- If a screen can be an initial route, the back handler must handle root state safely (no-op or explicit fallback route).
- For onboarding flows, always derive route decisions from latest server flags and refresh state after mutating onboarding data (for example, service selection).

## 3.2) Scrollbar Rule (Required)

- Hide scroll indicators by default for production UI polish.
- Use `showsVerticalScrollIndicator={false}` and `showsHorizontalScrollIndicator={false}` unless a screen has an explicit product requirement to show them.

## 3.3) In-Flight Form Lock Rule (Required)

- When a screen triggers any API call from a form submit action, the submit button must show a loading spinner.
- During that same in-flight state, all editable controls on that screen must be disabled:
  - text inputs (`TextInput`, `AppInput`)
  - selection controls (`Pressable`, chips, toggles, dropdown triggers)
  - upload triggers (file/image pickers)
- Re-enable controls only after the API call resolves (success or failure).
- This rule prevents mid-request value mutations and keeps payload and UI state consistent.

## 3.4) Required Asterisk Rule (Required)

- Any mandatory field indicator (`*`) must always be shown in red.
- For shared inputs, use tokenized negative color (`theme.colors.negative`) for the asterisk.
- For custom labels (section titles, upload labels, chips), render `*` as a separate text element and color it red.

## 3.5) Separate Loading State Rule (Required)

- Keep separate loading flags for separate API intents on the same screen.
- Never reuse one loading flag for unrelated calls (for example category fetch, save submit, skip patch).
- Typical naming:
  - fetch: `isFetching...`
  - submit: `isSubmitting...`
  - skip/mutation: `isSkipping...`
- Buttons and sections must react only to their own loading flag. Do not show a submit spinner while only a background fetch is in-flight.
- If the form must be locked, derive it explicitly (for example `const formLocked = isSubmitting || isSkipping`), not from fetch-only flags.

## 3.6) Common Spinner Rule (Required)

- Use one shared spinner component across the app: `src/components/common/AppSpinner.tsx`.
- Do not use raw `ActivityIndicator` directly in screens/feature components.
- Keep spinner color tokenized through theme values (for example `theme.colors.primary`).
- Size should be context-based (`small` for inline chips/buttons, `large` for full-screen loading states).

## 4) Required Packages

Install core packages (adjust versions with your React Native setup):

```bash
npm install @reduxjs/toolkit react-redux axios react-native-keychain
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
npm install react-native-permissions react-native-image-picker
```

If using Expo managed workflow, use `npx expo install` for Expo-compatible versions. For `react-native-keychain`, use a development build (not Expo Go) when required by native module constraints.

## 5) Boilerplate Code

### `src/types/auth.ts`

```ts
export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
```

### `src/services/keychainService.ts`

```ts
import * as Keychain from 'react-native-keychain';
import { AuthTokens } from '../types/auth';

const SERVICE_NAME = 'com.yourapp.auth';

/**
 * Stores auth tokens securely in iOS Keychain / Android Keystore.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Keychain.setGenericPassword('auth', JSON.stringify(tokens), {
    service: SERVICE_NAME,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Reads auth tokens from secure storage.
 */
export async function getTokens(): Promise<AuthTokens | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
  if (!credentials) return null;
  return JSON.parse(credentials.password) as AuthTokens;
}

/**
 * Deletes tokens during logout or session reset.
 */
export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE_NAME });
}
```

### `src/services/apiClient.ts`

```ts
import axios from 'axios';
import { getTokens, clearTokens } from './keychainService';

export const apiClient = axios.create({
  baseURL: 'https://api.yourapp.com',
  timeout: 15000,
});

/**
 * Adds bearer token to every request if available.
 */
apiClient.interceptors.request.use(async config => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

/**
 * Handles unauthorized responses globally.
 */
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error?.response?.status === 401) {
      await clearTokens();
    }
    return Promise.reject(error);
  },
);
```

### `src/services/authService.ts`

```ts
import { apiClient } from './apiClient';
import { AuthResponse } from '../types/auth';

/**
 * Login API call with typed response.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

/**
 * Signup API call with typed response.
 */
export async function signup(fullName: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/signup', {
    fullName,
    email,
    password,
  });
  return data;
}
```

### `src/store/slices/authSlice.ts`

```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AuthResponse, User } from '../../types/auth';
import * as authService from '../../services/authService';
import { clearTokens, saveTokens } from '../../services/keychainService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk<AuthResponse, { email: string; password: string }>(
  'auth/login',
  async ({ email, password }) => {
    const response = await authService.login(email, password);
    await saveTokens(response.tokens);
    return response;
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await clearTokens();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(logoutThunk.fulfilled, state => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;
```

### `src/store/index.ts`

```ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### `src/store/hooks.ts`

```ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### `src/contexts/AuthFlowContext.tsx`

```tsx
import React, { createContext, useContext, useMemo, useState } from 'react';

interface AuthFlowState {
  signupStep: number;
  setSignupStep: (step: number) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
}

const AuthFlowContext = createContext<AuthFlowState | undefined>(undefined);

/**
 * Context for feature-level auth flow UI state.
 * This avoids polluting Redux with short-lived form/wizard state.
 */
export function AuthFlowProvider({ children }: { children: React.ReactNode }) {
  const [signupStep, setSignupStep] = useState(1);
  const [referralCode, setReferralCode] = useState('');

  const value = useMemo(
    () => ({ signupStep, setSignupStep, referralCode, setReferralCode }),
    [signupStep, referralCode],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) throw new Error('useAuthFlow must be used inside AuthFlowProvider');
  return context;
}
```

### `src/hooks/useAuth.ts`

```ts
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginThunk, logoutThunk } from '../store/slices/authSlice';

/**
 * Combines Redux auth state/actions for screen usage.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const login = (email: string, password: string) => dispatch(loginThunk({ email, password }));
  const logout = () => dispatch(logoutThunk());

  return { ...auth, login, logout };
}
```

### `src/components/common/AppButton.tsx`

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { AppSpinner } from './AppSpinner';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

/**
 * Reusable button component for consistent UX.
 */
export function AppButton({ title, onPress, loading = false }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress} disabled={loading}>
      {loading ? <AppSpinner color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#0B6BFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '600' },
});
```

### `src/components/common/AppInput.tsx`

```tsx
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}

/**
 * Reusable text input with shared styling.
 */
export function AppInput({ value, onChangeText, placeholder, secureTextEntry }: Props) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
});
```

### `src/screens/auth/LoginScreen.tsx` (useState + useReducer + Redux)

```tsx
import React, { useReducer, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { useAuth } from '../../hooks/useAuth';

type FormAction = { type: 'setEmail'; payload: string } | { type: 'setPassword'; payload: string };
type FormState = { email: string; password: string };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.payload };
    case 'setPassword':
      return { ...state, password: action.payload };
    default:
      return state;
  }
};

export function LoginScreen() {
  const [form, dispatchForm] = useReducer(formReducer, { email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true); // local component UI state
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login(form.email.trim(), form.password).unwrap();
    } catch {
      Alert.alert('Login failed', 'Please check your credentials and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <AppInput
        value={form.email}
        onChangeText={value => dispatchForm({ type: 'setEmail', payload: value })}
        placeholder="Email"
      />
      <AppInput
        value={form.password}
        onChangeText={value => dispatchForm({ type: 'setPassword', payload: value })}
        placeholder="Password"
        secureTextEntry
      />
      <Text onPress={() => setRememberMe(prev => !prev)} style={styles.remember}>
        Remember me: {rememberMe ? 'On' : 'Off'}
      </Text>
      <AppButton title="Login" onPress={handleLogin} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  remember: { marginBottom: 12, color: '#667085' },
});
```

### `src/navigation/AppNavigator.tsx`

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Routes user based on Redux auth state.
 */
export function AppNavigator() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### `App.tsx` (Provider Composition)

```tsx
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store';
import { AuthFlowProvider } from './src/contexts/AuthFlowContext';
import { AppNavigator } from './src/navigation/AppNavigator';

/**
 * Provider order:
 * 1) Redux for global app state
 * 2) Feature contexts for scoped module state
 * 3) Navigation/screens
 */
export default function App() {
  return (
    <ReduxProvider store={store}>
      <AuthFlowProvider>
        <AppNavigator />
      </AuthFlowProvider>
    </ReduxProvider>
  );
}
```

## 6) Cross-Platform Examples

### `src/utils/platform.ts`

```ts
import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
```

### Permissions (Camera Example)

```ts
import { Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Requests camera permission using platform-specific constants.
 */
export async function requestCameraPermission(): Promise<boolean> {
  const permission =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

  const result = await request(permission);
  return result === RESULTS.GRANTED;
}
```

### Camera Launch (Platform-safe)

```ts
import { launchCamera } from 'react-native-image-picker';

/**
 * Opens native camera and returns selected asset.
 */
export async function openCamera() {
  const result = await launchCamera({ mediaType: 'photo', cameraType: 'back' });
  if (result.didCancel) return null;
  if (result.errorCode) throw new Error(result.errorMessage ?? 'Camera error');
  return result.assets?.[0] ?? null;
}
```

## 7) Coding Standards

- Use `PascalCase` for components and types (`LoginScreen`, `AuthResponse`).
- Use `camelCase` for functions, variables, hooks (`saveTokens`, `useAuth`).
- Keep functions short and focused; move side effects to `services/`.
- Add comments to major modules/functions (as shown above).
- Strict TypeScript everywhere (avoid `any`).

## 8) Suggested Rules for Agentic Code Generation

When generating new code, follow these rules:

1. Place every new module in the correct `src/` folder by responsibility.
2. Never mix API/network logic inside UI components.
3. Redux only for top-level global state, Context for feature scopes, `useState/useReducer` for local state.
4. Store tokens only via `react-native-keychain`, never plain `AsyncStorage`.
5. Every service call must include typed responses and error handling.
6. Every screen should reuse shared components from `components/common`.
7. Keep Android and iOS behavior aligned; use platform checks only when necessary.
8. Any async action button must be disabled while loading to prevent duplicate requests.
9. For OTP UX, use 4 separate input boxes with proper backspace/focus/paste behavior.
10. Every new UI screen must be designed for both light mode and dark mode from day one, with readable contrast and consistent styling in both themes.
11. Never hardcode user-facing copy inside components/screens; keep all display text in a centralized constants module (for example `src/utils/appText.ts`) and reference from there.
12. Keep all shared TypeScript types, interfaces, enums, and ambient declarations inside `src/types/` and re-export them from `src/types/index.ts` so the app has one canonical type entry point.
13. Keep toast UI theme-aware for both light and dark mode, and prefer backend-provided messages for API feedback instead of custom client-side success text.
14. Use shared navigation primitives (for example a common `BackButton` component) instead of repeating per-screen back button markup, and ensure icon contrast is correct in both dark and light mode.
15. Implement countdown/timer UX using absolute timestamps (`Date.now`) so timers remain accurate if the app is minimized/backgrounded and resumed.
16. Keep static selection data (for example gender options, filter chips, dropdown items, tab metadata) in shared option modules like `src/utils/options.ts`; do not define these arrays inside screen components.
17. Keep reusable helper logic (for example masking/formatting/parsing utilities like `maskPhoneNumber`) in `src/utils/index.ts` or focused files under `src/utils/`, and import them in screens/components instead of redefining functions locally.
18. Use `/auth/me` onboarding flags as the source of truth for onboarding navigation. For worker flow, route by backend state: `isBasicInfoCompleted` -> identity step, `isServicesSelected` -> service selection step, `isDocumentsCompleted` -> documents/certificates step; never hardcode onboarding progression only on client-side assumptions.
19. Maintain separate loading states for each API call intent on a screen (fetch, save, skip, upload). Never let one action show another action's loading UI.
20. Use only shared `AppSpinner` for loading indicators in UI components/screens to keep behavior and styling consistent.

## 9) Production Readiness Checklist

- [ ] ESLint + Prettier configured and passing.
- [ ] TypeScript strict mode enabled (`"strict": true`).
- [ ] Unit tests for reducers, hooks, and utility functions.
- [ ] Integration tests for auth flow and navigation guard.
- [ ] API timeout/retry/error UX implemented.
- [ ] Secure token lifecycle tested (save/read/clear).
- [ ] Android permissions declared and runtime-checked.
- [ ] iOS `Info.plist` privacy keys configured (camera, photos, etc.).
- [ ] Crash reporting and analytics integrated.
- [ ] App startup performance and bundle size reviewed.
- [ ] CI checks for lint, type-check, tests, and build.

## 10) Quick Start Implementation Order

1. Create folder structure under `src/`.
2. Add types and services (`keychainService`, `apiClient`, `authService`).
3. Configure Redux store and `authSlice`.
4. Add `AuthFlowContext` for feature-level auth UI state.
5. Build reusable `AppButton` and `AppInput`.
6. Implement `LoginScreen` and auth navigation gating.
7. Add platform permissions/camera utilities.
8. Add tests and run production checklist.

This guide is designed to be directly used as a codex agent blueprint for generating clean, scalable React Native app code that works reliably on both Android and iOS.

## 11) Dellite Partner App Flow Blueprint

Use this default app flow:

1. Login Flow:
   Phone number screen -> OTP verification screen.
2. Worker Onboarding (required 3-step flow):
   Step 1: Create profile using verified phone token (`POST /customer/profile`, fallback `POST /worker/profile` if needed by backend contract).
   Step 2: Fetch categories (`GET /categories`) and save selected worker services (`POST /worker/services`), then fetch certificate checklist (`GET /worker/status`).
   Step 3: All set screen with CTA to enter main tabs and start getting jobs.
3. Main App Tabs:
   Home, Ongoing, Earnings, Profile.
4. Profile Subpages:
   Edit Profile, Payout Details, Help & Support (add more as needed).

Recommended navigator split:

```text
AppNavigator
  ├─ AuthNavigator (PhoneLogin, OtpVerification)
  ├─ OnboardingNavigator (OnboardingWelcome, OnboardingIdentity, OnboardingVehicle)
  └─ MainTabsNavigator
      ├─ Home
      ├─ Ongoing
      ├─ Earnings
      └─ ProfileNavigator (nested stack for profile pages)
```

## 12) Theme Rules (Single Source of Truth)

Use semantic color keys only (no color-name keys, no hardcoded hex in components/screens).

Single source:

1. `src/utils/theme.tokens.json` (all raw color values and gradients)
2. `src/utils/theme.ts` (typed runtime exports for app usage)
3. `tailwind.config.js` (must read values from `theme.tokens.json`)

Mandatory rules:

- Always use semantic keys like `primary`, `secondary`, `accent`, `textPrimary`, `baseDark`.
- Never add `brand*` color keys in code or tailwind config.
- Never hardcode `#...` or `rgba(...)` inside screens/components.
- For new UI, consume colors only via:
  - Tailwind classes mapped from token keys (`text-primary`, `bg-accent`, etc.)
  - `theme`, `palette`, `uiColors` from `src/utils/theme.ts`

Also keep these in sync:

1. Navigation theme: `src/navigation/AppNavigator.tsx`
2. Tab state colors: `src/navigation/MainTabsNavigator.tsx`
3. Gradient wrapper: `src/components/common/GradientScreen.tsx`

## 13) Tailwind + Gradient Setup (React Native)

Use NativeWind for utility classes and `expo-linear-gradient` for branded backgrounds.

Required files:

- `babel.config.js` -> include `nativewind/babel` and `react-native-reanimated/plugin`
- `metro.config.js` -> wrap Expo metro config with `withNativeWind(...)`
- `global.css` -> include tailwind directives
- `nativewind-env.d.ts` and `tsconfig.json` types for className support

Preferred gradient usage:

- Create a shared `GradientScreen` component in `src/components/common/GradientScreen.tsx`
- Use it across auth/onboarding/home/ongoing/earnings/profile screens for visual consistency

## 14) Centralized API Pattern (Required)

Create all backend calls in `src/actions/` only.

- `src/actions/http/httpClient.ts`: keep reusable helpers
  - `apiGet(path, options)`
  - `apiPost(path, body, options)`
  - `apiPatch(path, body, options)`
  - `apiDelete(path, options)`
- `src/actions/authActions.ts`: `/auth/*` endpoints
- `src/actions/workerActions.ts`: `/worker/*` endpoints

Environment:

- Add `.env` with `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
- Read with `process.env.EXPO_PUBLIC_API_BASE_URL` in HTTP client.

Token and keychain setup:

- Keep keychain service names in `src/utils/key-chain-values.ts`.
- Keep reusable keychain methods in `src/utils/keychain.ts`.
- Store/retrieve auth tokens only through centralized storage helpers.

## 15) Icons Registry Pattern

Create `src/icons/index.tsx`:

- Maintain `iconMap` object for all icon names.
- Export a single `AppIcon` component:
  - props: `name`, `size`, `color`, and native icon props.
- Consume `AppIcon` in tabs/screens instead of using icon libraries directly.

## 16) Lottie Scalable Setup

1. Keep JSON files in `src/assets/lottie/`
2. Register each animation in `src/animations/index.ts`
3. Use shared wrapper `src/components/common/AppLottie.tsx`
4. Screens should reference animation by registry key, not by raw file path
- `actions/`: single place for API endpoints and request helpers, avoids duplicate fetch/axios logic in screens.
- `icons/`: one icon registry keeps naming, sizing, and color usage consistent app-wide.
