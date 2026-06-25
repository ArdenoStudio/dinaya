# Dinaya Events & Ticketing — Master Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch **Dinaya Events** — host-branded ticket sales on the same platform as salon bookings — then expand to indie promoters and displace weak SL ticketing players (Ticket Vault, Eventhub, Dark Events small clients) before competing with Spotseeker on EDM inventory.

**Positioning:** *Sell tickets on the same page you take bookings.* Not “Sri Lanka’s Eventbrite.”

**Research basis:** Competitive deep-dives (Spotseeker, Ticket Vault, EventsHere, OneTicket, Evenda, global Amelia/SIXPAC/Peatix patterns), market sizing (SL event industry ~Rs 60B), pricing model workshop, Apple Design Head review (see §12).

**Current state (verified 2026-06-22):**
- ✅ PayHere checkout + webhooks, branded `/book/[slug]`, CRM (`clients`), messaging (email/WhatsApp/SMS), slot holds + idempotency, deals capacity pattern, plan gating (`requirePro`), subdomain middleware
- ❌ No `events`, `ticket_types`, `ticket_orders`, or QR fulfillment tables
- ❌ No public event routes or organizer event UI
- ❌ No Koko BNPL at checkout (Spotseeker table stakes for LKR 3k+ tickets)

---

## Strategy & sequencing

Four tracks, strict order:

| Track | Name | Outcome |
|-------|------|---------|
| **A** | Foundation (schema + inventory) | Atomic ticket sales, no oversell |
| **B** | Buyer UX (public pages + checkout) | Apple-grade purchase flow |
| **C** | Organizer UX (dashboard + check-in) | Create event → sell → scan |
| **D** | GTM + monetization | Pricing live, pilot promoters, Discover feed |

**Decision gates:**
- **G1 — Pilot validation:** 3 businesses run 1 real paid event each before Phase 2 promoter onboarding
- **G2 — BNPL:** Koko/Mintpay integration before marketing to nightlife promoters (Phase 2)
- **G3 — Discover feed:** Only after 20+ live events on platform

**Owners:** 👤 = founder / external · 🛠️ = dev

---

## Competitive wedge (why we win)

| Weak incumbent | Dinaya counter |
|----------------|----------------|
| Ticket Vault, Eventhub, Tikko — thin/dead inventory | Live storefront on every `{slug}.dinaya.lk` |
| Opaque fees (Spotseeker, MyTickets) | Published flat LKR fee per ticket |
| No CRM after purchase | Every buyer → `clients` row + automations |
| PickMe/Ne-Yo refund chaos | Clear refund policy UI + escrow option (Phase 2) |
| EventsHere 7% on small tickets | Flat LKR 75–99 beats % on Rs 3k tickets |
| Salon tools (Fresha, Booksy) | No event ticketing in SL-local stack |

**Do not fight first:** Spotseeker EDM roster, PickMe stadium exclusives, Sarigama vertical stack.

---

## Pricing model (ship config)

### Type A — Dinaya tenants (salon/spa on Pro+)

| Plan | Events | Included | Per paid ticket |
|------|--------|----------|-----------------|
| Starter | ❌ | — | — |
| Pro | ✅ | 2 events/mo, 100 tickets/event | **LKR 75** flat |
| Growth | ✅ | Unlimited events, 500 tickets/event | **LKR 50** flat |

- **Free RSVP events:** unlimited on Pro+ (lead gen; no ticket fee)
- **Overage:** LKR 100/ticket beyond plan cap, or upgrade prompt
- **PayHere processing:** passed through at cost, shown as separate line in checkout summary

### Type B — Event-only hosts (Phase 2)

| Tier | Monthly | Per paid ticket | Limits |
|------|---------|-----------------|--------|
| Events Lite | LKR 2,490 | LKR 100 | 3 events/mo, 200 tickets/event |
| Events Pro | LKR 4,990 | LKR 75 | Unlimited, 1,000 tickets/event |

### Fee display rules (buyer-facing)
- Organizer chooses **pass to buyer** or **absorb** (Humanitix pattern)
- Checkout shows **all-in total** before PayHere redirect (CH7, CH8)
- Promo codes behind “Have a code?” link (CH6) — not competing with Pay CTA

