# 07 First 100 Customers — Action Plan

Last updated: 2026-06-14, Asia/Colombo.
Owners: **Ovindu** (go-to-market) · **Suven** (build) · Claude Code (drafts build tasks for Suven to review/own).

This is the execution plan that operationalises the research in [01 Market Research](01-market-research.md) → [06 Gap List](06-product-and-marketing-gap-list.md). Read those for the "why." This doc is the "what to do, who does it, and in what order."

---

## TL;DR — the strategy in 5 lines

1. **Every Dinaya booking page is a billboard.** Each business we onboard shows Dinaya to its entire customer base for free. We are going to *capture* that loop, not leave it on the table.
2. **Sell a finished booking page, not "software."** Close businesses on a live 20-minute WhatsApp video setup, and get them to broadcast their link to their own customers *before the call ends* — that manufactures the first real booking within hours.
3. **Saturate one cluster, not four cities.** Win one Colombo suburb/strip first; density makes referrals automatic.
4. **Three compounding waves get us to 100:** 0→30 founder-led, 30→70 referral loops, 70→100+ inbound from the "powered-by" loop + directory density.
5. **Build 4 growth mechanics** that turn manual hustle into compounding rate (Workstream B).

North star (from [02 Launch Plan](02-launch-plan.md)): **active businesses receiving real weekly bookings.** A signup is not a win; a *first real booking while the owner watches* is.

---

## Targets & timeline

"Customer" = onboarded **and** booking-page-live. Paid conversion is tracked separately.

| Phase | Window | Goal | Primary engine |
|---|---|---|---|
| **Phase 0 — Prep** | Week 0 | Infra + cluster + 3 demo pages + capture page live | Build (Suven) |
| **Phase 1 — Founder-led** | Weeks 1–6 | **0 → 30** live businesses | Ovindu: live concierge setups in one cluster |
| **Phase 2 — Referral loops** | Weeks 6–12 | **30 → 70** | Wedding-vendor cluster, stylist sub-links, "bring 3" |
| **Phase 3 — Inbound/compounding** | Weeks 12–20 | **70 → 100+** | "Powered-by" loop, Founding-100 wall, directory + Deals density, creators |

Honest note: **100 *paying* in 20 weeks is a stretch; 100 *onboarded & booking-live* is achievable** if the loops fire. Track both. Target ≥ 40% paid-conversion of active businesses by week 20.

### Wave-1 funnel math (justifies the daily targets)

To onboard ~5/week we need, per day:

```
20 contacted  →  ~5 replies (25%)  →  ~2 interested (40% of replies)
            →  ~1 setup call booked (50%)  →  live page (70%+ of calls)
```

≈ 5–7 live businesses/week. Six weeks ≈ 30, before counting referrals. Concierge/live setup is what makes the back half of this funnel convert far above a "book a demo" motion.

---

## Workstream A — Go-to-market (Ovindu)

### A1. Pick the cluster (Day 1)
- One high-density area. Recommend a single Colombo suburb or one salon-dense road, not the whole of Colombo/Gampaha/Kandy/Galle.
- Why: owners on the same strip know each other → word-of-mouth + in-person setups + locally useful directory/Deals faster.
- Deliverable: cluster named, ~40 candidate businesses identified.

