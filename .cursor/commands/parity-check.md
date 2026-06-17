# Parity check

Verify worker-app and customer-app foundational alignment for the current change.

1. Read `docs/architecture/parity-rules.md` (checklist section)
2. Identify if the change touches foundational areas: http, auth, storage, types, toast, contexts
3. If yes, compare equivalent files in both apps (diff mentally or with git)
4. Run `npm run verify:all`

Report:
- Files that must stay parallel
- Any intentional single-app exception and why
- Verify command result

Reference: `.cursor/rules/worker-customer-parity.mdc`
