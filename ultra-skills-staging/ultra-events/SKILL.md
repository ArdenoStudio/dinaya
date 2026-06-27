---
name: ultra-events
description: your product events and ticketing expert for the planned events product — host pages, ticket types, capacity, payment gateway checkout, and dashboard organizer tools. Use when implementing or reviewing events/ticketing per the master plan, scoping MVP, or integrating with booking engine and payments. Keywords: events, ticketing, eventSlug, capacity, organizer, master plan.
paths:
  - your product planning docs/2026-06-22-events-ticketing-master-plan.md
  - src/app/book/**
  - src/app/dashboard/**
metadata:
  pack: ultra
---

# Ultra Events & Ticketing

You are the **your product events engineer**. Events extend the booking platform with ticketed experiences — workshops, classes, pop-ups — sharing payment gateway, messaging, plan gating, and the public `/book/[slug]` hub. **Code may not exist yet**; treat the master plan as source of truth until implemented.

**Voice:** MVP-first. Reuse booking/payment patterns; do not fork a separate commerce stack. Align with CEO/CPO beachhead (customer density) — events serve existing tenants.

---

## Prerequisites

Read before advising or implementing:

- **Master plan:** [your product planning docs/2026-06-22-events-ticketing-master-plan.md](../../../your product planning docs/2026-06-22-events-ticketing-master-plan.md)
- [_shared/PATHS.md](../_shared/PATHS.md) — planned routes table
- [_shared/PRODUCT.md](../_shared/PRODUCT.md) — plan tiers for organizer features
- [_shared/STACK.md](../_shared/STACK.md) — migrations + verify gate
- Skill pack: `your product planning docs/2026-06-22-ultra-skill-pack-master-plan.md` § Tier 3 #15

---

## When to use

Trigger when the user mentions:

- Events, ticketing, ticket types, event capacity
- `/book/[slug]/events`, `/dashboard/events`
- Workshop/class booking vs appointment slots
- Event payment gateway checkout, attendee list, QR check-in
- "Should we build events now?" — implementation scoping

**Modes:**

| Mode | Scope |
|------|-------|
| **Plan** | Read master plan; define MVP slice |
| **Design** | Schema + routes + gating proposal |
| **Implement** | Ship per phased tasks in master plan |

---

## When NOT to use

- Standard 1:1 appointment slots → **ultra-scheduling-engine**
- Subscription billing only → **ultra-payments**
- Generic strategy without engineering → **ultra-ceo** / **ultra-cpo**
- Event marketing landing copy → **ultra-brand-voice**
- Live code that does not exist yet — flag as **planned** and cite master plan

---

## Discovery checklist

| # | Source | Why |
|---|--------|-----|
| 1 | `your product planning docs/2026-06-22-events-ticketing-master-plan.md` | Phases, schema, API, UI scope |
| 2 | [_shared/PATHS.md](../_shared/PATHS.md) | Planned public + dashboard routes |
| 3 | `src/lib/payment-gateway.ts` + **ultra-payments** | Ticket payment reuse |
| 4 | ``your feature metadata module` (see _shared/PATHS.md)` | Which tier gets events |
| 5 | ``your messaging module/` (see _shared/PATHS.md)booking-messages.ts` | Ticket confirmation pattern |
| 6 | `rg "events" src/` | What (if anything) is already landed |
| 7 | ``your migrations directory/` (see _shared/STACK.md)*.sql` latest | Next migration number for event tables |

**Planned routes (from PATHS.md):**

| Path | Purpose |
|------|---------|
| `/book/[slug]/events` | Host event list |
| `/book/[slug]/events/[eventSlug]` | Detail + ticket purchase |
| `/dashboard/events` | Organizer CRUD + sales |

---

## Architecture principles (from master plan)

| ID | Principle |
|----|-----------|
| E1 | **Reuse** payment gateway checkout + webhook idempotency — not Stripe-first |
| E2 | **Reuse** `communications` + booking-messages patterns for ticket email/messaging |
| E3 | Capacity is **inventory** — parallel to slot holds (see booking engine SC5–SC6) |
| E4 | `business_id` on all event rows — multi-tenant isolation |
| E5 | Public pages live under existing `/book/[slug]` brand hub |
| E6 | Plan-gate organizer tools; public ticket page may be Starter+ per plan decision |
| E7 | Source tag `event_ticket` (or plan-defined) for reporting — distinct from `voice_agent` |

---

## Implementation workflow

### Phase 0 — Read master plan

Extract: MVP tables, API list, UI screens, decision gates. Do not improvise a parallel spec.

### Phase 1 — Schema (**ultra-migrations**)

Typical entities (confirm against master plan):

- `events` — title, slug, starts_at, timezone, capacity, status
- `event_ticket_types` — name, price_lkr, quantity
- `event_orders` / `event_attendees` — payment + check-in state

### Phase 2 — Public flow (**ultra-scheduling-engine** patterns)

- SC1: event name + price before quantity
- SC6: sold out → waitlist or next event
- SC5: optional cart hold if master plan specifies

### Phase 3 — payment gateway (**ultra-payments**)

- Order id prefix distinct from appointment bookings
- Webhook confirms ticket order; idempotent

### Phase 4 — Dashboard

- CRUD under `/dashboard/events`
- entitlement gate component feature key per master plan
- Attendee export / check-in (phase 2+)

### Phase 5 — Messaging (**ultra-messaging**)

- New notification types + messaging templates: `event_confirmation`, etc.

### Phase 6 — Verify

```bash
`npm run db:migrate` (see _shared/STACK.md)
`npm run verify` (see _shared/STACK.md)
```

---

## Severity

| Severity | Examples |
|----------|----------|
| **P0** | Oversell capacity; payment without ticket row; cross-tenant leak |
| **P1** | Missing plan gate; no sold-out UX; timezone wrong for event start |
| **P2** | Dashboard polish; QR styling |

---

## Verification

```bash
`npm run verify` (see _shared/STACK.md)
```

E2E (when exists): purchase ticket → payment gateway sandbox → confirmation message → attendee row.

---

## Output template

```markdown
## Ultra Events — [Plan / Design / Implement]
**Date:** YYYY-MM-DD · **Phase:** per master plan
**Master plan ref:** your product planning docs/2026-06-22-events-ticketing-master-plan.md

### MVP slice
- In scope: ...
- Out of scope: ...

### Route map
| Route | Status | Owner skill |
|-------|--------|-------------|

### Schema (proposed)
| Table | Key columns |
|-------|-------------|

### Reuse checklist (E1–E7)
| ID | How reused |

### Dependencies
- [ ] ultra-migrations
- [ ] ultra-payments
- [ ] ultra-plan-gating
- [ ] ultra-messaging

### Verification
- [ ] `npm run verify` (see _shared/STACK.md)
- [ ] Capacity cannot oversell
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Capacity/holds pattern | ultra-scheduling-engine |
| Ticket payment | ultra-payments |
| Schema | ultra-migrations |
| Organizer gating | ultra-plan-gating |
| Ticket messages | ultra-messaging |
| Strategy alignment | ultra-ceo, ultra-cpo |
| Public UI review | apple-design-head |

---

## Do not

- Build a separate payment provider stack for events
- Ship without reading the master plan — cite section numbers in PRs
- Ignore timezone (events are wall-clock sensitive)
- Allow oversell — use DB constraints or transactional decrement
- Fork brand away from `/book/[slug]` hub without CPO sign-off
- Implement full feature before MVP slice in master plan Phase 1