### A2. Build the lead sheet (Days 1–2)
Columns: `business`, `vertical`, `city/cluster`, `IG/FB`, `WhatsApp/phone`, `Google Maps`, `lead score (/30)`, `code`, `utm`, `stage`, `next follow-up`, `source`, `activation`, `paid`.
- Score 1–5 on the 6 signals in [04 Outreach](04-outreach-playbooks.md#lead-scoring); prioritise **20+/30**.
- Beachhead order: salons → barbers → nail studios → spas → **bridal makeup artists** (referral hubs) → skin/aesthetic clinics → fitness/wellness.

### A3. The live-setup motion (the core rate lever) — Weeks 1–6
Replace "send me your menu" with a **live 20-minute WhatsApp video call**:
1. Screen-share, build the page *with* the owner from their IG/menu.
2. Turn on reminders + (optional) PayHere deposit.
3. Generate the booking URL + QR.
4. **Before hanging up:** owner posts the link to their IG story / WhatsApp status **and broadcasts it to their saved client contacts.** → first booking within hours.
5. Schedule the 14-day check-in then and there.

Daily target (14–30 days), from [04](04-outreach-playbooks.md#daily-outreach-target):
- [ ] Add 15 leads · Contact 20 · Follow up 10 old · Book 2 setup calls · Complete 1 setup · Post 1 build-in-public update.

**Risk reversal to use in the pitch:** "If you don't get a booking in your first 14 days, we'll personally get you one — or keep Pro free."

### A4. Referral loops (Weeks 6–12) — this is the 30→70 engine
- **Wedding/bridal cluster:** sign ONE respected bridal MUA → ask for intros to her photographer / salon / event-vendor circle. One close unlocks ~10.
- **Stylist sub-links:** give each stylist/therapist their own booking sub-link to share with their personal regulars → owner sees value fast.
- **Bring 3:** existing business earns 1 month Pro credit per qualified paying referral (manual; see Constraints).
- **Supply chain:** beauty-product distributors, salon-furniture suppliers, beauty schools (new-grad salon owners) = 1-to-many channels. Pitch co-marketing.

### A5. Content / marketing engine (ongoing)
- **Build in public:** "Setting up booking pages for 100 Sri Lankan salons — here's #N." Tag the business → they reshare → free reach + a case study + their own promo, in one post. 5–7 short posts/week ([03 Content Calendar](03-content-calendar.md)).
- **Ride the festival calendar:** time hooks to Avurudu (April), Vesak, Christmas, wedding season, school terms — "Get booking-ready before the Avurudu rush."
- **Sinhala + Tamil** share-captions and WhatsApp templates (don't stay English-only).
- **Creators:** operator-creators (salon owners who post), nano/micro (1k–50k). Pay in *service* where possible (free appointment at a partner salon, filmed booking via Dinaya). Disclosure required.

---

## Workstream B — Build (Suven)

Four growth mechanics, in priority order. Each turns manual effort into compounding rate. Brand constraint: **Cobalt primary, Violet engagement, Amber booking, Green availability — no pink/rose.** All public links must carry attribution params so we can measure each loop.

### B1. "Powered by Dinaya" loop — **HIGHEST PRIORITY** · effort S (~half day)
**Why:** the single biggest free-leads lever. Every consumer who books at one of our businesses sees a soft CTA to get their own page.
- **Where:**
  - Slim branded strip in `src/app/book/layout.tsx` (covers every booking page): "Powered by **Dinaya** — get a free booking page for your business →".
  - Stronger CTA card on `src/app/book/[slug]/confirmed/page.tsx` (the post-booking, highest-intent moment, next to `ReviewPrompt.tsx`).
- **Attribution:** link to `/start?utm_source=booking&utm_medium=powered_by&ref=<businessSlug>` so the referring business gets credit (feeds A4 "bring 3").
- **Acceptance:** appears on all `/book/*` pages and the confirmed page; click lands on the capture page with params persisted; respects brand colours; mobile-first.

### B2. Founder-setup capture page — **HIGH** · effort M (~1 day)
**Why:** [06 Gap List](06-product-and-marketing-gap-list.md#waitlist-or-founder-setup-funnel) flags this as missing. Cold traffic from videos/the powered-by loop won't register a full account — give them a 30-second form instead.
- **Where:** new route `src/app/start/page.tsx` (and/or `/setup`). No auth.
- **Captures:** business name, vertical, city, IG/FB, WhatsApp, services blurb — plus the `utm_*` and `ref` params from the URL.
- **Writes to:** a `leads` table (Drizzle migration) surfaced in `/admin`, **and** fires a WhatsApp/Resend notification so Ovindu can start the live setup fast.
- **Acceptance:** submitting creates an admin-visible lead with source attribution; success state gives a "we'll WhatsApp you" message + optional direct WhatsApp link.

### B3. "Founding 100" wall — **MEDIUM** · effort M (~1–1.5 days)
**Why:** scarcity + social proof + ego. Businesses want to be on it and will invite peers to join.
- **Where:** extend the existing `src/app/discover/page.tsx` directory (city-based discovery already exists) or add `src/app/founders/page.tsx` pulling the first N live businesses.
- **Needs:** a `foundingMember` flag/badge on the business record; ordered by onboard date; logo grid + city; live counter ("37 / 100").
- **Acceptance:** public page renders the founding cohort with badges and a live count; links each to its booking page.

### B4. No-show / lost-revenue calculator — **MEDIUM** · effort S–M (~1 day)
**Why:** lead magnet that makes the pain numeric ("8 'DM to book' posts/wk × Rs 2,500 × 2 no-shows ≈ Rs 20k/mo lost") and is shareable content.
- **Where:** `src/app/tools/no-show-calculator/page.tsx` (client component) or a section on the landing page.
- **Inputs:** avg service price, bookings/week, est. no-show %. **Output:** monthly LKR lost + "Dinaya deposits + reminders recover most of this."
- **Attribution:** end CTA → `/start?utm_source=calculator`.
- **Acceptance:** computes live; CTA captures the lead with source.

### B5. Tracking & attribution groundwork — **MEDIUM, ongoing** · effort M
- Ensure `utm_*` + `ref` are captured at signup (not just booking — they're already read in `src/app/api/bookings/route.ts`) and stored on the business/lead.
- Simple `/admin` acquisition view: leads by source → signup → setup → first booking → paid.
- **Promo codes:** keep **manual** for now (see Constraints). Scope the real feature only after referral/creator demand is proven — build order in [05 Promo Playbook](05-promo-referral-influencer-playbook.md#promo-code-product-roadmap).

### Build priority order
`B1 → B2 → B5 (capture path) → B4 → B3`. B1+B2 together close the loop (consumer sees CTA → lands on a real capture page → Ovindu does a live setup).

---

## Shared — metrics & weekly review

**Weekly acquisition:** leads added · contacted · replies · setup calls · onboarded · pages shared publicly · first bookings · paid.

**The two numbers that matter most:**
1. **Activation rate:** signup → *first real booking* (the north-star event).
2. **Loop yield:** referrals per business (A4) and powered-by clicks → signups (B1).

**Weekly 30-min review (Ovindu + Suven):** Which cluster/vertical converts best? Which loop is yielding? Re-point next week's effort at the winner. Don't spread; concentrate on what's working.

---

## Constraints (do not break these)

- **No in-app promo codes yet.** Run `FOUNDER50` / `DINAYA60` etc. **manually** via DM + referral links + Dinaya Deals. Never promise auto-redemption at checkout until B-roadmap ships it.
- **AI Voice Receptionist = "coming soon."** It's a tease, never the primary CTA. Sell booking reliability first ([06](06-product-and-marketing-gap-list.md#ai-voice-receptionist)).
- **Lock the domain.** Production is `dinaya.lk`; the 30s VO script still says `dinaya.app`. Pick one before scaling any spend ([06 critical list](06-product-and-marketing-gap-list.md#critical-before-public-launch)).
- **PDPA:** collect only what's needed; clear consent/opt-out; never export customer lists into ad/influencer workflows without permission ([01 Compliance](01-market-research.md#compliance-notes)).
- **No "guaranteed X% more bookings"** claims without our own measured proof.

---

## Week 1 checklist

**Ovindu (GTM)**
- [ ] Name the cluster; identify 40 candidate businesses.
- [ ] Build the lead sheet; score; mark the 20+/30 leads.
- [ ] Send 20 DMs/day using the [04](04-outreach-playbooks.md) scripts (offer a free finished page, not a demo).
- [ ] Run 3 live-setup calls; get each to broadcast their link before hangup.
- [ ] Post build-in-public #1, tagging the first business.

**Suven (build)**
- [ ] Ship **B1** (powered-by loop on `book/layout.tsx` + `confirmed` page).
- [ ] Start **B2** (`/start` capture page → `leads` table + admin + WhatsApp notify).
- [ ] Confirm `utm_*`/`ref` persistence at signup (**B5**).

**Together**
- [ ] Confirm 3 demo pages ready (salon, clinic, fitness).
- [ ] Decide final public domain.
- [ ] Set the weekly review slot.

---

## Definition of done — "first 100"

- 100 businesses onboarded and booking-page-live in the beachhead.
- ≥ 40% taking real bookings weekly (active).
- ≥ 40% of active converted to a paid plan (Starter LKR 1,990 / Pro 3,990 / Growth 6,900).
- ≥ 5 public case studies; ≥ 3 creator/agency partners sending qualified leads.
- A repeatable, measured playbook for the winning vertical + cluster.
