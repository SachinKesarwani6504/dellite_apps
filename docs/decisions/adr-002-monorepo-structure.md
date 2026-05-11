# ADR 002: Monorepo Structure (Worker + Customer Apps)

**Status**: Accepted

**Date**: 2024-01-10

## Context

Dellite serves two different user roles with different needs:
- **Worker**: Service provider (accept jobs, track completion, get paid)
- **Customer**: Service requester (browse services, book, track status, pay)

We needed to:
- Share common business logic (auth, types, HTTP client)
- Support different UIs and features per role
- Maintain consistency (parity) on foundational code
- Scale to multiple apps if needed

## Decision

Use a **monorepo structure** with:
- Two separate Expo apps: `apps/worker-app` and `apps/customer-app`
- Shared package: `packages/app-core` for types, utilities, storage
- Shared configuration: `packages/config-*`
- Single source of truth: `AGENTS.md` for coding standards

## Rationale

### Code Sharing
- Common types in `packages/app-core` (no duplication)
- Shared HTTP client, toast, storage primitives
- One place to update foundational code

### Role-Specific Features
- Worker-only screens (job acceptance, worker profile)
- Customer-only screens (booking, order tracking)
- No unused code in each app

### Team Scalability
- Clear folder structure
- Easy to onboard developers
- Clear separation of concerns

### CI/CD
- Both apps built and tested in one CI run
- Parity checks ensure consistency
- Easy to enforce standards

## Alternatives Considered

### Single App with Feature Flags
- **Pros**: Share all code, single deployment
- **Cons**: Bloated app size, complex conditional rendering, harder to manage UI per role

### Separate Repos
- **Pros**: Complete separation, easy to deploy independently
- **Cons**: Duplicate foundational code, hard to keep in sync, more overhead

### Shared Web Framework (React.js)
- **Pros**: More code sharing
- **Cons**: Different from Expo React Native, requires backend/admin web app

## Consequences

### Positive
- Both apps stay lightweight (only their features)
- Shared code prevents bugs from divergence
- Easy to add third app (e.g., admin web)
- Better code organization
- Parity checks catch inconsistencies

### Negative
- More folders to manage
- Must ensure parity on foundational files
- CI must test both apps
- Developers must understand monorepo structure

## Repository Structure

```
dellite-apps/
├── apps/
│   ├── worker-app/          # Worker features
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── actions/
│   │   │   └── ...
│   │   └── package.json
│   └── customer-app/        # Customer features
│       └── ...
├── packages/
│   ├── app-core/            # Shared types, utils
│   ├── config-ts/           # Shared TS config
│   └── config-eslint/       # Shared lint config
├── AGENTS.md                # Coding contract
└── docs/                    # Documentation
```

## Parity Requirements

Files that must stay identical:

- `src/actions/http/httpClient.ts` (HTTP client logic)
- `src/types/api.ts` (API types)
- `src/types/http.ts` (HTTP types)
- `src/utils/toast.tsx` (Toast functions)
- `src/utils/key-chain-storage/*` (Token storage)
- Context + hook patterns for equivalent features

## Phase-by-Phase Extraction

### Phase 1 (Current)
- Keep foundational files identical in both apps
- Use CI to verify parity

### Phase 2 (Future)
- Extract shared code to `packages/app-core`
- Both apps import from `@dellite/app-core`
- Reduce duplicate files

### Phase 3 (Future)
- Add admin web app if needed
- Use same shared packages

## Related ADRs

- [ADR 001: Context + Hook Pattern](adr-001-context-hook-pattern.md) - Same pattern in both apps
- [ADR 003: Strict Type Placement](adr-003-strict-type-placement.md) - Parity on types

## References

- [Monorepo Structure Doc](/docs/architecture/monorepo-structure.md)
- [Parity Rules Doc](/docs/architecture/parity-rules.md)
- [AGENTS.md](/AGENTS.md) - Full coding contract
- [mono-sync-plan.md](/docs/mono-sync-plan.md) - Migration phases
