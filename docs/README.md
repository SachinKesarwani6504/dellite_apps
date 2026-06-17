# 📚 Dellite Documentation Wiki

Complete production-ready documentation for the Dellite Expo React Native frontend monorepo.

## 🎯 Purpose

This wiki is designed to:
- **Reduce repeated prompting**: AI assistants get comprehensive context upfront
- **Enforce consistency**: Both apps stay aligned with shared standards
- **Enable faster development**: Developers reference patterns instead of inventing new ones
- **Support code reviews**: Reviewers check against documented standards
- **Scale the team**: New developers ramp up quickly

## 📂 Structure Overview

```
docs/
├── index.md                     ⭐ Start here - main navigation
├── WIKI_MAINTENANCE.md          How to keep docs updated
├── architecture/                Design principles & patterns
├── state-management/            Context API + custom hooks
├── apis/                        HTTP client & backend integration
├── ui/                          Components, styling, theming
├── flows/                       User journeys & sequences
├── firebase/                    Firebase services integration
├── deployment/                  Build, release, CI/CD
├── decisions/                   Architecture decision records (ADRs)
└── prompts/                     AI coding standards & templates
```

**Cursor agent config** (token-efficient routing — not a duplicate of this wiki):

```
.cursor/
├── README.md
├── docs/WIKI_MAP.md             Compact index → load only needed docs/
├── rules/                       .mdc project rules
├── skills/                      Agent Skills (SKILL.md)
└── commands/                    /review-wiki, /verify-all, /parity-check
```

## 🚀 Quick Navigation

### I Want To...

| Goal | Start Here |
|------|-----------|
| **Understand the app structure** | [Architecture Overview](/docs/architecture/index.md) |
| **Add a new screen** | [Prompts: Adding Screens](/docs/prompts/index.md) |
| **Make an API call** | [HTTP Client Guide](/docs/apis/index.md) |
| **Add state/context** | [State Management](/docs/state-management/index.md) |
| **Understand auth flow** | [Auth Flow](/docs/flows/auth-flow.md) |
| **Learn booking flow** | [Booking Flow](/docs/flows/booking-flow.md) |
| **Set up Firebase** | [Firebase Integration](/docs/firebase/index.md) |
| **Deploy the app** | [Deployment Guide](/docs/deployment/index.md) |
| **Understand design decisions** | [Architecture Decisions](/docs/decisions/index.md) |
| **Check coding standards** | [AGENTS.md](/AGENTS.md) |
| **Agent: review project (low tokens)** | [.cursor/docs/WIKI_MAP.md](/.cursor/docs/WIKI_MAP.md) |

## 📊 Key Documentation Files

### Architecture (Always Read First)

1. **[index.md](/docs/architecture/index.md)** - Architectural overview
   - Key principles
   - Layer separation
   - Links to detailed docs

2. **[monorepo-structure.md](/docs/architecture/monorepo-structure.md)** - Folder hierarchy
   - Worker app structure
   - Customer app structure
   - Naming conventions
   - Parity requirements

3. **[context-hook-architecture.md](/docs/architecture/context-hook-architecture.md)** - State management
   - Thin context pattern
   - Fat controller hooks
   - Screen consumption
   - Testing examples

4. **[type-system.md](/docs/architecture/type-system.md)** - Type placement rules
   - Where types live: `src/types/*`
   - Backend alignment
   - Hygiene rules
   - Import patterns

5. **[screen-purity.md](/docs/architecture/screen-purity.md)** - Screen best practices
   - Presentational-only screens
   - Common anti-patterns
   - Template structure
   - Validation checklist

6. **[parity-rules.md](/docs/architecture/parity-rules.md)** - Worker ↔ Customer sync
   - Files that must be identical
   - Parity workflow
   - Checking parity
   - Manual review process

### Core Implementation

- **[State Management](/docs/state-management/index.md)** - Contexts + hooks + Redux
- **[APIs](/docs/apis/index.md)** - HTTP client, endpoints, error handling
- **[UI Components](/docs/ui/index.md)** - Buttons, inputs, theming with NativeWind
- **[Firebase](/docs/firebase/index.md)** - Auth, analytics, messaging

