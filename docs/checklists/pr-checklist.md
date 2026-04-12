# PR Checklist

Use this checklist before opening or merging a PR.

- [ ] Scope is clear and limited to the intended change.
- [ ] Foundational changes are mirrored in both `apps/worker-app` and `apps/customer-app` when required.
- [ ] Naming conventions are followed (components/screens PascalCase, contexts/hooks standards).
- [ ] No forbidden wrapper hooks were introduced (example: `src/hooks/useAuth.ts`).
- [ ] `npm run lint:repo` passes.
- [ ] `npm run typecheck:worker` passes.
- [ ] `npm run typecheck:customer` passes.
- [ ] `npm run verify:all` passes.
- [ ] `docs/mono-sync-plan.md` updated for significant foundational/parity work.
