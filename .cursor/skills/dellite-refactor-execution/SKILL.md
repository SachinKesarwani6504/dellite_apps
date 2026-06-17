---
name: dellite-refactor-execution
description: >-
  Safe sequencing for medium/large Dellite refactors: context splits, navigation
  rewrites, shared type migration, foundational cleanup. Use when the change spans
  multiple modules, apps, or architectural layers.
disable-model-invocation: true
---

# Dellite refactor execution

## Sequence

1. Map impact with targeted search (symbols, routes, types).
2. Define write-set; keep scope minimal.
3. Change source-of-truth modules first (`types`, `actions`, `utils`).
4. Update call sites, navigators, contexts.
5. Remove dead code, stale types, orphaned files.
6. Run typechecks; fix all breakages.
7. Update `docs/mono-sync-plan.md` and wiki map if architecture changed.

## Guardrails

- Complete provider wiring end-to-end — no partial context splits.
- Auth/session → auth context; onboarding routes → onboarding context.
- No stale wrapper hooks or duplicate helper paths.
- Re-scan for old symbols after edits (`rg`).

## Output

Report: files changed, what was removed, verification run, remaining risks.

## Reference

`.cursor/docs/WIKI_MAP.md` · `docs/architecture/context-hook-architecture.md`
