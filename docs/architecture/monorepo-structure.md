# Monorepo Structure

## Top-Level Organization

```
dellite-apps/
├── apps/                           # App-specific code
│   ├── worker-app/
│   │   ├── src/                    # Worker app source
│   │   ├── package.json            # Worker dependencies
│   │   └── tsconfig.json
│   └── customer-app/
│       ├── src/                    # Customer app source
│       ├── package.json            # Customer dependencies
│       └── tsconfig.json
├── packages/                       # Shared code
│   ├── app-core/                   # Shared types, utils, storage
│   │   ├── src/
│   │   │   ├── index.ts            # Main export
│   │   │   ├── types/              # Shared type definitions
│   │   │   ├── utils/              # Shared utilities
│   │   │   └── storage/            # Storage primitives
│   │   └── package.json
│   ├── config-ts/                  # TypeScript config
│   ├── config-eslint/              # ESLint config
│   └── config-prettier/            # Prettier config
├── docs/                           # This documentation
├── skills/                         # Reusable Codex skills
├── scripts/                        # Build/quality scripts
├── package.json                    # Root workspace config
└── AGENTS.md                       # Coding contract (source of truth)
```

## Worker App Structure

```
worker-app/src/
├── screens/
│   ├── auth/                       # Auth flow screens
│   ├── onboarding/                 # Worker onboarding
│   ├── home/                       # Dashboard
│   ├── jobs/                       # Job listings/details
│   ├── profile/                    # Worker profile
│   └── settings/
├── components/
│   ├── common/                     # Shared components (worker)
│   ├── home/
│   ├── job-details/
│   └── profile/
├── hooks/
│   ├── useAuthController.ts        # Auth logic
│   ├── useOnboardingController.ts  # Onboarding flow
│   └── [useXxxController.ts]       # Feature controllers
├── contexts/
│   ├── AuthContext.tsx
│   ├── OnboardingContext.tsx
│   └── [XxxContext.tsx]
├── actions/
│   ├── http/
│   │   └── httpClient.ts           # HTTP client
│   ├── authActions.ts              # Auth endpoints
│   ├── workerActions.ts            # Worker-specific APIs
│   └── index.ts
├── types/
│   ├── api.ts                      # API request/response types
│   ├── http.ts                     # HTTP options, errors
│   ├── auth.ts                     # Auth-related types
│   ├── screen-names.ts             # Route names
│   └── [feature].ts
├── utils/
│   ├── index.ts                    # Re-exports all helpers
│   ├── toast.tsx                   # Toast notifications
│   ├── key-chain-storage/
│   │   ├── session-token.ts
│   │   └── phone-token.ts
│   ├── appText.ts                  # Copy/strings
│   ├── options.ts                  # Static lists
│   └── [helpers].ts
├── services/
│   └── firebase/
├── navigation/
│   ├── AuthNavigator.tsx
│   ├── AppNavigator.tsx
│   └── [FeatureNavigator].tsx
├── modules/
│   └── [feature-module]/
├── store/                          # Redux/state store
├── lib/
│   └── firebase/
├── icons/
├── assets/
├── constants/
├── App.tsx
└── index.ts
```

## Customer App Structure

Identical to worker app, with customer-specific screens and features:

```
customer-app/src/
├── screens/
│   ├── auth/
│   ├── onboarding/                 # Customer onboarding
│   ├── home/                       # Browse services
│   ├── booking/                    # Booking flow
│   ├── orders/                     # Service orders
│   ├── profile/
│   └── settings/
├── components/
│   ├── common/
│   ├── home/                       # Browse/search
│   ├── booking/
│   └── orders/
├── hooks/
│   ├── useAuthController.ts
│   ├── useOnboardingController.ts
│   ├── useBookingFlowController.ts
│   └── [useXxxController.ts]
├── contexts/
│   ├── AuthContext.tsx
│   ├── OnboardingContext.tsx
│   ├── BookingFlowContext.tsx
│   └── [XxxContext.tsx]
├── actions/
│   ├── http/
│   │   └── httpClient.ts           # Same as worker (PARITY)
│   ├── authActions.ts
│   ├── customerActions.ts
│   └── index.ts
├── types/
│   ├── api.ts                      # PARITY with worker
│   ├── http.ts                     # PARITY with worker
│   ├── auth.ts
│   ├── screen-names.ts
│   └── [feature].ts
├── utils/
│   ├── index.ts
│   ├── toast.tsx                   # PARITY with worker
│   ├── key-chain-storage/          # PARITY with worker
│   ├── appText.ts
│   ├── options.ts
│   └── [helpers].ts
├── services/
├── navigation/
├── modules/
├── store/
├── lib/
├── icons/
├── assets/
├── constants/
├── App.tsx
└── index.ts
```

## Shared Core Package

```
packages/app-core/src/
├── index.ts                        # Main export
├── types/
│   ├── api.ts                      # Shared API types
│   ├── http.ts                     # Shared HTTP types
│   └── auth.ts                     # Shared auth types
├── utils/
│   ├── token-helpers.ts            # Token encoding/decoding
│   ├── error-extraction.ts         # API error parsing
│   └── [shared].ts
└── storage/
    ├── storage-primitives.ts       # AsyncStorage wrappers
    └── [storage-module].ts
```

## Naming Conventions (STRICT)

- **Screens/Components**: `PascalCase.tsx`
- **Utilities/Helpers**: `kebab-case.ts` (or existing convention)
- **Hooks**: `useXxx.ts` or `useXxxController.ts`
- **Contexts**: `XxxContext.tsx`
- **Actions**: `xxxActions.ts`
- **Types**: `xxx.ts` in `src/types/`

## File Parity Requirements

Files that must stay identical across both apps:

- `src/actions/http/httpClient.ts` - HTTP client logic
- `src/utils/toast.tsx` - Toast notification helpers
- `src/utils/key-chain-storage/*` - Token storage modules
- `src/types/api.ts` - API type contracts
- `src/types/http.ts` - HTTP option/error types
- Function names: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`
- Function names: `showApiSuccessToast`, `showApiErrorToast`, `showToast`

See [AGENTS.md](/AGENTS.md) for the complete coding contract.
