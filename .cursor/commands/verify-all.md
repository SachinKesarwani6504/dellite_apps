# Verify all

Run full quality gate for the monorepo:

```bash
npm run verify:all
```

This runs repo lint plus worker and customer TypeScript checks.

If failures occur, fix issues in changed files and re-run until green. Report a short summary of what failed and what was fixed.

For worker-only or customer-only work, use `npm run verify:worker` or `npm run verify:customer` instead.

Reference: `.cursor/skills/dellite-verify/SKILL.md`
