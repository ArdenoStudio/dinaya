# Ultra Skills — AI-Native Development Review Pack

The most comprehensive AI cursor skills collection for building software with Apple-quality craft, startup discipline, and engineering rigor.

## What's included

22 specialized AI personas + 1 skill router + 1 parallel task runner:

### Executive Review Layer

| Skill | Role | Use when... |
|-------|------|-------------|
| ultra-ceo | Startup CEO | Strategy, focus, say-no, beachhead market |
| ultra-cpo | Chief Product Officer | Feature priority, MVP scope, plan-tier placement |
| ultra-cto | CTO | Architecture, schema, boundaries, tech debt |
| ultra-cfo | CFO | Unit economics, pricing, variable cost coverage |

### Go-to-Market Layer

| Skill | Role | Use when... |
|-------|------|-------------|
| ultra-head-of-growth | Head of Growth | GTM, density strategy, launch waves, proof loops |
| ultra-head-of-sales | Head of Sales | Outreach scripts, objection handling, close patterns |

### Design & Brand Layer

| Skill | Role | Use when... |
|-------|------|-------------|
| apple-design-head | Head of Apple Design | UI/UX ship review, accessibility, visual craft |
| ultra-visual-system | Visual Design Lead | Design tokens, palette, typography, dark mode |
| ultra-brand-voice | Brand Voice Guardian | Copy audit, positioning, banned phrases, tone |
| ultra-content-review | Content Lead | Multi-channel content alignment |

### Engineering Layer

| Skill | Role | Use when... |
|-------|------|-------------|
| ultra-scheduling-engine | Scheduling Engineer | Slots, holds, timezone, booking flows |
| ultra-payments | Payments Engineer | Gateway integration, webhooks, checkout |
| ultra-messaging | Messaging Engineer | Notifications, templates, multi-channel |
| ultra-migrations | Database Engineer | Schema changes, migrations, backfills |
| ultra-api-auth | API Auth Engineer | Route auth, scopes, validation |
| ultra-plan-gating | Entitlements Engineer | Subscription tiers, feature gates |
| ultra-security-review | Security Lead | Auth audit, secrets, compliance, webhooks |
| ultra-pr-ship-review | Engineering Lead | PR merge gate, verify, conventions |
| ultra-events | Events Engineer | Ticketing, capacity, event commerce |
| ultra-integrations | Integration Engineer | Third-party APIs, scope-locked access |

### Infrastructure

| Skill | Role | Use when... |
|-------|------|-------------|
| ultra-hub | Skill Router | "Which skill should I use?" |
| dag-task-runner | Task Orchestrator | Parallel subagent execution |

## Installation

1. Copy all skill folders into your project's `.cursor/skills/` directory
2. Fill in the `_shared/` template files with your project's specifics
3. Start using skills by mentioning their trigger phrases

## Setup: _shared/ templates

Before using Ultra Skills, fill in these files with YOUR project's details:

- `_shared/BRAND.md` — Your brand voice, CTAs, banned phrases, objection table
- `_shared/PRODUCT.md` — Your product pillars, plan tiers, feature labels
- `_shared/COMPETITORS.md` — Your competitive landscape
- `_shared/STACK.md` — Your tech stack, verify commands, boundaries
- `_shared/PATHS.md` — Your route map, API prefixes, auth patterns
- `_shared/VISUAL.md` — Your design tokens, palette, typography

## The Review Protocol

Every review skill uses a consistent 5-round weighted scoring system:

- **Rounds 0–4**: Domain-specific checks with weighted scores (sum to 100%)
- **Severity**: P0 (blocker) / P1 (iterate) / P2 (polish) / P3 (nit)
- **Grades**: A (93+) / A- (85+) / B (75+) / C (60+) / D (<60)
- **Verdicts**: SHIP (≥85, 0 P0, ≤2 P1) / ITERATE / REJECT
- **Finding format**: Severity → Location → Principle → Measure → Fix → Effort

## License

MIT