### User Journeys

- **[Auth Flow](/docs/flows/auth-flow.md)** - Login, token refresh, logout
- **[Booking Flow](/docs/flows/booking-flow.md)** - Browse → Select → Book
- **[Flows Index](/docs/flows/index.md)** - All flows with diagrams

### Operations

- **[Deployment](/docs/deployment/index.md)** - Build, release, CI/CD
- **[Decisions (ADRs)](/docs/decisions/index.md)** - Why we chose these patterns

### Developer Tools

- **[Prompts](/docs/prompts/index.md)** - Reusable AI prompts & templates
- **[Wiki Maintenance](/docs/WIKI_MAINTENANCE.md)** - Keep docs updated

## 📖 Reading Paths

### Path 1: "I'm new, where do I start?"

1. [Architecture Overview](/docs/architecture/index.md)
2. [Monorepo Structure](/docs/architecture/monorepo-structure.md)
3. [Context + Hook Pattern](/docs/architecture/context-hook-architecture.md)
4. Your assigned feature docs

**Time**: ~30 minutes

### Path 2: "I need to add a feature"

1. [Prompts: Adding New Feature](/docs/prompts/index.md)
2. [Screen Purity](/docs/architecture/screen-purity.md)
3. [State Management](/docs/state-management/index.md)
4. [Type System](/docs/architecture/type-system.md)

**Time**: ~15 minutes (ongoing reference)

### Path 3: "I'm reviewing a PR"

