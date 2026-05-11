# Architecture Overview

## Monorepo Structure

Dellite is a dual-app Expo React Native monorepo with shared core packages.

```
apps/
  ├── worker-app/          # Worker app (service provider)
  └── customer-app/        # Customer app (service requester)

packages/
  ├── app-core/            # Shared types, utilities, storage
  ├── config-eslint/       # Lint configuration
  ├── config-ts/           # TypeScript configuration
  └── config-prettier/     # Prettier configuration
```

See [monorepo-structure.md](monorepo-structure.md) for detailed folder hierarchies.

## App Architecture Layers

Each app follows a clean architecture with strict separation:

```
src/
├── screens/              # Screen components (presentational only)
├── components/           # Reusable UI components (presentational)
├── hooks/                # Custom hooks (state/effects/orchestration)
├── contexts/             # React Context (thin providers)
├── actions/              # API/data actions
├── types/                # TypeScript types & enums
├── utils/                # Utility functions & helpers
├── services/             # Firebase, analytics, etc.
├── navigation/           # Route definitions & navigators
├── store/                # Redux/state store (if used)
├── lib/                  # External library integrations
├── modules/              # Feature modules (feature-specific logic)
├── assets/               # Images, fonts, animations
└── constants/            # Global constants
```

## Key Architectural Principles

### 1. **Context + Hook Separation**
- Context files stay thin and provide only state
- Business logic, effects, API calls go in `useXxxController` hooks
- Screens import contexts only, never controller hooks directly

See [context-hook-architecture.md](context-hook-architecture.md)

### 2. **Type Placement (Strict)**
- All types/interfaces/enums live in `src/types/*`
- Never declare types inside screens, components, or hooks
- Types follow the current backend contract exactly

See [type-system.md](type-system.md)

### 3. **Screen Purity**
- Screens are presentational/orchestration-only
- No business logic, calculations, or helpers in screen files
- All helpers go to `src/utils/*` (re-exported via index.ts)

See [screen-purity.md](screen-purity.md)

### 4. **HTTP Client Standardization**
- Consistent request helpers: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`
- Standard error handling and toast integration
- Auth header format: `Authorization: Bearer <token>`

See [http-client.md](http-client.md)

### 5. **Worker/Customer Parity**
- Foundational code (http, auth, storage, types) must stay aligned
- Use `AGENTS.md` as the single source of truth
- CI ensures both apps typecheck before merge

See [parity-rules.md](parity-rules.md)

## Related Documentation

- **Flows**: Authentication, booking, onboarding, location → [/docs/flows](../flows/index.md)
- **State Management**: Contexts, hooks, store → [/docs/state-management](../state-management/index.md)
- **APIs**: HTTP client, endpoints, types → [/docs/apis](../apis/index.md)
- **UI**: Components, icons, theming → [/docs/ui](../ui/index.md)
- **Firebase**: Auth, analytics, database → [/docs/firebase](../firebase/index.md)
