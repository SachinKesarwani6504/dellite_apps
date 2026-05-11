# Wiki Maintenance & Update Guidelines

## Overview

This document explains how to keep the documentation wiki current as the Dellite app evolves.

## Automatic Triggers for Doc Updates

### When Adding a New Screen

**Files to Update**:
- `docs/architecture/monorepo-structure.md` - Add screen to relevant section
- `docs/flows/[flow-name].md` - Update flow if part of existing flow
- `docs/prompts/index.md` - Update templates if introducing new pattern

**Checklist**:
- [ ] Screen documented in structure
- [ ] Controller hook documented
- [ ] Related context referenced
- [ ] Parity status noted (if both apps)

### When Adding API Integration

**Files to Update**:
- `docs/apis/index.md` - New endpoint/action documented
- `docs/types/api.ts` reference in `docs/architecture/type-system.md`
- `docs/flows/[flow-name].md` - If part of existing flow

**Checklist**:
- [ ] Endpoint URL documented
- [ ] Request/response types documented
- [ ] Error handling examples included
- [ ] Parity status (identical in both apps?)

### When Changing Auth Flow

**Files to Update**:
- `docs/flows/auth-flow.md` - Update sequence diagram and steps
- `docs/state-management/index.md` - Update AuthContext section
- `docs/firebase/index.md` - If Firebase auth changes
- `AGENTS.md` - If token rules change (requires PR review)

**Checklist**:
- [ ] Sequence diagram updated
- [ ] Step-by-step walkthrough accurate
- [ ] Token management rules reflect changes
- [ ] Both apps documented identically (if parity required)

### When Changing Navigation Structure

**Files to Update**:
- `docs/architecture/monorepo-structure.md` - Navigator structure
- `docs/flows/index.md` - Add new flow diagram if new path
- `docs/architecture/type-system.md` - Update screen-names.ts types

**Checklist**:
- [ ] Screen names documented
- [ ] Flow diagrams show new routes
- [ ] Navigation props documented

### When Adding Firebase Feature

**Files to Update**:
- `docs/firebase/index.md` - New service documented
- `docs/deployment/index.md` - Firebase config per environment
- `.env` files updated in repo

**Checklist**:
- [ ] Firebase service documented with code example
- [ ] Environment variables listed
- [ ] Integration with existing features shown
- [ ] Parity verified (if both apps)

### When Modifying State/Context Structure

**Files to Update**:
- `docs/state-management/index.md` - New context documented
- `docs/architecture/context-hook-architecture.md` - If pattern changes
- `docs/prompts/index.md` - Template updated

**Checklist**:
- [ ] Context file structure shown
- [ ] Controller hook structure shown
- [ ] State shape documented
- [ ] Example usage provided
- [ ] Both apps documented identically (if parity)

### When Adding Environment/Config

**Files to Update**:
- `docs/deployment/index.md` - Environment variables section
- `docs/firebase/index.md` - Firebase config if applicable
- `.env.example` file in repo

**Checklist**:
- [ ] Variable name documented
- [ ] Purpose explained
- [ ] Example value provided
- [ ] Security considerations noted

## Weekly Documentation Checklist

Every Friday (or before PR submission):

- [ ] Run `npm run verify:all` and ensure docs match code
- [ ] Check for new files not in structure docs
- [ ] Verify Parity docs are accurate (Worker ↔ Customer)
- [ ] Review recent commits for undocumented changes
- [ ] Update `docs/index.md` if new section added
- [ ] Check for broken links in docs

## Template for Adding New Documentation

When creating a new doc file:

```markdown
# [Title]

## Overview

[Brief description]

## Structure

[Folder structure or organization]

## Implementation

[Code examples, step-by-step]

## Related Documentation

- [Link 1](path/to/doc.md)
- [Link 2](path/to/doc.md)

## Checklist

- [ ] Code examples accurate
- [ ] Links working
- [ ] Aligns with AGENTS.md
- [ ] Updated docs/index.md
```

## Documentation Standards

