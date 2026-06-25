# Dinaya Greenfield Onboarding Flow — Ideal Design

**Author:** Subagent 5 (Orchestration research)  
**Date:** 2026-06-23  
**Status:** Design proposal (no implementation)  
**Audience:** Product, design, engineering  
**Context:** Informed by Phase 0 audit (`AUDIT_REPORT.md`) and current code in `SetupWizard`, `OnboardingGate`, `register-business-account`, and `overview-data`.

---

## Executive summary

Dinaya’s ideal onboarding optimises for one outcome: **a Sri Lankan SMB owner shares a live booking link on WhatsApp within 3 minutes of account creation** — without PayHere, without learning the full dashboard first.

The booking page is **born live** at registration (seeded staff, services, availability). Onboarding is not “build your product”; it is **confirm, personalise, share**. PayHere, extra staff, automations, and AI features are **expansion lanes** surfaced after the first aha moment.

---

## Design principles

| # | Principle | Rationale |
|---|-----------|-----------|
| P1 | **Live before perfect** | Page at `{slug}.dinaya.lk` works with defaults; wizard refines, not blocks. |
| P2 | **One job per screen** | Salon owners are on mobile, distracted, sceptical of “another app”. |
| P3 | **WhatsApp is the distribution channel** | Sharing link = activation; design for Status, bio, DM paste. |
| P4 | **PayHere is earned, not required** | Many SMBs start cash-on-arrival; forcing PayHere kills completion. |
| P5 | **Show, don’t tell** | Inline preview of the public page beats abstract checklists. |
| P6 | **Resume anywhere** | `onboarding_step` + autosave; no data loss on refresh. |
| P7 | **Celebrate the first booking** | Revenue and calendar fill are the retention hook, not wizard completion. |

---

## Personas & jobs-to-be-done

### Primary: Solo service owner (salon, clinic, tuition)

- **Job:** Stop losing bookings in WhatsApp DMs; look professional online.
- **Anxiety:** “This will take hours”; “I need PayHere first”; “Clients won’t use a link.”
- **Success:** Link shared → client books without owner replying → owner gets notification.

### Secondary: Small team (2–5 staff)

- **Job:** One link, multiple calendars; owner still sets up alone first.
- **Defer:** Multi-staff routing, branch locations until after first booking.

### Tertiary: Founder-assisted pilot (e.g. Wax in the City)

- **Job:** White-glove setup; same product flow but pre-filled intake + concierge flag.
- **Defer:** Custom multi-branch seeding to admin tooling, not self-serve wizard.

---

## Current state vs ideal (gap map)

| Area | Current (repo) | Ideal greenfield |
|------|----------------|------------------|
| Time to live page | ~5 min (4 wizard steps after 2-step register) | **≤3 min** (2 wizard steps after lean register) |
| Page live at signup | Yes (seeded) but not surfaced until step 4 | **Yes — shown in step 1** with “already live” framing |
| PayHere | Post-setup checklist item #5 | **Expansion lane** — skippable forever until owner opts in |
| Dual systems | 4-step wizard + 6-item dashboard checklist overlap | **Single activation track** + lightweight growth checklist |
| Aha moment | Step 4 preview + share CTA | **Step 1 preview** + **first-booking celebration** |
| Server validation | POST complete does not validate required fields | **Validate MVP fields** before marking complete |
| Staff step | Implicit (owner seeded) | **Hidden** in MVP; surfaced in expansion |
| Post-onboarding | Checklist + directory listing + AI reactivation flag | **Timed nudge engine** (D0–D14) |

---

