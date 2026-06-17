# Wiki map (agent index)

Use this file to route to `docs/` without scanning the repo. Read **only** the paths relevant to the current task.

**Contract**: [`AGENTS.md`](../../AGENTS.md)  
**Full index**: [`docs/index.md`](../../docs/index.md)

## By task

| Task | Read first | Then if needed |
|------|------------|----------------|
| New screen / UI feature | `docs/architecture/screen-purity.md` | `docs/prompts/index.md`, `docs/architecture/monorepo-structure.md` |
| New API / HTTP change | `docs/apis/index.md` | `docs/architecture/parity-rules.md`, `docs/decisions/adr-004-http-client.md` |
| Auth / tokens / OTP | `docs/flows/auth-flow.md` | `docs/state-management/index.md`, `AGENTS.md` §3–4 |
| Booking (customer) | `docs/flows/booking-flow.md` | `apps/customer-app/docs/booking-payment-flow.md` |
| Booking / jobs (worker) | `docs/flows/booking-flow.md` | `apps/worker-app/docs/booking-payment-flow.md` |
| Context / hooks | `docs/architecture/context-hook-architecture.md` | `docs/decisions/adr-001-context-hook-pattern.md` |
| Types / API shapes | `docs/architecture/type-system.md` | `docs/decisions/adr-003-strict-type-placement.md` |
| Worker ↔ customer parity | `docs/architecture/parity-rules.md` | `docs/mono-sync-plan.md` |
| Firebase / FCM / RTDB | `docs/firebase/index.md` | `docs/deployment/index.md` |
| UI / theme / copy | `docs/ui/index.md` | `src/utils/appText.ts` in target app |
| Earnings / settlements (worker) | `apps/worker-app/docs/` if present | worker finance types/actions under `apps/worker-app/src/` |
| PR / review | `docs/checklists/pr-checklist.md` | `AGENTS.md` §17 |
| Refactor (large) | `.cursor/skills/dellite-refactor-execution/SKILL.md` | impact map via targeted search only |

## By app

| App | Structure | App-local docs |
|-----|-----------|----------------|
| Worker | `apps/worker-app/src/` | `apps/worker-app/docs/` |
| Customer | `apps/customer-app/src/` | `apps/customer-app/docs/` |
| Shared | `packages/app-core/` | `docs/architecture/monorepo-structure.md` |

## Key folders (both apps)

```
src/screens/      → presentational only
src/hooks/        → use*Controller.ts (logic)
src/contexts/     → thin providers only
src/types/        → all app-local types
src/utils/        → helpers, appText, formatters
src/actions/      → API + httpClient
```

## Verification (before done)

```bash
npm run verify:all
```

Or app-scoped: `npm run verify:worker` / `npm run verify:customer`

## Do not load unless needed

- `docs/PROJECT_COMPLETE.md` — historical snapshot
- Full `docs/decisions/*` — only when changing the pattern they describe
- Entire `docs/README.md` — use this map instead
