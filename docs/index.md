# Main Documentation Index

Welcome to the Dellite Docs wiki! This is the single source of truth for understanding and contributing to the Dellite monorepo.

## 📚 Documentation Sections

### Architecture & Design
- **[Architecture Overview](/docs/architecture/index.md)** - How the apps are organized
  - [Monorepo Structure](/docs/architecture/monorepo-structure.md) - Folder hierarchy
  - [Context + Hook Pattern](/docs/architecture/context-hook-architecture.md) - State management design
  - [Type System](/docs/architecture/type-system.md) - Where types live
  - [Screen Purity](/docs/architecture/screen-purity.md) - Keep screens presentational
  - [Parity Rules](/docs/architecture/parity-rules.md) - Keep both apps in sync

### Development Guides
- **[State Management](/docs/state-management/index.md)** - Context API + custom hooks
- **[APIs & HTTP Client](/docs/apis/index.md)** - How to make backend calls
- **[UI Components & Theming](/docs/ui/index.md)** - Buttons, forms, styling, NativeWind
- **[Firebase Integration](/docs/firebase/index.md)** - Auth, analytics, storage, messaging

### User Flows
- **[Flows](/docs/flows/index.md)** - Main user journeys
  - [Authentication Flow](/docs/flows/auth-flow.md) - Login, logout, token refresh
  - [Booking Flow](/docs/flows/booking-flow.md) - Customer: browse → book → confirm
  - *Add more flows as needed*

### Deployment & DevOps
- **[Deployment Guide](/docs/deployment/index.md)** - Build, release, rollback

### Decision Records
- **[Architecture Decisions](/docs/decisions/index.md)** - Why we chose certain patterns
  - [ADR 001: Context + Hook Pattern](/docs/decisions/adr-001-context-hook-pattern.md)
  - [ADR 002: Monorepo Structure](/docs/decisions/adr-002-monorepo-structure.md)
  - [ADR 003: Strict Type Placement](/docs/decisions/adr-003-strict-type-placement.md)
  - [ADR 004: HTTP Client](/docs/decisions/adr-004-http-client.md)

### AI Coding Standards
- **[Prompts & Standards](/docs/prompts/index.md)** - Reusable prompts, templates, checklists

## 🚀 Quick Start

### First Time Setup

1. **Read**: [Architecture Overview](/docs/architecture/index.md)
2. **Read**: [Monorepo Structure](/docs/architecture/monorepo-structure.md)
3. **Understand**: [Context + Hook Pattern](/docs/architecture/context-hook-architecture.md)
4. **Reference**: [AGENTS.md](/AGENTS.md) - Coding contract

### Adding a New Feature

