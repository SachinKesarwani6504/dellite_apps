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
- [x] Align worker/customer key-chain storage implementations byte-for-byte except app-specific service keys.
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

## In Progress: City-Based Home APIs

- [x] Customer app: wired `GET /customer/home?city=...` with cache-first load, retry, and payload-driven footer/sections.
- [x] Worker app: wired `GET /worker/home?city=...` with auth, cache-first load, retry, and strict footer model (no action fields).
- [x] Worker + Customer: aligned home banner treatment and image-first cards with graceful fallback behavior.
- [x] Customer app: migrated home rendering to `data.content[]` contract (`service`, `category`, and title-based `Why Dellite` without `type`) and removed home search bar UI.
- [x] Worker + Customer: enforced city-required home requests from live location state (no silent default city fallback).
- [x] Worker + Customer: added reusable shimmer skeleton loaders under `src/components/common/loader/*` for home API loading.

## In Progress: Global Location Management

- [x] Worker + Customer: introduced shared location foundation (`types`, `constants`, `services`, `utils`) under `src/modules/location`.
- [x] Worker + Customer: added global location state inside `AuthContext` (`locationState`) powered by `useLocationController` and consumed via `useLocation`.
- [x] Worker + Customer: wired app root providers and home city resolution from live location with safe fallback.
- [x] Customer app: booking details screen now demonstrates location auto-fill + manual location refresh action.
- [x] Worker + Customer: removed persisted location cache (SecureStore) to ensure real-time location accuracy.
- [x] Worker + Customer: switched home city resolution to geo-derived city only (no hardcoded city mapping) and added city-unavailable UI when city cannot be resolved.
- [x] Worker + Customer: added scalable `location-intelligence` resolver module (city alias mapping + normalized product city resolution).
- [x] Customer app: added booking-time locality launch gating via `resolveBookingServiceability` (city may be visible, booking blocked for non-launched localities).
- [x] Worker + Customer: removed `CITY_MASTER` city validation from location resolution and normalize reverse-geocoded city names through shared `packages/app-core` helper.

## In Progress: Permission Flow Split

- [x] Worker + Customer: centralized permission access through `src/lib/permission.ts` for location and device-session helpers.
- [x] Customer app: location enable card now appears only on Home, All Services, and Bookings screens.
- [x] Customer app: onboarding no longer asks for notification permission; notification permission will be handled later on the dedicated notification screen.
- [x] Worker + Customer: location permission is now requested only when the user reaches a location-dependent surface.

## In Progress: Worker Live Location (Firebase RTDB)

- [x] Worker app: added scalable Firebase setup under `src/lib/firebase/*` with safe app initialization (`getApps()` guard).
- [x] Worker app: added live location hook `useWorkerLiveLocation` for direct RTDB writes to `/workerLive/{workerId}` (no backend location API calls).
- [x] Worker app: added distance/time throttling and computed speed (`distance / time`) before each location write.
- [x] Worker app: added optional background tracking support behind `ENABLE_BACKGROUND_LOCATION_TRACKING` flag.

## In Progress: Firebase Session Bridging

- [x] Worker + Customer: auth flows now exchange backend `firebaseCustomToken` into Firebase Auth session after OTP/profile completion.
- [x] Worker + Customer: token refresh flow now applies `firebaseCustomToken` from `/auth/refresh` and falls back to `/auth/firebase/custom-token` when Firebase session is missing.
- [x] Worker app: realigned OTP/profile token lifecycle with customer flow (`phoneToken` only for onboarding profile creation, access/refresh only for authenticated sessions).

## In Progress: Customer Pricing + Booking Flow

- [x] Customer app: primary price options now exclude optional/additional rules from main selection.
- [x] Customer app: fixed-duration base options render as selectable duration cards and suppress manual duration controls.
- [x] Customer app: booking payload keeps fixed-duration services ID-based through `selectedPriceOptionId` without sending a custom duration.
- [x] Customer app: optional/additional price options remain visible as possible add-ons and support FLAT, PER_BLOCK, and PER_MINUTE labels.
- [x] Customer app: quote loading falls back to a local estimate for compatibility while booking creation remains backend-owned.
- [ ] Backend/admin panel: not present in this monorepo workspace; implement quote/final-charge calculation and admin price-option CRUD in the backend/admin repository.
