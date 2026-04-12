---
name: dellite-monorepo-defaults
description: Use for any coding task in the Dellite monorepo (apps/worker-app, apps/customer-app) when Codex should enforce repo conventions automatically: parallel foundational changes across both apps, strict context-and-hook structure, naming consistency, AGENTS.md contract adherence, docs/mono-sync-plan.md updates after major phases, and mandatory worker/customer typecheck gates before completion.
---

# Dellite Monorepo Defaults

Treat this skill as the default operating contract for Dellite repo work.

## Enforce Structure

- Keep shared fundamentals in `packages/app-core` where feasible.
- Keep app-specific UI and feature logic inside each app.
- Keep equivalent foundational files and naming parallel between worker and customer apps.
- Keep context files only under `src/contexts/*` and hooks only under `src/hooks/*`.
- Prefer direct context hooks (`useAuthContext`, `useOnboardingContext`) over wrapper aliases.
- Keep context files thin (provider + context hook only); move business logic/state effects into hook controllers.

## Enforce Fundamental Parity

When a change touches foundational areas, mirror it in both apps in the same implementation phase unless explicitly scoped otherwise:

- auth/session flow
- onboarding route logic
- HTTP client/request option contracts
- key-chain storage primitives
- shared foundational types
- toast utility behavior

If a foundational change is intentionally app-specific, state the reason explicitly.

## Token-Efficient Working Pattern

- Read only files needed for the requested change.
- Avoid broad scans when a narrow path is known.
- Keep interim notes short and actionable.
- Implement first; avoid long speculative planning unless blocked.

## Delivery Checklist

Before final response:

1. Confirm worker app typecheck passes.
2. Confirm customer app typecheck passes when parity changes are made or impacted.
3. Update `docs/mono-sync-plan.md` for significant parity/foundation phases.
4. List assumptions and any intentional non-parity exceptions.

## Commands

- Worker typecheck: `npm run typecheck:worker`
- Customer typecheck: `node ./node_modules/typescript/bin/tsc --project apps/customer-app/tsconfig.json --noEmit`