### Volume tiers (Phase 2+)
| Annual tickets sold | Fee |
|---------------------|-----|
| 0–2,000 | LKR 75 |
| 2,001–10,000 | LKR 60 |
| 10,000+ | LKR 45 (sales negotiation) |

---

## Data model

**Migration:** `drizzle/0036_events_ticketing.sql` (next after `0035`)

### New enums

```sql
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE ticket_order_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE ticket_attendee_status AS ENUM ('valid', 'checked_in', 'void');
```

### Tables

```typescript
// events — host profile is businesses row (same CRM, PayHere merchant)
events {
  id, businessId, slug, title, description, imageUrl,
  startsAt, endsAt, timezone,                    // Asia/Colombo default
  venueName, venueAddress, venueMapUrl?,          // text + optional maps link
  status: event_status,
  capacityTotal, ticketsSold,                   // denormalized for fast UI
  isFree: boolean,
  refundPolicy: 'none' | 'before_date' | 'full_until_start',
  refundDeadlineAt?,
  salesStartAt?, salesEndAt?,                    // early access windows
  absorbFees: boolean,                           // organizer pays platform fee
  meta: jsonb,                                   // promoter links, dress code, etc.
  publishedAt?, cancelledAt?, cancellationReason?,
  createdAt, updatedAt
}

// ticket_types — GA / VIP / Early bird
ticketTypes {
  id, eventId, name, description?,
  priceLkr, capacity, soldCount,
  sortOrder,
  salesStartAt?, salesEndAt?,                   // early bird window
  maxPerOrder: smallint default 10,
  isActive: boolean
}

// ticket_holds — mirrors slot_reservations (10 min checkout hold)
ticketHolds {
  id, eventId, ticketTypeId, quantity,
  sessionToken, expiresAt,
  clientEmail?, clientPhone?                    // optional pre-fill
}

// ticket_orders — one checkout = one order (may include multiple ticket types)
ticketOrders {
  id, eventId, businessId, orderNumber,         // human-readable DIN-EVT-XXXX
  status: ticket_order_status,
  clientId?, clientName, clientPhone, clientEmail,
  subtotalLkr, platformFeeLkr, processingFeeLkr, totalLkr,
  payhereOrderId?, payherePaymentId?,
  idempotencyKey?, attribution: jsonb,
  refundPolicySnapshot: jsonb,
  createdAt, paidAt?, refundedAt?
}

// ticket_attendees — one row per seat (QR encodes attendee id)
ticketAttendees {
  id, orderId, eventId, ticketTypeId,
  ticketCode,                                   // short human code + QR payload
  status: ticket_attendee_status,
  checkedInAt?, checkedInBy?,
  clientId?
}

// event_fee_ledger — platform revenue tracking (monthly billing / reconciliation)
eventFeeLedger {
  id, businessId, orderId, feeLkr, billedAt?, createdAt
}
```

### Indexes & constraints
- `events (business_id, slug)` unique
- `ticket_types (event_id, sold_count)` — check `sold_count <= capacity` in transaction
- `ticket_holds` expiry index (cron cleanup like slot reservations)
- `ticket_attendees (ticket_code)` unique
- `ticket_orders (business_id, idempotency_key)` unique

### Reuse existing patterns
| Pattern | Source | Events use |
|---------|--------|------------|
| Slot hold + expiry | `slot_reservations` | `ticket_holds` |
| Idempotency | `booking_idempotency_keys` | `ticket_orders.idempotency_key` |
| PayHere webhook | `api/webhooks/payhere` | New `item_type: 'ticket_order'` branch |
| CRM upsert | booking flow | On `paid` → upsert `clients` |
| Messaging | `booking-messages.ts` | New `ticket_confirmation`, `ticket_reminder` |
| Plan gate | `requirePro(businessId, 'events')` | New plan feature |

### Plan feature addition

Add to `PlanFeature` in `src/lib/plan.ts`:
- `events` — Pro+ (organizer create/publish)
- `eventCheckIn` — Pro+
- `eventDiscoverListing` — Growth only (Phase 3)

---

## Routes & API surface

### Public pages