1. [Screen Purity Checklist](/docs/architecture/screen-purity.md#validation-checklist)
2. [Parity Rules Checklist](/docs/architecture/parity-rules.md#parity-checklist)
3. [Type System Hygiene](/docs/architecture/type-system.md#type-hygiene-rules)

**Time**: Reference during review

### Path 4: "I want to understand architecture decisions"

1. [ADR 001: Context + Hook Pattern](/docs/decisions/adr-001-context-hook-pattern.md)
2. [ADR 002: Monorepo Structure](/docs/decisions/adr-002-monorepo-structure.md)
3. [ADR 003: Type Placement](/docs/decisions/adr-003-strict-type-placement.md)
4. [ADR 004: HTTP Client](/docs/decisions/adr-004-http-client.md)

**Time**: ~45 minutes

## 🔑 Key Concepts

### Thin Context + Fat Controller

```typescript
// Context: Just provides state
<AuthContext.Provider value={useAuthController()}>

// Hook: Has all logic
useAuthController() → {login, logout, user, isLoading, ...}

// Screen: Uses context, stays presentational
<LoginScreen> → useAuthContext() → show UI
```

### Strict Type Placement

- ✅ All types in `src/types/*`
- ❌ Never in screens, components, hooks, contexts

### Screen Purity

- ✅ Screens are presentational only
- ✅ All logic goes to controller hooks
- ✅ All helpers go to `src/utils/`

### Parity (Worker ↔ Customer)

- ✅ Both apps must have identical foundational files
- ✅ HTTP client, types, auth, storage must match
- ❌ Role-specific features are allowed (UI, screens)

## 🔗 Important Files

### Reference Standards

- **[AGENTS.md](/AGENTS.md)** - Coding contract (source of truth)
- **[mono-sync-plan.md](/docs/mono-sync-plan.md)** - Monorepo sync phases

### App Contracts

- **[apps/worker-app/AGENTS.md](/apps/worker-app/AGENTS.md)** - Worker app reference
- **[apps/customer-app/AGENTS.md](/apps/customer-app/AGENTS.md)** - Customer app reference

## ✅ Documentation Completeness

- ✅ Architecture & design patterns
- ✅ State management examples
- ✅ HTTP client & API integration
- ✅ UI components & theming
- ✅ Auth flow documented
- ✅ Booking flow documented
- ✅ Firebase integration guide
- ✅ Deployment procedures
- ✅ Architecture decisions (ADRs)
- ✅ AI coding prompts & standards
- ✅ Wiki maintenance guide

## 🤝 Contributing to Docs

### When you make changes to code

**Update docs in the same PR!**

| Code Change | Update Doc | How |
|------------|-----------|-----|
| New screen | `docs/architecture/monorepo-structure.md` | Add to folder list |
| New API | `docs/apis/index.md` | Add endpoint example |
| Auth changes | `docs/flows/auth-flow.md` | Update sequence diagram |
| New context | `docs/state-management/index.md` | Add context section |
| New flow | Create `docs/flows/[flow].md` | New file with diagram |
| Config change | `docs/deployment/index.md` | Update environment vars |

See [WIKI_MAINTENANCE.md](/docs/WIKI_MAINTENANCE.md) for detailed instructions.

## 📊 Documentation Stats

- **9 main doc folders**: architecture, state-management, apis, ui, flows, firebase, deployment, decisions, prompts
- **20+ markdown files**: Comprehensive coverage of all major topics
- **4 Architecture Decision Records**: Design rationale documented
- **Code examples**: 100+ snippets showing correct patterns
- **Flow diagrams**: 5+ Mermaid diagrams visualizing user journeys
- **Cross-references**: Extensive linking between related docs

## 🔍 Finding What You Need

### Search by Topic

```
Architecture  → /docs/architecture/
State         → /docs/state-management/
APIs          → /docs/apis/
UI            → /docs/ui/
Flows         → /docs/flows/
Firebase      → /docs/firebase/
Deployment    → /docs/deployment/
Decisions     → /docs/decisions/
Prompts       → /docs/prompts/
```

### Search by Use Case

**"How do I..."**
- Add a screen? → [Prompts](/docs/prompts/index.md) + [Screen Purity](/docs/architecture/screen-purity.md)
- Call an API? → [HTTP Client](/docs/apis/index.md) + [Flows](/docs/flows/auth-flow.md)
- Add state? → [State Management](/docs/state-management/index.md) + [Context Pattern](/docs/architecture/context-hook-architecture.md)
- Deploy? → [Deployment](/docs/deployment/index.md)

## 🎓 Best Practices

1. **Always link**: Reference related docs, not just explain
2. **Use examples**: Show ✅ correct and ❌ incorrect patterns
3. **Keep current**: Update docs when code changes
4. **Be concise**: AI-readable, not encyclopedic
5. **Visualize**: Use Mermaid diagrams for flows/sequences
6. **Align**: Reference [AGENTS.md](/AGENTS.md) consistently

## 📞 Support

- **Architecture questions**: Review [/docs/architecture/index.md](/docs/architecture/index.md)
- **Pattern templates**: Check [/docs/prompts/index.md](/docs/prompts/index.md)
- **Why decisions**: See [/docs/decisions/](/docs/decisions/index.md)
- **Coding standards**: Reference [/AGENTS.md](/AGENTS.md)
- **Maintenance**: See [/docs/WIKI_MAINTENANCE.md](/docs/WIKI_MAINTENANCE.md)

## 📈 Next Steps

### For New Contributors
1. Read [Architecture Overview](/docs/architecture/index.md)
2. Read [Monorepo Structure](/docs/architecture/monorepo-structure.md)
3. Find your assigned feature in [docs/flows/](/docs/flows/)
4. Follow templates in [Prompts](/docs/prompts/index.md)

### For Code Reviews
1. Use [Screen Purity Checklist](/docs/architecture/screen-purity.md#validation-checklist)
2. Verify [Parity Rules](/docs/architecture/parity-rules.md#parity-checklist)
3. Check [AGENTS.md](/AGENTS.md) alignment

### For Architecture Discussions
1. Review relevant [ADR](/docs/decisions/index.md)
2. Reference [Design Rationale](#parity-worker--customer-sync)
3. Propose new ADR if needed

---

**Wiki Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

### Start Exploring

👉 **[Go to Architecture Overview →](/docs/architecture/index.md)**

👉 **[Go to Main Index →](/docs/index.md)**

👉 **[View All Docs →](/docs/)**