## Flow architecture (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DINAYA GREENFIELD ONBOARDING                            │
└─────────────────────────────────────────────────────────────────────────────────┘

  MARKETING                    SIGNUP (≤60s)              ACTIVATION (≤2min)
  ─────────                    ─────────────              ───────────────────

  Landing ──► /register ──► Account created ──► /dashboard/setup
     │              │              │                      │
     │              │              │                      ├──► [A1] Confirm & preview  ──┐
     │              │              │                      │     (name, phone, photo)   │
     │              │              │                      │     LIVE PREVIEW iframe    │ MVP
     │              │              │                      ├──► [A2] Tune one service  ──┤ PATH
     │              │              │                      │     (name, price, duration)│
     │              │              │                      └──► [A3] Share & finish  ────┘
     │              │              │                            WhatsApp + copy link
     │              │              │                            POST onboarding complete
     │              │              │
     │              │              └── Seeds at register: staff, services×N, availability,
     │              │                  location, WhatsApp templates, trial plan
     │              │
     │              └── R1: name, email, password
     │                  R2: business name, slug, type  (type → preset services)
     │
     └── CTA: "Get your booking link"


  AHA MOMENT LAYER (during + after activation)
  ───────────────────────────────────────────

       ┌──────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
       │  Preview loads   │         │  Owner shares link   │         │ First booking   │
       │  their real page │ ──────► │  on WhatsApp         │ ──────► │ notification    │
       │  (step A1)       │         │  (step A3)           │         │ (D0–D7)         │
       └──────────────────┘         └──────────────────────┘         └─────────────────┘
              │                                │                              │
              └──────── "I can see my shop" ───┴── "I sent it to clients" ─────┴── "It works"


  EXPANSION LANES (skippable, post-activation)
  ─────────────────────────────────────────────

  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
  │  PayHere    │  │ More staff  │  │ Custom hours │  │  Branding    │  │ Automations │
  │  (optional) │  │  & services │  │  & holidays  │  │  logo/colors │  │  reminders  │
  └─────────────┘  └─────────────┘  └──────────────┘  └──────────────┘  └─────────────┘
        │                  │                  │                 │                 │
        └──────────────────┴──────────────────┴─────────────────┴─────────────────┘
                                    Growth checklist + D0–D14 nudges


  POST-ONBOARDING NUDGE TIMELINE
  ──────────────────────────────

  D0          D1           D3              D7                 D14
   │           │            │               │                  │
   ▼           ▼            ▼               ▼                  ▼
 Share      No booking?   PayHere         Add 2nd           Trial ending
 reminder   "Send to 3    nudge if        service or        + upgrade CTA
 if no      regulars"    0 payments      Instagram bio     or extend trial
 share      + test book  + deposit tip   embed snippet
 logged