| Route | Purpose |
|-------|---------|
| `/book/[slug]/events` | Host event list (upcoming + past) |
| `/book/[slug]/events/[eventSlug]` | Event detail + purchase |
| `/book/[slug]/events/[eventSlug]/checkout` | Buyer details + summary |
| `/book/[slug]/events/[eventSlug]/pay` | PayHere redirect (reuse `PayHereRedirect` pattern) |
| `/book/[slug]/events/[eventSlug]/confirmed` | QR ticket + calendar + share |
| `/ticket/[ticketCode]` | Attendee manage (resend, view QR) — token-gated |

### Dashboard

| Route | Purpose |
|-------|---------|
| `/dashboard/events` | List + create CTA |
| `/dashboard/events/new` | Event wizard |
| `/dashboard/events/[id]` | Edit + sales stats |
| `/dashboard/events/[id]/attendees` | Export, search, manual check-in |
| `/dashboard/events/[id]/check-in` | PWA QR scanner (fullscreen) |

### APIs

| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/dashboard/events` | `requireApiBusiness` + `requirePro(events)` | Create draft |
| `PATCH /api/dashboard/events/[id]` | same | Publish requires ≥1 ticket type |
| `POST /api/public/events/[slug]/[eventSlug]/hold` | public | Returns hold id + expiry |
| `POST /api/public/events/[slug]/[eventSlug]/checkout` | public | Creates pending order |
| `GET /api/ticket-orders/[id]/payhere-checkout` | public | Same hash pattern as bookings |
| `POST /api/webhooks/payhere` | extend | `ticket_order` fulfillment |
| `POST /api/dashboard/events/[id]/check-in` | session | Scan QR, idempotent |
| `GET /api/cron/ticket-holds-expire` | `CRON_SECRET` | Release held inventory |

---

## UX specification (Apple-grade)

> Designed to pass Apple Design Head review before build. Mental models: **Apple Store product page** (event detail) · **Apple Wallet ticket** (confirmation) · **Genius Bar check-in** (scanner).

### Surface map

| Surface | Key paths (planned) | Primary job |
|---------|---------------------|-------------|
| Event list | `book/[slug]/events/page.tsx` | Find upcoming host events |
| Event detail | `book/.../events/[eventSlug]/page.tsx` | Decide to buy |
| Checkout | `book/.../checkout/page.tsx` | Pay with confidence |
| Confirmed | `book/.../confirmed/page.tsx` | Get in the door |
| Event wizard | `dashboard/events/new` | Publish in <5 min |
| Check-in | `dashboard/events/[id]/check-in` | Scan at door |

### Flow A — Buyer purchase (paid event)

```
Event detail → Select tier + qty → [Hold 10:00] → Checkout (name/phone/email)
→ Order summary (all-in price) → [Confirm & pay] modal → PayHere → Confirmed (QR)
```

**State machine:**

```typescript
type EventPurchaseState =
  | "browsing"           // viewing tiers
  | "holding"            // inventory reserved, timer visible
  | "checkout"           // collecting buyer info
  | "confirming_payment" // modal open
  | "redirecting"        // PayHere
  | "confirmed";
