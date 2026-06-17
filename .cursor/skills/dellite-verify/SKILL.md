---
name: dellite-verify
description: >-
  Runs Dellite quality gates and reports results: lint, typecheck, and full verify
  for worker and customer apps. Use before marking work complete, after refactors, or
  when the user asks to verify the repo.
disable-model-invocation: true
---

# Dellite verify

## Commands

| Scope | Command |
|-------|---------|
| Full gate | `npm run verify:all` |
| Worker only | `npm run verify:worker` |
| Customer only | `npm run verify:customer` |
| Lint repo | `npm run lint:repo` |
| Typecheck worker | `npm run typecheck:worker` |
| Typecheck customer | `npm run typecheck:customer` |

## Workflow

1. Pick the narrowest command that covers the changed apps.
2. Run it in the repo root (`dellite_apps/`).
3. If failures: fix, re-run, report pass/fail with error summary.

## When parity changed

Always run `npm run verify:all` before completion.
