# Refactor Checklist

Use for medium/large refactors before finalizing.

- [ ] Impact surface mapped with targeted search.
- [ ] Source-of-truth modules updated first (contexts/controllers/types).
- [ ] Call sites and navigation updated to new contracts.
- [ ] Dead code, stale types, and stale imports removed.
- [ ] Removed symbols are confirmed absent via `rg -n`.
- [ ] Onboarding ownership remains in onboarding context.
- [ ] Auth/session ownership remains in auth context.
- [ ] Worker/customer foundational parity validated.
- [ ] `npm run verify:all` passes.