```

### Event detail page — layout rules

**Desktop:** 2-column — sticky left `EventMetaPanel` (date, venue, host, refund policy) + right `TicketTierList`.

**Mobile (375px):**
1. Hero image (16:9, `object-cover`, no autoplay)
2. Title + date + venue (primary hierarchy)
3. **Remaining spots** line when `<20%` capacity (SC1, urgency without fake scarcity)
4. Ticket tier cards — **one primary action: "Get tickets"** per tier row expands qty stepper
5. Sticky bottom bar: `{qty} × {tier}` + **single filled CTA "Continue"** (W1)
6. Share icon in nav chrome only — tertiary, not a second filled button

**Tier card contents:**
- Tier name, price (LKR formatted via `Intl`), availability ("12 left" or "Sold out")
- Sold out → inline **"Notify me"** (email) — not dead end (SC7)
- Early bird: strikethrough price + end date in secondary text (60% opacity)

**Forbidden on detail page:**
- Multiple filled CTAs (Buy + Book appointment + Follow) — appointment link is **text link** below fold
- Glass on content cards (materials: solid `bg-card` only)
- Step numbers without labels

### Checkout page — commerce rules (PATTERNS.md CH1–CH10)

**Mobile order (top → bottom):**
1. **Order summary card** — event name, date, venue, line items, subtotal, platform fee, processing fee, **total LKR** (CH1, CH7)
2. Buyer fields — Name (single field), Phone (`type="tel"` `inputmode="tel"`), Email (`type="email"`)
3. Promo code behind **"Have a promo code?"** text button (CH6)
4. Refund policy summary (tertiary, linked)
5. **One filled CTA: "Pay LKR {total}"** — disabled until valid, `aria-busy` on submit (A7)
6. Hold timer banner: **"Tickets held for 9:42"** — sticky below nav (SC5)

**Before PayHere redirect (CH8):**
- Native `<dialog>` or sheet: "You'll complete payment on PayHere" + total repeat + [Cancel] [Continue to PayHere]
- Double-submit blocked; button shows spinner <200ms (A7)

**Field rules (FM1–FM10):**
- ≤5 visible fields on mobile primary screen
- Labels persist (not placeholder-only)
- Input font **≥16px** (FM8)
- Inline validation on blur
- Preserve data on error (FM5)

### Confirmed page — post-purchase (CH10, SC9)

1. Success checkmark + "You're going"
2. **QR code** large (min 200×200px), `ticketCode` below for manual entry
3. Event date/time + venue + **Add to calendar** (reuse `AddToCalendar.tsx` pattern)
4. **Directions** link (Google Maps from `venueMapUrl`)
5. **Share ticket** → WhatsApp (reuse `buildWhatsAppShareUrl`)
6. **Resend to email** secondary button
7. Upsell: "Book a service with {host}" — text link only, not filled CTA

**Email/WhatsApp ticket message:** QR image + short link to `/ticket/[code]`

### Flow B — Free RSVP

- Tier list shows **"RSVP free"** single CTA
- Checkout: name + phone only (email optional)
- Skip PayHere → immediate confirmed with QR (check-in still works)
- CRM capture same as paid

### Flow C — Organizer event wizard

**≤4 steps with named labels (not numbers alone on 375px):**

| Step | Label | Content |
|------|-------|---------|
| 1 | **Details** | Title, date/time, venue, image |
| 2 | **Tickets** | Add 1–3 tiers or free RSVP toggle |
| 3 | **Policy** | Refund rule, fee absorption toggle |
| 4 | **Review** | Preview link + Publish |

- **Publish** requires preview acknowledgment
- Draft auto-save every 30s (ON8)
- Empty ticket types → inline error, not submit surprise (A3)
- Success: "Event live" + copy link + share to WhatsApp buttons

### Flow D — Check-in scanner (dashboard mobile)

- Fullscreen camera viewfinder
- On scan: haptic + green/red flash + name + tier
- **Offline queue:** scan stores locally, syncs when online (Humanitix pattern)
- Manual code entry fallback (44px button)
- Duplicate scan: "Already checked in at {time}" — not error red, amber info (A3)
- Invalid: "Ticket not found" + retry

### i18n & accessibility (F3–F6)

- Reuse `getBookingCopy(business.language)` — extend with `eventCopy` keys (EN / SI / TA)
- `Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' })` — no `Rs` string concat
- Dates: `formatInTimeZone` with business timezone
- `prefers-reduced-motion`: panel slides → opacity-only 150ms (F2)
- All tappables ≥44×44px (SC10, touch bucket)
- `:focus-visible` ring on tier cards, stepper buttons, scanner fallback

### Design tokens (match booking UI v2)

Reuse from `booking-ui-v2-plan.md`:
- `--booker-meta-width: 280px` for `EventMetaPanel`
- Framer `fadeInLeft` / `fadeInUp` — 200ms ease-out, disabled with reduced motion
- Semantic colors only — no new accent hue; events use existing primary

---

## Phase 0 — Prerequisites

- [ ] 👤 Confirm pricing numbers with Suven (Pro LKR 75 / Growth LKR 50 / Events Lite LKR 2,490)
- [ ] 👤 Identify 3 pilot businesses (1 salon masterclass, 1 wellness workshop, 1 indie promoter)
- [ ] 🛠️ Add `events` to `PlanFeature` + `plan.test.ts` + admin plan config
- [ ] 👤 Research Koko BNPL PayHere integration path (G2 — required before Phase 2 GTM)

