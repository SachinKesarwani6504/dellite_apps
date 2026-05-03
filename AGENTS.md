# Dellite Monorepo Coding Contract

This file is the single source of truth for coding standards across:
- `apps/worker-app`
- `apps/customer-app`

## 1) Repo Structure Rules

- Shared fundamentals must live in `packages/app-core`.
- App-specific UI/routes/business features stay in each app folder.
- Do not duplicate shared primitives in both apps.

Required layout:

```text
apps/
  worker-app/
  customer-app/
packages/
  app-core/
  config-eslint/
  config-ts/
  config-prettier/
```

## 2) File Naming Rules

- Components/screens: `PascalCase.tsx`
- Utility/modules/types: `kebab-case.ts` where feasible, otherwise existing local convention
- Keep naming parallel in both apps for equivalent files:
  - `src/actions/http/httpClient.ts`
  - `src/utils/toast.tsx`
  - `src/utils/appText.ts`
  - `src/types/screen-names.ts`
  - `src/utils/key-chain-storage/*`
  - `src/types/*`
- Context API filenames must stay parallel in both apps:
  - `src/contexts/AuthContext.tsx`
  - `src/contexts/OnboardingContext.tsx`
  - `src/hooks/useAuthController.ts`
  - `src/hooks/useOnboardingController.ts`
- Keep context files only under `src/contexts/*` and hook files only under `src/hooks/*`.
- Avoid wrapper hook aliases like `src/hooks/useAuth.ts`; import directly from context hooks (example: `useAuthContext`, `useOnboardingContext`).
- Do not use mixed naming styles for equivalent modules (example: avoid `screenNames.ts` in one app and `screen-names.ts` in the other).

## 3) HTTP Client Rules

- Worker and customer must follow the same http client code style and flow shape.
- Keep request helpers consistent:
  - `apiGet`
  - `apiPost`
  - `apiPatch`
  - `apiDelete`
- Keep error extraction and toast handling standardized.
- Keep auth header format exact: `Authorization: Bearer <token>`.

Token rules for worker flow:
- `phoneToken` only for profile creation endpoints.
- `accessToken` for authenticated APIs.
- `refreshToken` only for refresh endpoint payload, never as auth header.
- Retry once after successful refresh.
- On refresh failure, clear tokens and force re-auth flow.

## 4) Storage Rules

- Token persistence only via `src/utils/key-chain-storage/`.
- Session tokens and onboarding/phone token storage must be separate modules.
- Never store auth tokens in plain AsyncStorage.
- Keep key names parallel and explicit in both apps.

## 5) Toast Rules

- `src/utils/toast.tsx` should remain aligned in both apps.
- Use same function names:
  - `showApiSuccessToast`
  - `showApiErrorToast`
  - `showToast`
- Keep dark/light behavior tokenized using theme values.

## 6) Type Rules

- Keep equivalent API/auth/request option type naming aligned across apps.
- Shared types should move to `packages/app-core` first.
- App-local types only when truly role-specific.

## 7) Text/Theme/Options Rules

- No hardcoded screen copy; use app text constants.
- No hardcoded color values in screens/components; use theme tokens.
- Keep static option lists in `utils/options`.
- Scrollbars: default to hiding scroll indicators in scrollable lists/containers:
  - `showsVerticalScrollIndicator={false}`
  - `showsHorizontalScrollIndicator={false}`
  Enable only when a specific UX requires it.

## 8) Change Management Rules

- For any fundamental change (http, auth, storage, types, toast), apply in both apps in the same PR/commit set.
- Update `docs/mono-sync-plan.md` progress after each phase.
- Do not introduce a second competing guide file.

## 9) Quality Gate

Before finishing:
- Worker typecheck passes.
- Customer typecheck passes.
- Equivalent foundational files are compared and aligned.
- Repo lint/structure/parity checks pass (`npm run lint:repo`).
- Full verification passes (`npm run verify:all`) before merge.

## 10) Component Cleanliness Rules

- Keep presentational components/screens lean; avoid embedding repeated format/label helper functions directly in screen files.
- Move small reusable helpers (number formatting, reward labels, event label formatting, etc.) into `src/utils/*`.
- Export reusable helpers via `src/utils/index.ts` so screens can import from one place.
- Apply the same helper structure in both apps whenever files are equivalent.
- For required form/card fields, always show a red asterisk (`*`) as the required indicator and keep this styling consistent across screens.
 - No reusable helper functions inside screens/components (example: `formatCurrency`, `getErrorMessage`, `extractImageUrl`). Put them in `src/utils/index.ts` and import.