```

---

## Minimum viable path (MVP) — definition

**MVP complete** = owner can receive a real client booking at their public URL.

### Required data (server-enforced)

| Field | Source | Why required |
|-------|--------|--------------|
| `businesses.name` | Register + confirm A1 | Page header |
| `businesses.slug` | Register | Public URL |
| `businesses.phone` | A1 (WhatsApp) | Trust + client contact |
| ≥1 active `services` | Seeded + tuned A2 | Bookable offering |
| ≥1 `staff` + `availability` | Seeded at register | Slots exist |
| `onboarding_completed_at` | A3 finish | Gate release |

### Explicitly NOT required for MVP

| Item | Treatment |
|------|-----------|
| PayHere merchant ID | Skippable expansion lane |
| `address` | Recommended in A1; soft-required with “Add later” |
| `description` | Recommended; default from business type |
| Logo / cover image | Expansion |
| Extra staff | Expansion |
| Custom domain | Pro/Growth expansion |
| Deposit / `requiresPayment` | Off until PayHere connected |

### MVP step count

```
Register (2 screens) + Activation (3 screens) = 5 total touches, 3 of which are activation
Target wall-clock: ≤3 minutes on 4G mobile
```

---

## Phase 1 — Signup (`/register`)

Keep two steps; reduce cognitive load on R2.

### R1 — You

- Fields: full name, email, password (≥8 chars).
- CTA: **Continue**
- No business talk yet.

### R2 — Your business

- Fields: business name, slug (`{slug}.dinaya.lk` live preview), business type, language.
- Helper under type: “We’ll add example services you can edit next.”
- CTA: **Create my booking page** (not “Sign up” — outcome language).
- On success: auto sign-in → `/dashboard/setup` (no dashboard detour).

### Registration side effects (unchanged capability, clearer contract)

Atomic transaction creates:

- `businesses` (trial, `onboarding_step = 0`)
- `users` (owner)
- `staff` (owner)
- `services` (2–3 presets by `businessType`)
- `availability` (Mon–Sat 09:00–17:00 default)
- `locations` (default, Asia/Colombo)
- `message_templates` (WhatsApp confirmation + reminder)

**Key messaging shift:** post-register toast/banner — *“Your page is already live at {slug}.dinaya.lk — let’s make it yours.”*

---

## Phase 2 — Activation wizard (`/dashboard/setup`)

Full-screen, minimal chrome (`OnboardingGate` pattern retained). Split-pane on desktop: **form left, live preview right**.

### A1 — Confirm & preview (replaces “Your page info”)

**Goal:** Owner sees themselves on the internet in <30 seconds.

| Field | Required | Notes |
|-------|----------|-------|
| Business name | Yes | Pre-filled |
| WhatsApp number | Yes | `+94…` placeholder; shown on public page |
| One-line offer | Soft | Pre-filled from type template |
| Shop address | Soft | “Skip for now” link |
| Logo upload | No | “Add later” |

**UI elements:**

- Persistent **live iframe** of `{bookingUrl}` (already `SetupWizard` `BookingPreviewFrame` pattern).
- Badge: **Live** (green pulse).
- CTA: **Looks good — set my service**

**Autosave:** PATCH settings on blur or Continue; PATCH `onboarding_step = 1`.

### A2 — Tune one service (replaces “What clients book”)

**Goal:** One accurate bookable offering; hide the rest.

- Show **only the first preset service** (not the full catalog).
- Fields: name, duration (min), price (LKR), optional description.
- Collapsed: “You have {n} more example services — edit later in Services.”
- Availability **not edited here** — defaults already work; link “Change hours” opens inline drawer or defers to expansion.
- CTA: **Save — ready to share**

**Autosave:** PATCH service + `onboarding_step = 2`.

### A3 — Share & finish (replaces separate “hours” step + share)

**Goal:** Distribution = activation.

**Primary panel:**

```
┌────────────────────────────────────────────┐
│  ✓  Your booking page is live              │
│                                            │
│  glowbeauty.dinaya.lk          [ Copy ]    │
│                                            │
│  [ Share on WhatsApp ]  ← primary CTA      │
│  [ Preview in new tab ]                    │
│                                            │
│  Tip: Paste in Instagram bio or send to    │
│  3 regular clients who always DM you.      │
└────────────────────────────────────────────┘
```

**Secondary (collapsed): “Optional setup”**

- Connect PayHere → `/dashboard/settings?tab=payments` — label: **Skip for now**
- Adjust booking hours → `/dashboard/availability` — label: **Using Mon–Sat 9–5 (change)**

**Finish CTA:** **Open my dashboard**

On finish:

- `POST /api/dashboard/onboarding` with server validation of MVP fields
- `trackOnboardingComplete()` + event `onboarding_share_completed`
- Redirect `/dashboard?onboarded=1`
- Enable directory listing + default location AI reactivation (existing POST behaviour)

### What happened to “Set booking hours” as a wizard step?

**Removed from MVP path.** Registration already seeds Mon–Sat 09:00–17:00. Hours become:

1. Inline “change” link in A3 optional panel, or
2. First expansion nudge at D3 if owner edits nothing and gets zero bookings.

This cuts one full screen and matches P1 (live before perfect).

---

## Skippable steps — specification

| Step / feature | Skippable? | Default if skipped | Re-surface |
|----------------|------------|--------------------|------------|
| Address | Yes | Hidden on public page or city-only | Growth checklist + D3 nudge |
| Description | Yes | Type-based placeholder | SEO/marketing nudge D7 |
| Logo | Yes | Initials avatar | Branding nudge D7 |
| Booking hours edit | Yes | Mon–Sat 9–17 seeded | D3 if zero bookings |
| PayHere | Yes | Cash / pay-at-venue | D7 nudge; after 3+ bookings |
| Extra services | Yes | Presets remain inactive or hidden | D7 “add your menu” |
| Extra staff | Yes | Owner only | When 2nd calendar needed |
| Custom domain | Yes | `{slug}.dinaya.lk` | Pro gate in settings |
| WhatsApp automations | Yes | Templates seeded, not configured | D14 reactivation intro |

**Skip UX pattern:** Text link below primary CTA — *“Skip for now”* — never a dismissive ghost button. Skips log `onboarding_skip:{step}` for nudge targeting.

---

## Aha moment — design

### Primary aha (activation)

> **“That’s my shop on a real link — and I can send it right now.”**

**Triggers:**

1. **Preview paint** — iframe loads public page with their name (A1).
2. **WhatsApp handoff** — one tap opens WA with pre-filled message (A3).
3. **Copy confirmation** — toast “Link copied — paste anywhere.”

**Instrumentation:**

- `onboarding_preview_viewed` (A1, preview loaded >3s)
- `onboarding_whatsapp_share_tapped` (A3)
- `onboarding_link_copied` (A3)

### Secondary aha (retention)

> **“Someone booked without me typing back.”**

**Triggers:**

1. Push/in-app/email: *“You have a new booking — {client} · {service} · {time}”*
2. Dashboard hero replaces checklist with booking card + confetti (subtle, once).
3. Empty-state inversion: calendar was empty → now has row.

**Instrumentation:**

- `first_booking_received` (business-level, once)
- Time from `onboarding_completed_at` → first booking (north-star activation metric)

### Tertiary aha (monetisation)

> **“Money came in online.”** (PayHere expansion)

Only after PayHere connected + first successful payment — separate celebration, never blocking MVP.

---

## Phase 3 — Dashboard entry (D0)

After `?onboarded=1`:

### Replace dual checklist with single “Growth” card

Show **at most 3 open items**, prioritized by impact:

```
Priority queue (computed):
  1. Share link          — if !share_event_logged && bookings == 0
  2. Get first booking   — if bookings == 0 && share logged
  3. Connect PayHere     — if bookings >= 1 && !payhereEnabled  [skippable]
  4. Add logo & colors   — if bookings >= 1 && !logo
  5. Add 2nd service     — if services.count == 1 && bookings >= 2
  ... cap visible at 3