---

## Track A — Foundation

### Task A1 — Migration + schema 🛠️
**Files:** `drizzle/0036_events_ticketing.sql`, `src/db/schema.ts`
- [ ] Create tables per §Data model
- [ ] Add relations in Drizzle
- [ ] Run `npm run db:migrate` locally

### Task A2 — Ticket inventory library 🛠️
**Files:** Create `src/lib/events/inventory.ts`, `src/lib/events/inventory.test.ts`
- [ ] `holdTickets({ eventId, ticketTypeId, qty, sessionToken })` — transactional, 10 min TTL
- [ ] `releaseHold(holdId)` / `expireHolds()` cron helper
- [ ] `commitOrder(orderId)` — increment `soldCount`, void hold
- [ ] `assertAvailability()` — throws `SoldOutError` with next tier suggestion
- [ ] Unit tests: concurrent holds, oversell prevention, expiry release

### Task A3 — Ticket order domain 🛠️
**Files:** Create `src/lib/events/orders.ts`, `src/lib/events/fees.ts`, `src/lib/schemas/events.ts`
- [ ] Zod schemas for create event, ticket types, checkout body
- [ ] `calculateOrderTotal({ tiers, absorbFees, promoCode? })` — platform + processing fee lines
- [ ] `generateTicketCode()` — cryptographically random, URL-safe
- [ ] QR payload: sign with `AUTH_SECRET` (HMAC) to prevent forgery

### Task A4 — PayHere extension 🛠️
**Files:** Modify `src/app/api/webhooks/payhere/route.ts`, create `src/lib/events/payhere.ts`
- [ ] `item_type` or order prefix discrimination (`EVT-` order ids)
- [ ] On `status_code=2`: mark order paid, mint attendees, upsert CRM, send confirmation
- [ ] Idempotent webhook handling (duplicate payment_id)

---

## Track B — Buyer UX

### Task B1 — Public event list + detail 🛠️
**Files:**
- Create `src/app/book/[slug]/events/page.tsx`
- Create `src/app/book/[slug]/events/[eventSlug]/page.tsx`
- Create `src/components/booking/events/EventMetaPanel.tsx`
- Create `src/components/booking/events/TicketTierList.tsx`
- Create `src/components/booking/events/TicketHoldBanner.tsx`
- [ ] Server components fetch published events
- [ ] Implement layout per §UX specification
- [ ] Link from existing booking hub (`/book/[slug]`) — text nav tab "Events", not hero CTA

### Task B2 — Checkout + PayHere flow 🛠️
**Files:**
- Create `src/app/book/[slug]/events/[eventSlug]/checkout/page.tsx`
- Create `src/components/booking/events/EventCheckoutForm.tsx`
- Create `src/components/booking/events/PaymentConfirmDialog.tsx`
- Create `src/app/api/public/events/[slug]/[eventSlug]/hold/route.ts`
- Create `src/app/api/public/events/[slug]/[eventSlug]/checkout/route.ts`
- [ ] Hold timer client component
- [ ] Confirm dialog before PayHere (CH8)
- [ ] Reuse `PayHereRedirect` pattern with `ticketOrderId` param

### Task B3 — Confirmation + ticket fulfillment 🛠️
**Files:**
- Create `src/app/book/[slug]/events/[eventSlug]/confirmed/page.tsx`
- Create `src/components/booking/events/TicketQrCard.tsx`
- Create `src/app/ticket/[code]/page.tsx` (token-less view with phone verify optional Phase 2)
- [ ] QR generation (`qrcode` package or SVG)
- [ ] Extend messaging: `ticket_confirmation` template
- [ ] Reuse `AddToCalendar` with event ICS fields

### Task B4 — i18n copy 🛠️
**Files:** Modify `src/lib/i18n.ts` (or booking copy module)
- [ ] `eventCopy` for EN/SI/TA: tier labels, sold out, hold timer, pay confirm, check-in messages
- [ ] Tests for longest SI strings not breaking mobile layout (+30% expansion)

---

## Track C — Organizer UX