## 11) Repo-Local Skills

- Reusable Codex skills live in:
  - `skills/dellite-monorepo-defaults/SKILL.md`
  - `skills/dellite-refactor-execution/SKILL.md`
- Prefer using these skills for day-to-day implementation to reduce repeated prompting, avoid regression, and keep worker/customer parity.
- Keep skill instructions aligned with this `AGENTS.md` contract.

## 12) Automation Commands

- Root verification commands:
  - `npm run lint:repo`
  - `npm run verify:worker`
  - `npm run verify:customer`
  - `npm run verify:all`
- CI (`.github/workflows/quality-gate.yml`) must stay green before merge.

## 13) Context + Hook Architecture

- Keep Context files thin and clean:
  - `src/contexts/*Context.tsx` should only create/provide context and expose `use*Context`.
  - Avoid embedding business logic, state machines, API orchestration, or route resolution directly in context files.
- Keep logic in dedicated hook controllers:
  - `src/hooks/use*Controller.ts` should own state, effects, API calls, and flow decisions.
  - Context providers should consume these hooks and pass values down.
- Consumption rule (strict):
  - Screens/components must import Context APIs only (`useAuthContext`, `useOnboardingContext`, etc.).
  - Screens/components must not import controller hooks directly (`useAuthController`, `useOnboardingController`).
  - If a temporary wrapper hook (example: `src/hooks/useOnboarding.ts`) becomes unused after migration, delete it immediately.
- Apply the same architecture pattern in both `apps/worker-app` and `apps/customer-app` for equivalent contexts.

## 14) Screen Purity + Booking Flow Rules

- Do not keep reusable pure functions inside screens/components (date slot builders, enum label formatters, option mappers, math/calculation helpers, etc.).
- Put reusable screen helpers in `src/utils/*` and re-export via `src/utils/index.ts`.
- For booking flow specifically:
  - Booking calculations, derived booking validity, and payload-shaping logic must live in `src/hooks/useBookingFlowController.ts` and `src/utils/booking-flow.ts`, not in booking screens.
  - `BookingDetailsScreen.tsx` and `BookingConfirmationScreen.tsx` must stay presentational/orchestration-focused.
- Never hardcode booking type literals (`'INSTANT'`, `'SCHEDULED'`) in screens/components/hooks.
  - Define and use typed constants from `src/types/*` (example: `CUSTOMER_BOOKING_TYPE.INSTANT`).
- Apply the same purity and constant usage pattern in both apps whenever equivalent flows exist.

## 15) API Type Hygiene Rules (Strict)

- `src/types/*` must represent the current backend contract only.
- Do not keep speculative, legacy, or unused API fields in request/response types.
- When backend contract changes:
  - Update types first.
  - Then update normalizers/mappers/actions.
  - Then update UI/hooks usage.
- For API enums (example: `usageType`, booking/status enums), use explicit union types, not broad `string` fallbacks unless backend explicitly allows arbitrary strings.
- For backend enum-backed fields (example: `PriceType`, `PriceComputationMode`, `RoundingMode`, `ServiceTaskType`, `CommissionType`):
  - Keep frontend enum/union values exactly aligned to backend values.
  - Do not keep legacy enum members once backend contract has changed.
- For detail/list API migration:
  - Keep ID-based path params in route and action types.
  - Keep name/search filters only in query types.
- Every PR touching API types must also:
  - remove dead fields from affected types,
  - remove dead mapper code for those fields,
  - remove dead UI logic depending on removed fields,
  - pass app typecheck after cleanup.

## 16) Strict Type Placement + Screen Logic Rules

- Do not declare `type`, `interface`, or `enum` inside:
  - `src/screens/*`
  - `src/components/*`
  - `src/hooks/*`
  - `src/contexts/*`
  - `src/navigation/*` or navigator files
- Keep all app-local type declarations in `src/types/*` with relevant file names.
- Import types/enums/constants from `src/types/*`; do not redefine equivalent shapes in feature files.
- Keep screens/components presentational-first:
  - No business/data orchestration in screen files.
  - Move state/effects/API orchestration into dedicated hook controllers in `src/hooks/*`.
  - Move reusable calculations/mappers/formatters into `src/utils/*`.
- Apply the same strict type placement and screen-logic separation in both apps.
