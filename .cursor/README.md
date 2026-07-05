# Cursor configuration (Dellite monorepo)

This folder configures Cursor Agent for this repo. It is **editor/agent config**, not user-facing product docs.

| Path | Purpose |
|------|---------|
| [`docs/WIKI_MAP.md`](docs/WIKI_MAP.md) | **Start here** — token-efficient map to `docs/` wiki |
| [`rules/`](rules/) | Project rules (`.mdc`, version-controlled) |
| [`skills/`](skills/) | Agent Skills (workflows, checklists) |
| [`commands/`](commands/) | Slash commands (`/` in Agent chat) |

## Human wiki vs agent index

- **`docs/`** — full project wiki (architecture, flows, ADRs). Maintained for humans and deep dives.
- **`.cursor/docs/WIKI_MAP.md`** — compact routing table so agents load **only** the doc files needed for a task.

Do not duplicate long content from `docs/` inside `.cursor/`. Link instead.

## Standards (Cursor 2.4+)

- Rules: `.cursor/rules/*.mdc` with YAML frontmatter (`description`, `globs`, `alwaysApply`)
- Skills: `.cursor/skills/<name>/SKILL.md` with `name` + `description` frontmatter
- Commands: `.cursor/commands/*.md` (plain markdown, no frontmatter)
- Coding contract: root [`AGENTS.md`](../AGENTS.md) remains source of truth

## Maintenance

When you add a major doc section or feature area, update:

1. `docs/index.md`
2. `.cursor/docs/WIKI_MAP.md`
3. Relevant skill/command if it changes a standard workflow

See [`docs/WIKI_MAINTENANCE.md`](../docs/WIKI_MAINTENANCE.md).