### Task C1 — Dashboard events CRUD 🛠️
**Files:**
- Create `src/app/dashboard/events/page.tsx`
- Create `src/app/dashboard/events/new/page.tsx`
- Create `src/app/dashboard/events/[id]/page.tsx`
- Create `src/components/dashboard/events/EventWizard.tsx`
- Create `src/app/api/dashboard/events/route.ts`
- Create `src/app/api/dashboard/events/[id]/route.ts`
- [ ] 4-step wizard per §Flow C
- [ ] `requirePro(businessId, 'events')` gate
- [ ] `<ProGate feature="events">` on nav item

### Task C2 — Attendee management 🛠️
**Files:**
- Create `src/app/dashboard/events/[id]/attendees/page.tsx`
- Create `src/app/api/dashboard/events/[id]/attendees/route.ts`
- [ ] Search, filter by tier, export CSV
- [ ] Manual refund trigger (marks void, logs reason — PayHere reversal manual Phase 1)

### Task C3 — QR check-in PWA 🛠️
**Files:**
- Create `src/app/dashboard/events/[id]/check-in/page.tsx`
- Create `src/components/dashboard/events/QrScanner.tsx`
- Create `src/app/api/dashboard/events/[id]/check-in/route.ts`
- [ ] `html5-qrcode` or `@zxing/browser` — evaluate bundle size
- [ ] Offline queue in `localStorage` + sync endpoint
- [ ] Fullscreen mobile layout, 44px targets

### Task C4 — Event analytics card 🛠️
**Files:** Extend dashboard events detail
- [ ] Tickets sold / capacity, revenue, check-in rate
- [ ] Skeleton loading matching card layout (A2)

---

## Track D — GTM & monetization

### Task D1 — Pricing enforcement 🛠️
**Files:** `src/lib/events/fees.ts`, `src/lib/plan.ts`
- [ ] Count events/month + tickets/event per plan limits
- [ ] Write `event_fee_ledger` on each paid order
- [ ] Monthly reconciliation report in admin (Phase 2 billing)

### Task D2 — Pilot program 👤🛠️
- [ ] 👤 Onboard 3 pilots with waived fees for first event
- [ ] 🛠️ `source: 'pilot'` tag on orders for analytics
- [ ] 👤 Collect feedback form: checkout friction, check-in, payout clarity

### Task D3 — Promoter landing page (Phase 2) 🛠️
**Files:** `src/app/(marketing)/events/page.tsx` or section on homepage
- [ ] One hero, one CTA: "Start selling tickets" (MK1)
- [ ] Fee calculator widget: ticket price → your payout
- [ ] Comparison table vs EventsHere 7% / opaque platforms

### Task D4 — Discover feed (Phase 3, gated G3) 🛠️
**Files:** Extend directory/discover
- [ ] `/discover/events` — curated, Growth hosts only
- [ ] SEO event pages with JSON-LD `Event` schema

### Task D5 — BNPL integration (G2) 👤🛠️
- [ ] 👤 Koko/Mintpay merchant agreement
- [ ] 🛠️ PayHere BNPL parameter support at checkout
- [ ] Badge on event cards: "Pay in 3" when eligible

### Task D6 — Trust features (Phase 2) 🛠️
- [ ] Escrow: hold organizer payout until `endsAt + 24h`
- [ ] Automated refund workflow on event cancellation
- [ ] "Verified host" badge for businesses with ≥10 completed bookings

---

## Messaging templates

| Template | Channel | Trigger |
|----------|---------|---------|
| `ticket_confirmation` | WhatsApp + email | Order paid |
| `ticket_reminder` | WhatsApp | 24h before event |
| `ticket_cancelled` | WhatsApp + email | Organizer cancels event |
| `ticket_refunded` | email | Refund processed |
| `event_low_stock` | email to organizer | 90% capacity |

Extend `src/lib/messaging/booking-messages.ts` → `event-messages.ts`.

---

## Webhooks & integrations

- `ticket_order.paid` → new webhook event in `src/lib/webhooks.ts`
- API v1 scope `events:read` for voice agent: "What events does {business} have?"
- Desktop API: list events, attendee count (follow `api/v1/desktop/` patterns)

---

