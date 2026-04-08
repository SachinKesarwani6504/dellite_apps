# Codex Agent Guide: Dellite Customer App (Worker-Style Standard)

This guide mirrors the worker app engineering style and applies it to the customer app codebase.

## 1) Project Architecture (All App Code in `src/`)

```text
src/
  actions/
    authActions.ts
    customerActions.ts
    http/
      httpClient.ts
  assets/
    images/png/
  components/
    common/
      AppInput.tsx
      Button.tsx
      BackButton.tsx
      GradientScreen.tsx
      GradientWord.tsx
      OtpCodeInput.tsx
      ProfilePhotoUploadPlaceholder.tsx
      TrustPills.tsx
      BrandRefreshControl.tsx
      AppLottie.tsx
  constants/
    appText.ts
    brand.ts
  contexts/
    AuthContext.tsx
  hooks/
    useAuth.ts
    useAuthController.ts
    useOnboarding.ts
  icons/
    index.tsx
  navigation/
    AppNavigator.tsx
    AuthNavigator.tsx
    OnboardingNavigator.tsx
    MainTabsNavigator.tsx
  screens/
    auth/
      PhoneLoginScreen.tsx
      OtpVerificationScreen.tsx
    onboarding/
      OnboardingCustomerIdentityScreen.tsx
      OnboardingCustomerWelcomeScreen.tsx
    main/
      HomeScreen.tsx
      ProfileScreen.tsx
  types/
    api.ts
    auth.ts
    auth-context.ts
    customer.ts
    navigation.ts
    toast.ts
  utils/
    index.ts
    screenNames.ts
    layout.ts
    mask.ts
    options.ts
    theme.ts
    theme.tokens.json
    toast.tsx
    key-chain-storage/
      auth-storage.ts
      onboarding-storage.ts
      key-chain-service.ts
      key-chain-values.ts
```

## 2) Core Architecture Rules

- Keep API/network logic in `src/actions/` only.
- Keep auth/session orchestration in `src/hooks/useAuthController.ts` + `src/contexts/AuthContext.tsx`.
- Keep reusable UI in `src/components/common/`.
- Keep user-facing strings in `src/constants/appText.ts`.
- Keep static options in `src/utils/options.ts`.
- Keep shared route names in `src/utils/screenNames.ts` and consume everywhere.
- Keep shared TS contracts in `src/types/`.

## 3) Required UX Rules (Worker-Style)

### 3.1 Navigation Safety Rule (Required)

- Never call `navigation.goBack()` without checking `navigation.canGoBack()`.
- Auth/onboarding routing must be derived from `/auth/me` flags.
- Do not hardcode onboarding progression from client assumptions.

### 3.2 Scrollbar Rule (Required)

- Hide scroll indicators by default for production polish.
- Use `showsVerticalScrollIndicator={false}` and `showsHorizontalScrollIndicator={false}` unless product explicitly requires visible scrollbars.

### 3.3 In-Flight Form Lock Rule (Required)

- On form submit API calls, show loading on submit CTA.
- During same in-flight state, disable all editable controls:
  - inputs (`TextInput`, `AppInput`)
  - selections (`Pressable`, chips, toggles)
  - upload/picker triggers
- Re-enable only after request settles.

### 3.4 Required Asterisk Rule (Required)

- Mandatory field `*` must always be red.
- Use `theme.colors.negative` for asterisk color.
- Keep asterisk rendered as a separate text element.

### 3.5 Separate Loading State Rule (Required)

- Maintain separate loading flags per API intent (`isFetching...`, `isSubmitting...`, `isUpdating...`, `isUploading...`).
- Never reuse one loading flag for unrelated calls.
- If form lock needs combined behavior, derive explicitly (for example `const formLocked = isSubmitting || isUploading`).

### 3.6 Common Spinner Rule (Required)

- Use a single shared spinner component for app UI loading states.
- Do not sprinkle raw `ActivityIndicator` directly in screens/features.
- Spinner colors must come from theme tokens.

## 4) Auth + Onboarding Source of Truth

- `/auth/me` is the only source of truth for post-auth routing.
- Current customer flow target:
  - `LOGGED_OUT` -> Auth flow
  - `ONBOARDING` -> Identity step
  - `POST_ONBOARDING_WELCOME` (or `hasSeenOnboardingWelcomeScreen=false`) -> Welcome step
  - `AUTHENTICATED` -> Main tabs
- After welcome CTA:
  - patch `hasSeenOnboardingWelcomeScreen`
  - refresh `/auth/me`
  - then enter main tabs

## 5) API + Storage Rules

- Use only `apiGet/apiPost/apiPatch/apiDelete` from `src/actions/http/httpClient.ts`.
- Keep endpoint wrappers in `src/actions/authActions.ts` and `src/actions/customerActions.ts`.
- Keep secure token persistence only in `src/utils/key-chain-storage/`.
- Never use plain `AsyncStorage` for auth tokens.

## 6) Theme Rules (Required)

Single source of truth:

1. `src/utils/theme.tokens.json`
2. `src/utils/theme.ts`

Mandatory:

- No hardcoded hex/rgba in screens/components.
- Use only tokenized values via `theme`, `palette`, `uiColors`.
- Every screen/component must support light + dark mode from day one.
- Validate contrast for all new states (default/loading/disabled/error/success) in both modes.

## 7) Shared Component Rules

- Use shared `BackButton`, `Button`, `AppInput`, `OtpCodeInput`, `GradientScreen`, `AppIcon`.
- Do not create near-duplicate components if shared ones can be extended.
- Keep brand sizing centralized in `src/constants/brand.ts`.

## 8) Copy, Options, and Utilities Rules

- No hardcoded user-facing strings in screens.
- No inline static option arrays inside screens.
- Keep reusable helpers in `src/utils/` and export through `src/utils/index.ts`.

## 9) Quality Gates

Before finalizing code changes:

- `npm run typecheck` passes.
- Routing sanity checked for:
  - fresh login
  - app reopen with saved tokens
  - onboarding incomplete
  - welcome-required
  - authenticated main tabs
- New UI checked in both light and dark modes.

## 10) Agentic Code Generation Rules (Enforced)

1. Put every new file in the correct `src/` layer.
2. Never mix API calls inside screen components.
3. Keep auth/session canonical in `useAuthController`/AuthContext.
4. Keep route names centralized in `src/utils/screenNames.ts`.
5. Use `/auth/me` flags for onboarding routing decisions.
6. Lock forms during submit (inputs + selectors + upload triggers).
7. Keep mandatory `*` red and tokenized.
8. Keep separate loading flags per API intent.
9. Reuse shared components before introducing new ones.
10. Ship all new UI with light+dark compatibility by default.

This file is the default coding contract for this customer app and should be followed the same way as worker app style.