```

Dismiss growth card when: **≥3 bookings** OR **all top-3 done/skipped** OR **14 days post-onboarding**.

### D0 modal (once)

Lightweight, not blocking:

- Title: **You’re live**
- Body: Share link + “Book yourself” test CTA (owner books a fake slot to see flow — optional, Pro trial friendly).
- Actions: WhatsApp share | Go to dashboard

---

## Post-onboarding nudges (D0–D14)

### Nudge channels (priority order)

1. **In-app banners** on dashboard (highest)
2. **WhatsApp to owner** (if `phone` verified — future)
3. **Email** (owner email on file)
4. **SMS** (Growth plan, later)

### Nudge calendar

| Day | Condition | Message (owner-facing) | CTA |
|-----|-----------|------------------------|-----|
| D0 | Always | Your page is live — send it to 3 clients who always DM you. | Share on WhatsApp |
| D1 | `bookings == 0` && share not logged | No bookings yet? Forward the link to one regular. | Copy link |
| D1 | `bookings == 0` && share logged | Try a test booking to see what clients see. | Book a test slot |
| D3 | `bookings == 0` | Clients may want evening slots — open Availability. | Set hours |
| D3 | `bookings >= 1` && !payhere | Collect deposits online — connect PayHere in 2 minutes. | Connect PayHere |
| D7 | `bookings >= 2` && `services == 1` | Add your other services so clients see the full menu. | Add service |
| D7 | `!logo` | Add your logo — pages with photos get more bookings. | Upload logo |
| D10 | `bookings >= 3` && trial | You’re getting traction — see what Pro unlocks. | View plans |
| D14 | trial ending | Trial ends in {n} days — keep your link live. | Upgrade / extend |

### Nudge rules

- **Max 1 nudge per day** per channel; suppress if owner acted on that topic in last 48h.
- **Never nudge PayHere** before first booking (reduces anxiety).
- **Stop all nudges** after upgrade to paid or explicit “Don’t remind me” (per topic).
- Store state in `businesses.onboarding_nudges` JSONB or `activity_log` meta (implementation choice).

---

## Gate & navigation behaviour

```
onboarding_completed_at IS NULL
  → OnboardingGate forces /dashboard/setup (owners only)
  → Minimal chrome (no sidebar clutter)
  → Allow deep-link escape hatches: /dashboard/settings, /docs/guides/setup-booking-page

onboarding_completed_at IS NOT NULL
  → Full dashboard shell
  → Growth card on overview if expansion items remain
  → /dashboard/setup redirects to /dashboard
