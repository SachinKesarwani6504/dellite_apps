# Architecture Decision Records

## What is an ADR?

An Architecture Decision Record (ADR) documents important architectural decisions made on the project, including:
- **What** was decided
- **Why** it was decided (context)
- **Alternatives** considered
- **Consequences** of the decision

## ADR Format

```markdown
# ADR [NUMBER]: [Title]

**Status**: Proposed | Accepted | Deprecated | Superseded

## Context

[Problem statement, background, constraints]

## Decision

[What we decided to do]

## Rationale

[Why this decision makes sense]

## Alternatives Considered

- [Alternative 1]: [Pros/cons]
- [Alternative 2]: [Pros/cons]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Drawback 1]
- [Drawback 2]

## Related ADRs

- [ADR X](adr-x.md)
```

## Active ADRs

### ADR 001: Context + Hook Architecture Pattern

**Status**: Accepted

**Decision**: Use thin Context + fat useXxxController hooks for state management

**Rationale**: 
- Separates concerns (context = provider, hook = logic)
- Makes testing easier (test hook in isolation)
- Prevents bloated context files
- Screens stay presentational

**File**: [adr-001-context-hook-pattern.md](adr-001-context-hook-pattern.md)

---

### ADR 002: Monorepo Structure (Worker + Customer)

**Status**: Accepted

**Decision**: Maintain parallel worker-app and customer-app with shared packages/app-core

**Rationale**:
- Different use cases require different UIs
- Shared business logic in packages/
- Easier to manage role-specific features
- CI ensures parity on foundational code

**File**: [adr-002-monorepo-structure.md](adr-002-monorepo-structure.md)

---

### ADR 003: Strict Type Placement

**Status**: Accepted

**Decision**: All types in `src/types/*`, never in screens/components/hooks

**Rationale**:
- Single source of truth for types
- Prevents circular imports
- Easier to find and update types
- Supports backend contract changes

**File**: [adr-003-strict-type-placement.md](adr-003-strict-type-placement.md)

---

### ADR 004: HTTP Client Standardization

**Status**: Accepted

**Decision**: Use consistent HTTP helpers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`)

**Rationale**:
- Consistent error handling
- Centralized token management
- Easier to implement token refresh
- Must be identical in both apps (parity)

**File**: [adr-004-http-client.md](adr-004-http-client.md)

---

### ADR 005: NativeWind for Styling

**Status**: Accepted

**Decision**: Use NativeWind (Tailwind CSS for React Native) for styling

**Rationale**:
- Consistent styling across apps
- Familiar to web developers
- Utility-first approach
- Easy dark mode support

**File**: [adr-005-nativewind-styling.md](adr-005-nativewind-styling.md)

---

## Creating a New ADR

1. Create `docs/decisions/adr-[number]-[title].md`
2. Use the ADR format above
3. Discuss with team before marking as "Accepted"
4. Update this index.md with summary
5. Link from related architecture docs

## Related Documentation

- **Architecture**: [/docs/architecture](/docs/architecture/index.md)
- **AGENTS.md**: [Coding contract](/AGENTS.md)
- **Prompts**: [AI coding standards](/docs/prompts/index.md)
