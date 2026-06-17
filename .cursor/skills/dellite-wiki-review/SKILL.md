---
name: dellite-wiki-review
description: >-
  Reviews or onboards to the Dellite project using the docs wiki instead of broad
  codebase exploration. Use when the user asks to understand the project, review
  architecture, find where something lives, or reduce context/token usage before coding.
disable-model-invocation: true
---

# Dellite wiki review

Review the project through documentation first, then open code only for the target area.

## Workflow

1. Read `.cursor/docs/WIKI_MAP.md`.
2. Load **one** primary doc from `docs/` for the user's topic (see map table).
3. Open **at most 2–4** source files to confirm current implementation.
4. Answer with doc paths cited; avoid dumping full file contents.

## Topic routing

| Question | Primary doc |
|----------|-------------|
| Repo layout | `docs/architecture/monorepo-structure.md` |
| How auth works | `docs/flows/auth-flow.md` |
| How booking works | `docs/flows/booking-flow.md` |
| State/context pattern | `docs/architecture/context-hook-architecture.md` |
| API/http patterns | `docs/apis/index.md` |
| Coding rules | `AGENTS.md` |
| Why a pattern exists | `docs/decisions/index.md` (pick one ADR) |

## Anti-patterns

- Do not read entire `apps/*/src` trees for overview questions.
- Do not duplicate wiki content in the response — summarize and link.
- Do not load `docs/README.md` when `WIKI_MAP.md` suffices.

## Optional deep dive

See [references/TOPIC_INDEX.md](references/TOPIC_INDEX.md) for full doc tree.