### Code Examples
- Must be accurate and runnable
- Include full file path: `src/screens/LoginScreen.tsx`
- Show both ✅ correct and ❌ incorrect patterns where helpful
- Use syntax highlighting: \`\`\`typescript

### Links
- Use relative paths: `../flows/auth-flow.md`
- Always link from specific section to related docs
- Update index.md when adding new top-level docs

### Diagrams
- Use Mermaid for flows: \`\`\`mermaid
- Include diagram title
- Keep diagrams focused (one concept per diagram)

### Types and Code
- Reference actual file paths: `src/types/api.ts`
- Link to type definitions: `See [api.ts](../../src/types/api.ts)`
- Include interface definitions in docs

## Handling Documentation Drift

### Monthly Review

1. Check for new files not documented:
   ```bash
   find apps/worker-app/src -type f -name "*.tsx" | grep -v "__tests__"
   ```

2. Compare with `docs/architecture/monorepo-structure.md`

3. Update docs if new screens/features added

### Quarterly Refactoring

1. Review all links for accuracy
2. Update examples with latest patterns
3. Remove outdated docs
4. Archive old ADRs if superseded

## Documentation Automation

### CI Checks

Add to GitHub Actions (`.github/workflows/docs-check.yml`):

```yaml
- name: Verify docs are updated
  run: |
    # Check if docs/index.md exists
    test -f docs/index.md
    
    # Check for broken links (optional)
    npm run docs:check-links
    
    # Verify AGENTS.md linked
    grep -r "AGENTS.md" docs/ || echo "Warning: No AGENTS.md reference"
```

### Pre-Commit Hook

Suggested `pre-commit` hook:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# If AGENTS.md changed, verify docs are updated
if git diff --cached --name-only | grep -q "AGENTS.md"; then
  echo "AGENTS.md changed - ensure docs/index.md and related docs are updated"
fi
```

## Quick Links for Maintenance

- **Main Index**: [docs/index.md](index.md)
- **Architecture**: [docs/architecture/index.md](architecture/index.md)
- **Flows**: [docs/flows/index.md](flows/index.md)
- **Decisions**: [docs/decisions/index.md](decisions/index.md)
- **Coding Contract**: [AGENTS.md](/AGENTS.md)

## Common Update Scenarios

### Scenario: New worker-specific screen

1. Create screen file: `apps/worker-app/src/screens/[feature]/[ScreenName].tsx`
2. Create controller: `apps/worker-app/src/hooks/use[ScreenName]Controller.ts`
3. Update docs:
   - Add to `docs/architecture/monorepo-structure.md` under worker-app/src/screens
   - If new flow, create `docs/flows/[new-flow].md`
   - Update `docs/index.md` with new flow link

### Scenario: Customer and Worker both need same API

1. Add to both `src/actions/[feature]Actions.ts`
2. Add types to both `src/types/api.ts`
3. Update `docs/apis/index.md` with endpoint
4. Verify parity before commit: `diff apps/worker-app/src/actions... apps/customer-app/src/actions...`
5. Add to PR: "Parity: Added XXX to both apps"

### Scenario: Auth flow changes

1. Update code in both apps
2. Update `docs/flows/auth-flow.md`:
   - Update sequence diagram
   - Update step-by-step
   - Update token rules if changed
3. Update `docs/state-management/index.md` if context changed
4. Update `AGENTS.md` section 3 if token rules changed (requires discussion)

### Scenario: Adding Firebase feature

1. Add service in both `src/lib/firebase/`
2. Update `docs/firebase/index.md`:
   - Add to "Directory Structure"
   - Add usage example
   - Add environment variables
3. Update `docs/deployment/index.md` with env variables
4. Create `.env.example` with new variables

## Documentation Review Checklist (For PRs)

Before merging, reviewer should verify:

- [ ] Code changes match documentation
- [ ] New features documented
- [ ] Examples are accurate
- [ ] Links are not broken
- [ ] Parity maintained (if applicable)
- [ ] `docs/index.md` updated if new doc section added
- [ ] No hardcoded paths in docs
- [ ] Aligns with AGENTS.md standards

## Troubleshooting

### Docs out of sync with code

Run:
```bash
# Find recent changes
git log --oneline -20 -- "apps/**/*.ts" "apps/**/*.tsx"

# Compare with docs timestamps
ls -lt docs/**/*.md | head -20
```

Then update relevant docs.

### Broken links in docs

Use grep to find:
```bash
grep -r "\[.*\](.*)" docs/ | grep -v "http" | grep -v "/AGENTS.md"
```

Then test links manually or add CI check.

### Outdated examples

Search for old patterns:
```bash
grep -r "useState<User>" docs/  # Find outdated patterns
grep -r "❌ Bad" docs/         # Find anti-patterns that may be outdated
```

Then update with current best practices.

## Getting Help

- **Question**: Check `docs/index.md` cross-references
- **Lost**: Start at [docs/index.md](index.md)
- **Coding Standard**: Reference [AGENTS.md](/AGENTS.md)
- **Decision Context**: Review [docs/decisions/](decisions/index.md)

---

**Maintained By**: Development Team  
**Last Updated**: 2024  
**Review Frequency**: Monthly
