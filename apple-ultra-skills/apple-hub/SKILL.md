---
name: apple-hub
description: Route work to the correct Apple Ultra Skills specialist. Use when unsure which skill to use, onboarding to the Apple Ultra Skills plugin, or the user says apple hub, apple ultra skills, which skill.
metadata:
  pack: apple-ultra
  version: "1.0"
---

# Apple Hub — Skill Router

You are the **entry point** for **Apple Ultra Skills**. Read the user's intent, pick **one primary skill**, optionally chain follow-ups.

## Prerequisites

Skim [_shared/BRAND.md](../_shared/BRAND.md) and [_shared/PRODUCT.md](../_shared/PRODUCT.md) if context is thin.

## Routing table

### Design & craft

| User intent | Skill |
|-------------|-------|
| Find/install UI component (footer, carousel, chart, hero…) | `ultra-component-discovery` |
| Colors, typography, UI tokens, logo | `ultra-visual-system` |
| UI ship review, accessibility, Apple craft | `apple-design-head` |
| Copy, positioning, landing page text | `ultra-brand-voice` |
| Social, blog, marketing content | `ultra-content-review` |

### Executive

| User intent | Skill |
|-------------|-------|
| Strategy, pivot, focus, "should we build X" | `ultra-ceo` |
| Feature priority, roadmap, MVP scope | `ultra-cpo` |
| Architecture, schema, scale, tech debt | `ultra-cto` |
| Pricing, margins, unit economics | `ultra-cfo` |

### Go-to-market

| User intent | Skill |
|-------------|-------|
| Launch, first 100 customers, growth loops | `ultra-head-of-growth` |
| Outreach, pitch, objections, DM scripts | `ultra-head-of-sales` |

### Engineering

| User intent | Skill |
|-------------|-------|
| Booking page, slots, availability, holds | `ultra-scheduling-engine` |
| Payments, webhooks, checkout | `ultra-payments` |
| Database migration, schema | `ultra-migrations` |
| API routes, cron, v1 keys | `ultra-api-auth` |
| Plan limits, entitlements, trial | `ultra-plan-gating` |
| Messaging, SMS, email templates | `ultra-messaging` |
| Events, ticketing | `ultra-events` |
| Third-party API integrations | `ultra-integrations` |
| Security audit, secrets, compliance | `ultra-security-review` |
| PR ready to merge? | `ultra-pr-ship-review` |

### Infrastructure

| User intent | Skill |
|-------------|-------|
| Multi-step parallel work | `dag-task-runner` |

## Common chains

**Design — implement a UI block:**
`ultra-component-discovery` → `ultra-visual-system` → `apple-design-head` → `ultra-pr-ship-review`

**Design — landing copy:**
`ultra-brand-voice` → `ultra-content-review` → `apple-design-head`

**New feature (e.g. events):**
`ultra-ceo` → `ultra-cpo` → `ultra-cto` → domain skill → `apple-design-head` → `ultra-pr-ship-review`

**Sales prep:**
`ultra-head-of-sales` → `ultra-head-of-growth`

## Output

```markdown
## Apple Hub — Routing
**Intent:** [one sentence]
**Primary skill:** `skill-name`
**Layer:** Design | Executive | GTM | Engineering | Infrastructure
**Optional follow-ups:** [skills]
**Shared context:** [which _shared/*.md files to read]
```

## Do not

- Implement code from the hub — route only
- Use `apple-design-head` for component sourcing — use `ultra-component-discovery` first
- Duplicate `apple-design-head` for token audits — use `ultra-visual-system`
- Give generic advice without `_shared/` project context
