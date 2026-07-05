---
name: dellite-monorepo-defaults
description: >-
  Enforces Dellite monorepo conventions for worker-app and customer-app: AGENTS.md
  contract, context-hook architecture, worker/customer parity on foundational files,
  type placement, and verify:typecheck gates. Use for any implementation task in this
  repo unless explicitly scoped to one app UI only.
---

# Dellite monorepo defaults

## Start

1. Read `.cursor/docs/WIKI_MAP.md` — load only relevant `docs/` paths.
2. Follow root `AGENTS.md` for full contract.

## Structure

- Shared code → `packages/app-core` when truly shared.
- Contexts thin (`src/contexts/*`); logic in `src/hooks/use*Controller.ts`.
- Types in `src/types/*` only. Helpers in `src/utils/*` via `index.ts`.
- Equivalent foundational files stay parallel between worker and customer apps.

## Token efficiency

- Prefer targeted file reads over repo-wide search.
- Do not paste large wiki sections into chat — link paths.
- Implement first; avoid long planning unless blocked.

## Before done

```bash
npm run typecheck:worker
npm run typecheck:customer   # when parity or shared types touched
npm run verify:all           # before merge-quality completion
```

Update `docs/mono-sync-plan.md` after significant foundational parity phases.

## Deeper reference

- Parity: `docs/architecture/parity-rules.md`
- Screen purity: `docs/architecture/screen-purity.md`
- Prompts/templates: `docs/prompts/index.md`