1. **New Screen?** → [Prompts: When Adding a New Screen](/docs/prompts/index.md#when-adding-a-new-screen)
2. **New API?** → [Prompts: When Adding an API Endpoint](/docs/prompts/index.md#when-adding-an-api-endpoint)
3. **New State?** → [Prompts: When Adding Context State](/docs/prompts/index.md#when-adding-context-state)
4. **Changing Types?** → [Prompts: When Changing Types](/docs/prompts/index.md#when-changing-types)

### Worker vs Customer Parity

- Both apps must be identical in: HTTP client, API types, auth flow
- Use [Parity Rules](/docs/architecture/parity-rules.md) to verify
- Run `npm run verify:all` before submitting PR

## 📖 How to Use These Docs

### For AI Coding Assistants

- Reference specific doc paths when prompting
- Example: "Follow /docs/architecture/screen-purity.md for structure"
- Use [Prompts & Standards](/docs/prompts/index.md) for reusable templates

### For Developers

- Search for your use case (e.g., "how do I add a new screen?")
- Follow the patterns and examples in the relevant doc
- Reference [AGENTS.md](/AGENTS.md) for coding rules

### For Code Review

- Check against [Screen Purity](/docs/architecture/screen-purity.md)
- Verify [Parity Rules](/docs/architecture/parity-rules.md) for foundational changes
- Use [Prompts](/docs/prompts/index.md) checklist

## 🔄 Keeping Docs Updated

**When you...**

| Action | Update Doc |
|--------|-----------|
| Add new screen | [Monorepo Structure](/docs/architecture/monorepo-structure.md) |
| Add API endpoint | [APIs doc](/docs/apis/index.md) |
| Change auth flow | [Auth Flow](/docs/flows/auth-flow.md) |
| Change routing | [Flows](/docs/flows/index.md) |
| Add Firebase feature | [Firebase](/docs/firebase/index.md) |
| Add context state | [State Management](/docs/state-management/index.md) |
| Change deployment | [Deployment](/docs/deployment/index.md) |
| Make architecture decision | [Decisions](/docs/decisions/index.md) |

## 🔗 Cross-References

**By Component Type**:
- Screens → See [Architecture](/docs/architecture/index.md) + [Screen Purity](/docs/architecture/screen-purity.md)
- Hooks → See [State Management](/docs/state-management/index.md)
- APIs → See [APIs](/docs/apis/index.md) + [Auth Flow](/docs/flows/auth-flow.md)
- Contexts → See [Context + Hook Pattern](/docs/architecture/context-hook-architecture.md)
- Types → See [Type System](/docs/architecture/type-system.md)
- Components → See [UI](/docs/ui/index.md)

**By Topic**:
- Authentication → [Auth Flow](/docs/flows/auth-flow.md) + [Firebase](/docs/firebase/index.md)
- Booking (Customer) → [Booking Flow](/docs/flows/booking-flow.md)
- Testing → See [Prompts](/docs/prompts/index.md)
- Worker/Customer Sync → [Parity Rules](/docs/architecture/parity-rules.md)

## 📊 Documentation Map

```
docs/
├── architecture/           # Design & principles
│   ├── index.md           # Overview
│   ├── monorepo-structure.md
│   ├── context-hook-architecture.md
│   ├── type-system.md
│   ├── screen-purity.md
│   └── parity-rules.md
├── state-management/      # State & contexts
│   └── index.md
├── apis/                  # Backend integration
│   └── index.md
├── ui/                    # Components & styling
│   └── index.md
├── flows/                 # User journeys
│   ├── index.md
│   ├── auth-flow.md
│   └── booking-flow.md
├── firebase/              # Firebase services
│   └── index.md
├── deployment/            # Build & release
│   └── index.md
├── decisions/             # Architecture decisions
│   ├── index.md
│   ├── adr-001-context-hook-pattern.md
│   ├── adr-002-monorepo-structure.md
│   ├── adr-003-strict-type-placement.md
│   └── adr-004-http-client.md
├── prompts/               # AI coding standards
│   └── index.md
└── index.md              # This file
```

## 🤝 Contributing to Docs

1. Keep docs concise and AI-readable
2. Use examples and code snippets
3. Link to related docs
4. Update this index when adding new docs
5. Include Mermaid diagrams for flows/architectures
6. Reference [AGENTS.md](/AGENTS.md) for standards

## ✅ Quality Checklist

Before submitting documentation:

- [ ] Code examples are accurate and runnable
- [ ] Links to other docs are correct
- [ ] No hardcoded paths (use relative paths)
- [ ] Includes relevant Mermaid diagrams
- [ ] Explains "why" not just "how"
- [ ] Aligns with [AGENTS.md](/AGENTS.md)
- [ ] Updated main index.md if adding new doc

## 💡 Useful Commands

```bash
# Verify code quality
npm run verify:all

# Lint repository
npm run lint:repo

# Typecheck both apps
npm run typecheck:worker
npm run typecheck:customer

# Start dev server
cd apps/worker-app && npm run ios
cd apps/customer-app && npm run ios
```

## 📞 Need Help?

- Check [Prompts](/docs/prompts/index.md) for common tasks
- Search this docs folder for keywords
- Reference [AGENTS.md](/AGENTS.md) for rules
- Review relevant ADRs for design decisions

---

**Last Updated**: 2024
**Version**: 1.0
