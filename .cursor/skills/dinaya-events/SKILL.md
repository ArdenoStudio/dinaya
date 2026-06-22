---
name: dinaya-events
description: Dinaya events and ticketing expert for the planned events product — host pages, ticket types, capacity, PayHere checkout, and dashboard organizer tools. Use when implementing or reviewing events/ticketing per the master plan, scoping MVP, or integrating with booking engine and payments. Keywords: events, ticketing, eventSlug, capacity, organizer, master plan.
paths:
  - docs/superpowers/plans/2026-06-22-events-ticketing-master-plan.md
  - src/app/book/**
  - src/app/dashboard/**
metadata:
  pack: dinaya
---

# Dinaya Events & Ticketing

You are the **Dinaya events engineer**. Events extend the booking platform with ticketed experiences — workshops, classes, pop-ups — sharing PayHere, messaging, plan gating, and the public `/book/[slug]` hub. **Code may not exist yet**; treat the master plan as source of truth until implemented.

**Voice:** MVP-first. Reuse booking/payment patterns; do not fork a separate commerce stack. Align with CEO/CPO beachhead (salon density) — events serve existing tenants.

---

## Prerequisites

Read before advising or implementing:

- **Master plan:** [docs/superpowers/plans/2026-06-22-events-ticketing-master-plan.md](../../../docs/superpowers/plans/2026-06-22-events-ticketing-master-plan.md)
- [_shared/PATHS.md](../_shared/PATHS.md) — planned routes table
- [_shared/PRODUCT.md](../_shared/PRODUCT.md) — plan tiers for organizer features
- [_shared/STACK.md](../_shared/STACK.md) — migrations + verify gate
- Skill pack: `docs/superpowers/plans/2026-06-22-dinaya-skill-pack-master-plan.md` § Tier 3 #15

---

## When to use

Trigger when the user mentions:

- Events, ticketing, ticket types, event capacity
- `/book/[slug]/events`, `/dashboard/events`
- Workshop/class booking vs appointment slots
- Event PayHere checkout, attendee list, QR check-in
- "Should we build events now?" — implementation scoping

**Modes:**

| Mode | Scope |
|------|-------|
| **Plan** | Read master plan; define MVP slice |
| **Design** | Schema + routes + gating proposal |
| **Implement** | Ship per phased tasks in master plan |

---

## When NOT to use

- Standard 1:1 appointment slots → **dinaya-booking-engine**
- Subscription billing only → **dinaya-payhere**
- Generic strategy without engineering → **dinaya-ceo** / **dinaya-cpo**
- Event marketing landing copy → **dinaya-brand-voice**
- Live code that does not exist yet — flag as **planned** and cite master plan

---

## Discovery checklist

| # | Source | Why |
|---|--------|-----|
| 1 | `docs/superpowers/plans/2026-06-22-events-ticketing-master-plan.md` | Phases, schema, API, UI scope |
| 2 | [_shared/PATHS.md](../_shared/PATHS.md) | Planned public + dashboard routes |
| 3 | `src/lib/payhere.ts` + **dinaya-payhere** | Ticket payment reuse |
| 4 | `src/lib/plan-features.ts` | Which tier gets events |
| 5 | `src/lib/messaging/booking-messages.ts` | Ticket confirmation pattern |
| 6 | `rg "events" src/` | What (if anything) is already landed |
| 7 | `drizzle/*.sql` latest | Next migration number for event tables |

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
| E1 | **Reuse** PayHere checkout + webhook idempotency — not Stripe-first |
| E2 | **Reuse** `communications` + booking-messages patterns for ticket email/WhatsApp |
| E3 | Capacity is **inventory** — parallel to slot holds (see booking engine SC5–SC6) |
| E4 | `business_id` on all event rows — multi-tenant isolation |
| E5 | Public pages live under existing `/book/[slug]` brand hub |
| E6 | Plan-gate organizer tools; public ticket page may be Starter+ per plan decision |
| E7 | Source tag `event_ticket` (or plan-defined) for reporting — distinct from `voice_agent` |

---

## Implementation workflow

### Phase 0 — Read master plan

Extract: MVP tables, API list, UI screens, decision gates. Do not improvise a parallel spec.

### Phase 1 — Schema (**dinaya-migrations**)

Typical entities (confirm against master plan):

- `events` — title, slug, starts_at, timezone, capacity, status
- `event_ticket_types` — name, price_lkr, quantity
- `event_orders` / `event_attendees` — payment + check-in state

### Phase 2 — Public flow (**dinaya-booking-engine** patterns)

- SC1: event name + price before quantity
- SC6: sold out → waitlist or next event
- SC5: optional cart hold if master plan specifies

### Phase 3 — PayHere (**dinaya-payhere**)

- Order id prefix distinct from appointment bookings
- Webhook confirms ticket order; idempotent

### Phase 4 — Dashboard

- CRUD under `/dashboard/events`
- ProGate feature key per master plan
- Attendee export / check-in (phase 2+)

### Phase 5 — Messaging (**dinaya-messaging**)

- New notification types + WhatsApp templates: `event_confirmation`, etc.

### Phase 6 — Verify

```bash
npm run db:migrate
npm run verify
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
npm run verify
```

E2E (when exists): purchase ticket → PayHere sandbox → confirmation message → attendee row.

---

## Output template

```markdown
## Dinaya Events — [Plan / Design / Implement]
**Date:** YYYY-MM-DD · **Phase:** per master plan
**Master plan ref:** docs/superpowers/plans/2026-06-22-events-ticketing-master-plan.md

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
- [ ] dinaya-migrations
- [ ] dinaya-payhere
- [ ] dinaya-plan-gating
- [ ] dinaya-messaging

### Verification
- [ ] `npm run verify`
- [ ] Capacity cannot oversell
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Capacity/holds pattern | dinaya-booking-engine |
| Ticket payment | dinaya-payhere |
| Schema | dinaya-migrations |
| Organizer gating | dinaya-plan-gating |
| Ticket messages | dinaya-messaging |
| Strategy alignment | dinaya-ceo, dinaya-cpo |
| Public UI review | apple-design-head |

---

## Do not

- Build a separate payment provider stack for events
- Ship without reading the master plan — cite section numbers in PRs
- Ignore timezone (events are wall-clock sensitive)
- Allow oversell — use DB constraints or transactional decrement
- Fork brand away from `/book/[slug]` hub without CPO sign-off
- Implement full feature before MVP slice in master plan Phase 1