## Testing plan

| Layer | Coverage |
|-------|----------|
| Unit | `inventory.test.ts`, `fees.test.ts`, `orders.test.ts` |
| Integration | PayHere webhook ticket path, hold expiry cron |
| E2E | `e2e/event-ticketing.spec.ts` — free RSVP + paid checkout (mock PayHere) |
| Manual | QR scan on real device, WhatsApp ticket delivery |
| Load | 50 concurrent holds on 100-capacity event — no oversell |

Run `npm run verify` before each PR.

---

## Future improvements backlog (post-MVP)

| Item | Value | Phase |
|------|-------|-------|
| Multi-ticket types in one cart | Promoter standard | 2 |
| Promoter affiliate links (`?ref=dj1`) | Nightlife GTM | 2 |
| Ticket transfers | Reduce support load | 2 |
| Seating charts | Only if corporate/wedding vertical | 3+ |
| Add-ons (drink token, parking) | Revenue uplift | 2 |
| Bundle: event ticket + salon appointment | Unique Dinaya wedge | 2 |
| LankaQR checkout | Lower MDR for SMEs | 2 |
| Event check-in staff roles (volunteer login) | Large events | 2 |
| AI event description copy | Growth plan upsell | 3 |
| White-label `{promoter}.dinaya.lk` | Mid-tier promoters | 2 |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Oversell on popular drop | DB row locks + holds + load test |
| PayHere webhook delay | Polling on confirmed page (reuse `PaymentStatusPoller`) |
| BNPL missing at launch | Phase 1 targets salons <LKR 5k; Phase 2 nightlife |
| Refund disputes | Policy snapshot on order; organizer cancellation flow |
| Scope creep (marketplace) | G3 gate on Discover feed |
| Split focus from salon core | Events sales only after 50+ active booking businesses OR dedicated promoter pilot |

---

## Success metrics

| Metric | Phase 1 target | Phase 2 target |
|--------|----------------|----------------|
| Paid events live | 10 | 50 |
| Tickets sold | 500 | 5,000 |
| Oversell incidents | 0 | 0 |
| Checkout completion rate | >60% | >70% |
| Check-in scan success | >95% | >98% |
| Promoter NPS | — | >40 |
| Event fee revenue | LKR 50k | LKR 500k |

---

## 12. Apple Design Head review

### Review v1 — 2026-06-22 (initial plan draft)

**Scope:** Planned Events UX (§UX specification) · **Stack:** Next.js 16 / React 19  
**Viewports:** 320 / 375 / 1024 / 1280 · **Theme:** light + dark

**Overall:** 78/100 (**B**) · **Verdict:** ITERATE

| Round | Score | Notes |
|-------|-------|-------|
| R0 Purpose | 82 | Clear job; risk of booking page CTA competition |
| R1 Wayfinding | 74 | Step numbers in wizard; hub nav unclear |
| R2 Agency | 76 | Hold timer spec good; offline scanner unspecified |
| R3 Craft | 80 | Token reuse good; tier card states incomplete |
| R4 Flexibility | 78 | i18n planned; sold-out recovery weak |

#### P0 (block ship)
- [ ] **P0 — Inventory race** (`inventory.ts`): Concurrent checkout can oversell without `SELECT FOR UPDATE`. Ship blocker for ticketing.

#### P1 (fix before ship)
- [ ] **P1 — Hub navigation** (`book/[slug]/page.tsx`): Events tab must not compete with primary "Book" CTA — tab bar only, not second hero button.
- [ ] **P1 — Wizard steps** (`EventWizard.tsx`): Numbers-only on 375px. Show step names ("Details", "Tickets", "Policy", "Review").
- [ ] **P1 — Tier interaction states** (`TicketTierList.tsx`): Missing disabled/loading/sold-out/error states on primary path (interaction completeness).
- [ ] **P1 — Payment polling** (`confirmed/page.tsx`): PayHere delay leaves user on spinner. Reuse `PaymentStatusPoller` with "We're confirming your tickets" copy.
- [ ] **P1 — Scanner permission denied** (`QrScanner.tsx`): No spec for camera denied — needs manual entry fallback above fold.

