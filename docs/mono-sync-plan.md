# Monorepo Sync Plan (Worker + Customer)

## Goal

Keep both apps very similar in engineering fundamentals while allowing role-specific screens/APIs.

## Phase 0: Foundation

- [x] Move both apps into monorepo (`apps/worker-app`, `apps/customer-app`)
- [x] Add shared packages folder (`packages/*`)
- [x] Add canonical coding contract (`/AGENTS.md`)

## Phase 1: Rules Consolidation

- [x] Deprecate old duplicate guide files:
  - root `codex_agent.md`
  - customer `codes_agent.md`
- [x] Keep each app-level guide as a short pointer to root `AGENTS.md`

## Phase 2: Fundamental File Parity

- [x] Align `httpClient.ts` shape between worker and customer
- [x] Align `types/api.ts` contracts
- [x] Align `types/http.ts` request option naming
- [x] Align key-chain storage module split and naming
- [x] Verify `toast.tsx` stays equivalent

## Phase 3: Shared Core Extraction

- [ ] Move shared token helpers to `packages/app-core`
- [ ] Move shared key-chain primitives to `packages/app-core`
- [ ] Move shared API error + request options to `packages/app-core`
- [ ] Make both apps import from `@dellite/app-core` for fundamentals

## Phase 4: Tooling Consistency

- [ ] Common TS base config from `packages/config-ts`
- [ ] Common lint config from `packages/config-eslint`
- [ ] Add root scripts:
  - `typecheck:worker`
  - `typecheck:customer`
  - `typecheck:all`

## Phase 5: Guardrails

- [ ] Add CI check to prevent duplicate foundational implementations
- [ ] Add CI check for both app typechecks
- [ ] Add checklist for “fundamental change must be mirrored in both apps”

## Current Next Action

1. Move shared HTTP/token helpers into `packages/app-core`.
2. Add root `typecheck:worker` and `typecheck:customer` scripts for parity validation.

## In Progress: Onboarding Context Split

- [x] Worker app: split auth/session state and onboarding flow state into separate contexts.
- [x] Worker app: onboarding navigator route decisions now come from onboarding context and `/auth/me` worker flags.
- [x] Customer app: mirrored onboarding context split and onboarding navigator route ownership.
- [x] Worker + Customer: removed `hooks/useAuth.ts` wrapper and standardized direct context hook usage.
