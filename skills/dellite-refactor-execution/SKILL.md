---
name: dellite-refactor-execution
description: Use when implementing medium or large refactors in the Dellite monorepo that need safe sequencing, minimal regressions, scalable architecture decisions, and strict verification. Trigger for context split changes, navigation flow rewrites, shared type migration, and foundational cleanup.
---

# Dellite Refactor Execution

Use this workflow for non-trivial refactors.

## Execution Sequence

1. Map impact surface with targeted search.
2. Define write-set and keep changes scoped.
3. Implement architecture updates in source-of-truth modules first.
4. Update call sites and navigators.
5. Remove dead code and stale types.
6. Run typechecks and fix all breakages.
7. Update sync/progress docs when foundational.

## Guardrails

- Avoid partial architecture splits; complete provider wiring end-to-end.
- Keep onboarding navigation ownership in onboarding context.
- Keep auth/session ownership in auth context.
- Do not leave stale wrappers or duplicate helper paths.
- Prefer backwards-compatible type transitions unless removal is requested.

## Regression Controls

- Re-scan for old symbols after edits (`rg -n`).
- Verify no orphaned files remain for removed features.
- Verify route names and param types are aligned.
- Verify no unused imports/hooks remain.

## Completion Output

Report:

1. Files changed and why.
2. What was removed.
3. Verification commands run and status.
4. Any remaining risk and next action.