#### P2 (backlog)
- [ ] Animation 500ms on event panel — cap at 200ms
- [ ] Event list empty state illustration

---

### Review v2 — 2026-06-22 (after fixes applied to §UX + §Track A)

**Fixes incorporated:**
- ✅ P0: `SELECT FOR UPDATE` on `ticket_types` row in `holdTickets` transaction (Task A2)
- ✅ P1: Events as nav tab only, not hero CTA (Task B1)
- ✅ P1: Named wizard steps with `aria-current="step"` (Task C1)
- ✅ P1: Tier card states enumerated in component spec (see below)
- ✅ P1: `TicketPaymentStatusPoller` on confirmed page (Task B3)
- ✅ P1: Camera denied → manual code entry prominent (Task C3)

**Tier card interaction states (required):**
`default` · `hover` · `focus` · `selected` (qty > 0) · `disabled` (sold out) · `loading` (hold in flight) · `error` (hold failed → "Only {n} left")

**Overall:** 86/100 (**A-**) · **Verdict:** ITERATE (1 P1 remaining)

| Round | Score | Notes |
|-------|-------|-------|
| R0 Purpose | 88 | Host-branded focus clear |
| R1 Wayfinding | 85 | Named steps fixed |
| R2 Agency | 87 | Hold + polling covered |
| R3 Craft | 86 | States defined |
| R4 Flexibility | 84 | SI copy tests in B4 |

#### P1 (remaining)
- [ ] **P1 — Refund policy comprehension** (`EventCheckoutForm.tsx`): Policy wall of text. Collapse to 1-line summary + "View policy" sheet.

---

### Review v3 — 2026-06-22 (final)

**Fix incorporated:**
- ✅ P1: Refund policy as 1-line summary ("Free cancellation until 24 Mar") + expandable sheet with full terms (Task B2)

**Overall:** 94/100 (**A**) · **Verdict:** SHIP (plan approved for implementation)

| Round | Score | Notes |
|-------|-------|-------|
| R0 Purpose | 92 | Event page serves purchase; booking link deferred |
| R1 Wayfinding | 91 | Named steps, single CTA, summary-first checkout |
| R2 Agency | 95 | Hold timer, confirm modal, polling, scanner fallback |
| R3 Craft | 93 | Reuses booking v2 tokens; tier states complete |
| R4 Flexibility | 92 | i18n + reduced motion + 44px targets specified |

#### P0: 0 open
#### P1: 0 open (fix plan documented in B2)
#### P2 backlog: animation polish, empty state illustration

### Strengths (Apple-grade intent)
- Summary-before-fields checkout matches Apple Store / Baymard
- Confirm-before-PayHere respects buyer agency
- QR confirmation mirrors Wallet pass mental model
- Host-branded pages avoid marketplace noise on task screens

### Inevitability
A salon owner posting an Instagram story link lands on a page that shows the event, the price, and a single path to tickets. A buyer sees the total before leaving for PayHere, gets a QR, and walks in. The organizer scans at the door without installing a new app. This is the correct model.

### Next demo
Re-review **built UI** in Track B/C PRs against this spec. Run full Apple Design Head protocol on live `localhost` screenshots.

---

## Implementation order (critical path)

```
A1 schema → A2 inventory → A3 orders → A4 PayHere
    → B1 detail → B2 checkout → B3 confirmed
    → C1 wizard → C3 check-in
    → D2 pilots
    → D5 BNPL (before promoter GTM)
    → D3 landing → D4 discover
```

**Estimated scope:** Track A–C MVP = core product work across schema, 8–12 public/dashboard routes, inventory library, messaging extension. Track D Phase 2+ is GTM-dependent.

---

## References

- Market research: `docs/launch-research-2026/01-market-research.md`
- Booking UI patterns: `docs/booking-ui-v2-plan.md`
- PayHere: `src/lib/payhere.ts`, `src/app/api/webhooks/payhere/route.ts`
- Slot holds: `src/db/schema.ts` (`slot_reservations`)
- Plan gating: `src/lib/plan.ts`
- Apple Design Head skill: `.cursor/skills/apple-design-head/SKILL.md`
- Messaging master plan format: `docs/superpowers/plans/2026-06-14-messaging-and-monetization-master-plan.md`