```

**Staff users** (non-owner): never see setup wizard; land on role-appropriate dashboard.

---

## Copy & tone (Dinaya brand)

| Moment | Avoid | Use |
|--------|-------|-----|
| Register CTA | “Sign up” | “Create my booking page” |
| Step A1 headline | “Business information” | “This is what clients see” |
| PayHere | “Required for go-live” | “Optional — turn on when you want card payments” |
| Hours | “Configure availability module” | “When can clients book?” |
| Share | “Distribute your URL” | “Send on WhatsApp” |
| Empty bookings | “No data” | “Share your link — first booking usually comes within a week” |

Language field (`en` / `si` / `ta`) should swap wizard strings; MVP can ship English first with SI strings in phase 2.

---

## Data model additions (proposed)

```sql
-- Optional migration for nudge + share tracking
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_share_at timestamptz;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_skips jsonb DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS first_booking_at timestamptz;
```

**Events (analytics / activity_log):**

| Event | Payload |
|-------|---------|
| `onboarding_step_completed` | `{ step: 1\|2\|3 }` |
| `onboarding_skipped` | `{ step: "address"\|"payhere"\|... }` |
| `onboarding_share_whatsapp` | `{ source: "wizard"\|"dashboard"\|"nudge" }` |
| `onboarding_completed` | `{ duration_seconds, mvp_fields_complete }` |
| `first_booking_received` | `{ booking_id, hours_since_onboarding }` |

---

## Success metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Register → onboarding complete | ≥70% | Funnel baseline |
| Register → WhatsApp share tapped | ≥50% | Primary activation proxy |
| Median time to complete activation | ≤3 min | Wall clock |
| Onboarding → first booking | ≤7 days (median) | True activation |
| PayHere connect within 30 days | ≥25% of activated | Expansion, not gate |
| Trial → paid (14-day) | Track by cohort | Downstream |

---

## Implementation delta from current repo

Ordered by impact / effort:

| Priority | Change | Files touched (indicative) |
|----------|--------|----------------------------|
| P0 | Collapse wizard 4→3 steps (drop hours step; defer to optional) | `SetupWizard.tsx` |
| P0 | Show live preview from step 1 | `SetupWizard.tsx` |
| P0 | Server-validate MVP fields on POST complete | `onboarding/route.ts` |
| P0 | Unify checklist — 3-item growth queue vs 6-item duplicate | `overview-data.ts`, `OnboardingWizard.tsx` |
| P1 | Skip links + `onboarding_skips` logging | Wizard + API |
| P1 | `onboarded=1` D0 modal + share tracking | `DashboardOverview.tsx`, analytics |
| P1 | PayHere demoted to expansion with “Skip for now” | `overview-data.ts`, settings |
| P2 | Nudge engine (cron or event-driven) | `src/app/api/cron/onboarding-nudges/` |
| P2 | SI/TA wizard strings | i18n layer |
| P3 | Owner test-booking flow | booking flow + flag |

---

## Open questions

1. **Test booking:** Should owners book themselves (excluded from stats) to experience client flow on D0?
2. **Preset services:** Hide inactive presets on public page until owner confirms, or show full menu from day one?
3. **Address soft-require:** Directory listing quality vs friction — require city at minimum?
4. **Pilot mode:** Admin pre-seed + `onboarding_completed_at` set for concierge onboarding (Wax in the City)?
5. **Mobile app:** Desktop app registration path (`/api/v1/desktop/auth/register`) — same 3-step activation or simplified?

---

## Appendix — Full user journey (narrative)

1. Ruwani sees Instagram ad: “Your booking page in 3 minutes.”
2. She registers on her phone — picks “Salon / barber”, slug `glowbeauty`.
3. Lands on setup: sees **glowbeauty.dinaya.lk** already showing “Glow Beauty” with a Haircut service.
4. She adds her WhatsApp number, tweaks Haircut to Rs 2,000 / 45 min.
5. Taps **Share on WhatsApp**, sends to her salon group.
6. Opens dashboard — growth card says “Waiting for your first booking.”
7. Next day: client books online. Push notification → **secondary aha**.
8. D3 nudge suggests PayHere for deposits. She skips.
9. After 4 bookings, she connects PayHere. First online payment → **tertiary aha**.
10. D14 trial reminder → upgrades to Pro.

---

**End of design.** Ready for Phase 2 wireframes and P0 implementation sequencing.
