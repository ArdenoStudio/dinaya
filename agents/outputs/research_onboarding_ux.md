# Dinaya Onboarding UX Research & Audit

**Date:** 2026-06-23  
**Scope:** Registration → Setup Wizard → Dashboard growth checklist  
**Competitors benchmarked:** Calendly, Square Appointments, Fresha, Acuity Scheduling, Vagaro  
**Code reviewed:** `SetupWizard.tsx`, `register/page.tsx`, `OnboardingWizard.tsx`, `overview-data.ts`, `OnboardingGate.tsx`, `register-business-account.ts`, `onboarding/route.ts`

---

## Executive summary

Dinaya has a **solid vertical-specific foundation** — business-type seeding, preset services, default availability, WhatsApp-first sharing, and a forced setup gate that gets owners to a live booking link. Against world-class SMB booking SaaS, the main gaps are **time-to-first-booking**, **redundant step IA**, **no test-booking moment**, and **post-setup checklist drift** that re-surfaces work users already completed in the setup wizard.

**Total user-facing steps today:** Register (2) + Setup Wizard (4) = **6 gated steps** before full dashboard access, plus a **6-item growth checklist** that partially duplicates the wizard.

**Estimated completion time:** 5–8 minutes for a careful mobile user (marketing claims 5 minutes; realistic with 4 required fields on step 1 + availability editing is closer to 7).

---

## 1. Competitor step IA summary

### Calendly (scheduling-first, consultant/SMB)

| Phase | Steps | Pattern |
|-------|-------|---------|
| Sign-up | Email/OAuth → personal URL → timezone | Minimal account creation; activation built into flow |
| Activation wizard | Connect calendar → set availability → configure event type (30 min default pre-created) | Sensible defaults; calendar sync is core activation |
| In-app | Minimizable checklist; progress bar; skippable steps | Endowed progress; “schedule with yourself” test booking |
| Time-to-value | ~3–4 min to shareable link | Test booking before sharing externally |

**Key patterns:** Pre-seeded event type, calendar integration as activation, self-test booking, checklist persists in dashboard but doesn’t block exploration, short copy with deep links to guides.

---

### Square Appointments (payments + booking, local SMB)

| Phase | Steps | Pattern |
|-------|-------|---------|
| Sign-up | Email, password, business name, phone, timezone, business type, location/staff count | Collects context upfront; defers detail |
| Dashboard checklist | Add services → create test appointment → booking settings → enable online booking → payments | Task-based, not a blocking full-screen wizard |
| Payments | Bank verification deferred until ready to accept cards | Payments optional at onboarding |
| Time-to-value | “Few minutes” per Square FAQ; FitSmallBusiness guide ~7 steps over ~30 min for full setup | Free single-location booking site |

**Key patterns:** Dashboard-native checklist, test appointment early, payments decoupled from go-live, guided prompts in left-nav checklist.

---

### Fresha (beauty/wellness vertical, closest Dinaya peer)

| Phase | Steps | Pattern |
|-------|-------|---------|
| Sign-up | Account → business details → first service → team → shifts | Academy course mirrors: 5 core lessons |
| In-app | Guided checklists + tooltips; progressive disclosure | Advanced features hidden until needed |
| Marketplace | Separate flow; payment method required only for marketplace listing | Core booking works before marketplace |
| Time-to-value | Same-day booking cited in marketing | 24/7 live chat; non-blocking onboarding |

**Key patterns:** Checklist over blocking wizard, vertical seeding, shift/availability tied to team, marketplace is opt-in layer, mobile-first.

---

### Acuity Scheduling (Squarespace ecosystem, services/consultants)

| Phase | Steps | Pattern |
|-------|-------|---------|
| Trial sign-up | OAuth/email → business name + industry → availability → first appointment type → payment processor (optional) | ~5-step inline walkthrough at signup |
| Post-wizard | Style editor, calendar sync, notifications, embed/share | 2+ follow-up steps shown on home, not blocking |
| Quick-start guide | 8 items (branding, availability, appointment types, intake forms, team, payments, notifications, integrations) | Long tail is checklist, not gate |

**Key patterns:** Industry selection at signup, payment processor offered but skippable in wizard, branding customization post-activation, embed/button/bar distribution options.

---

### Vagaro (salon/spa vertical, marketplace)

| Phase | Steps | Pattern |
|-------|-------|---------|
| Sign-up | Account → **service menu pre-selection by business type** → business info | Service seeding at signup (like Dinaya) |
| Setup wizard | Hours, theme, facility details — **pausable/resumable** | Optional 1:1 onboarding call with specialist |
| Go-live | Enable listing on marketplace → test booking on listing page | “15 minutes to go live” (Team Pro guide) |
| Time-to-value | Test booking on own listing page encouraged | Mobile Vagaro Pro app is primary setup surface |

**Key patterns:** Service pre-population at signup, resumable wizard, human onboarding option, explicit test-booking step, marketplace toggle separate from core setup.

---

### Cross-competitor patterns (world-class SMB onboarding)

1. **Pre-seed + edit** — Default service, hours, and staff exist before user edits (Dinaya does this well at registration).
2. **Activation = shareable link OR first booking** — Not “fill every profile field.”
3. **Test booking** — Book yourself / preview client flow before external share (Calendly, Vagaro, Square).
4. **Payments deferred** — Go live without PayHere/Stripe; connect when ready (Square, Acuity, Fresha marketplace).
5. **Non-blocking checklist** — Dashboard growth checklist, not a full-screen gate (Fresha, Calendly, Square).
6. **Skippable / resumable** — Save progress, skip non-critical steps (Calendly skip, Vagaro pause).
7. **Single source of truth** — One checklist, not wizard + checklist with overlapping steps.
8. **Celebration moment** — Clear “you’re live” with next action (share, test, invite).

---

## 2. Dinaya current flow (as implemented)

### 2.1 Registration (`register/page.tsx`)

| Step | Fields | Notes |
|------|--------|-------|
| 1 — Account | Name, email, password (strength meter) | 2-step dots; no credit card |
| 2 — Booking page | Business name, slug (`.dinaya.lk`), business type (8 options), language (en/si/ta) | Auto-slug from business name; testimonial + perks on desktop |

**Post-register:** Auto sign-in → redirect `/dashboard/setup`.  
**Server seeding** (`register-business-account.ts`): Owner staff, 2–3 preset services by type, Mon–Sat 9:00–17:00 availability, default location (Asia/Colombo), WhatsApp message templates, 14-day trial.

**Strengths:** Vertical seeding rivals Vagaro/Fresha; Sri Lanka localization (LKR, WhatsApp, Sinhala/Tamil); no credit card; strong desktop branding panel.

---

### 2.2 Setup Wizard (`SetupWizard.tsx`) — forced gate

`OnboardingGate` redirects all incomplete owners to `/dashboard/setup` with minimal chrome until `onboardingCompletedAt` is set.

| Step | Label | Required fields | API |
|------|-------|-----------------|-----|
| 1 | Your page info | Business name, WhatsApp, address, description (all required) | PATCH settings + PATCH onboarding step |
| 2 | What clients book | Service name, duration, price (description optional) | PATCH first service |
| 3 | When clients can book | Day toggles + per-day time range | POST availability |
| 4 | Share your link | Preview iframe, WhatsApp share, finish CTA | POST onboarding complete |

**Persistence:** `onboardingStep` resumes on refresh.  
**Finish:** Sets `onboardingCompletedAt`, lists in directory, enables client reactivation campaign on default location.

---

### 2.3 Dashboard growth checklist (`OnboardingWizard.tsx` + `overview-data.ts`)

Shown when any of 6 items incomplete:

| # | Step | Done when | href |
|---|------|-----------|------|
| 1 | Add your page details | `description && phone && address` | `/dashboard/settings` |
| 2 | Add what clients can book | `servicesCount > 0` | `/dashboard/services/new` |
| 3 | Who takes bookings | `staffCount > 0` | `/dashboard/staff/new` |
| 4 | Set booking hours | `availabilityCount > 0` | `/dashboard/availability` |
| 5 | Connect PayHere | `payhereEnabled && payhereMerchantId` | `/dashboard/settings` |
| 6 | Share your booking link | `totalBookings > 0` | External booking URL |

**Activation metric for “share” step:** First real client booking — stricter than competitors (link share ≠ done).

---

## 3. Dinaya audit

### 3.1 Step count & information architecture

| Metric | Dinaya | Competitor norm |
|--------|--------|-----------------|
| Pre-dashboard gated steps | 6 (2 register + 4 setup) | 3–5, often non-blocking |
| Post-dashboard checklist items | 6 (overlaps wizard) | 4–8, usually non-duplicative |
| Required fields before dashboard | 9+ (incl. address, description, phone) | 3–5 critical; rest deferred |
| Duplicate data entry | Business name at register + step 1; availability seeded then re-edited | Competitors avoid re-entry |

**IA issues:**

- **Dual onboarding systems** — Setup Wizard and dashboard checklist track similar work with different completion rules. After wizard completion, users often see 4/6 done with PayHere + “Share” remaining; steps 1–4 may feel redundant.
- **Staff step mismatch** — Checklist says “Who takes bookings” but owner staff is auto-created at signup; step auto-completes without user awareness (missed education moment).
- **“Share” completion requires a booking** — Competitors mark share done when link is copied/shared; Dinaya waits for `totalBookings > 0`, which can leave checklist open indefinitely.
- **`onboarded=1` query param** — Pushed on finish (`SetupWizard.tsx:308`) but **no handler** on dashboard for celebration/confetti/next steps.

---

### 3.2 Time-to-value (TTV)

| Milestone | When in Dinaya | Competitor benchmark |
|-----------|----------------|----------------------|
| Account created | Register step 2 | Same |
| Bookable page technically exists | **Immediately after register** (seeded services + availability) | Similar |
| User can access dashboard | After 4 setup steps | Competitors: immediate with checklist |
| User sees live preview | Setup step 4 | Calendly/Vagaro: step 2–3 |
| User encouraged to test book | **Never** | Calendly, Square, Vagaro: explicit |
| User shares link | Setup step 4 (optional before finish) | Core activation moment |
| First payment ready | Post-dashboard checklist only | Deferred in best practice ✓ |

**TTV assessment:** Dinaya **delays perceived value** by blocking dashboard until profile fields are complete, even though the booking page is already functional after registration. Competitors surface the link earlier and treat profile enrichment as checklist items.

**Best-in-class TTV target for Dinaya:** Register → see booking link in &lt;90 seconds → test book → share on WhatsApp → explore dashboard.

---

### 3.3 Mobile experience

| Area | Assessment |
|------|------------|
| Register | Good — single column, mobile logo, touch-friendly inputs |
| Setup wizard | Good — `min-h-11` tap targets, `inputMode="tel"`, pill day toggles |
| Availability step | **Risky** — per-day row with two `<input type="time">` in a flex row; cramped on &lt;360px widths |
| Preview iframe | **Risky** — fixed `h-64` iframe; slow/fail on mobile networks (12s timeout fallback exists) |
| Setup chrome | Good — minimal chrome hides sidebar; full-width focus |
| WhatsApp share | **Excellent** — native deep link; matches Sri Lanka channel preference |
| Dashboard checklist | Good — responsive grid `md:grid-cols-2` |

**Mobile gaps:** No sticky bottom CTA on long step 1 form; time pickers need stacked layout on small screens; no “copy link” one-tap button (only WhatsApp + preview).

---

### 3.4 Drop-off risk analysis

| Risk point | Severity | Evidence |
|------------|----------|----------|
| Step 1 requires phone + address + description | **High** | 4 required fields; competitors defer address/description |
| Forced gate — no dashboard peek | **High** | `OnboardingGate` blocks all routes; users can’t explore value |
| Re-editing pre-seeded availability | **Medium** | Step 3 duplicates work already done at register |
| No skip / “do later” | **Medium** | No escape hatch; Calendly/Vagaro allow skip or pause |
| iframe preview failure | **Low–Medium** | Fallback exists but may erode confidence on mobile |
| Wizard → checklist redundancy | **Medium** | Users may feel “I already did this” |
| Share step never completes without booking | **Medium** | Checklist stays open; demotivating |
| No test booking | **High** | Missing proven activation pattern |
| Error recovery | **Low** | Good error copy, retry on load fail, step persistence |
| Staff ID missing edge case | **Low** | Step 3 error if staff not found (shouldn’t happen post-register) |

**Estimated funnel (industry benchmarks applied):**

| Stage | Benchmark drop-off | Dinaya-specific risk |
|-------|-------------------|----------------------|
| Register step 1 → 2 | 10–15% | Low — standard |
| Register → Setup start | 5–10% | Low — auto sign-in |
| Setup step 1 (profile) | **25–35%** | High — 4 required fields |
| Setup step 3 (hours) | 10–15% | Medium — re-edit fatigue |
| Setup step 4 → Finish | 5–10% | Low |
| Post-setup first booking | 40–60% within 7 days | No guided test book |

---

### 3.5 What Dinaya does well

1. **Vertical seeding at signup** — Business type drives services (Vagaro/Fresha pattern).
2. **Sri Lanka-native** — LKR, WhatsApp share, `.dinaya.lk` slug, tri-lingual booking page.
3. **Sensible defaults** — 30 min / LKR 1500 haircut, Mon–Sat hours, owner as staff.
4. **Progress persistence** — `onboardingStep` + PATCH on each step.
5. **Minimal setup chrome** — Reduces cognitive load vs full dashboard.
6. **PayHere optional in checklist** — Correctly deferred (matches Square/Acuity).
7. **Analytics hooks** — `trackSignup`, `trackOnboardingComplete` for funnel measurement.
8. **Help link** — `/docs/guides/setup-booking-page` at bottom of wizard.

---

## 4. Prioritized improvements

### Critical (P0) — activation & drop-off

| # | Improvement | Rationale | Effort |
|---|-------------|-----------|--------|
| C1 | **Unify onboarding into one checklist model** — Merge Setup Wizard steps into a single 4–5 item gated checklist OR make setup wizard steps match dashboard checklist 1:1 with shared completion logic | Eliminates dual-system confusion; single source of truth in `overview-data.ts` | M |
| C2 | **Reduce step 1 required fields** — Only require WhatsApp; make address + description optional with “add later” | Biggest drop-off point; competitors defer | S |
| C3 | **Add “Book a test appointment” step** — Open booking page in new tab with guided copy: “Book yourself to see what clients see” (Calendly/Vagaro pattern) | Proven activation; builds confidence before WhatsApp share | S |
| C4 | **Surface booking link immediately after register** — Show `{slug}.dinaya.lk` + copy button on setup step 1 header: “Your page is already live” | TTV alignment; endowed progress from seeding | S |
| C5 | **Fix share checklist completion** — Mark done on link copy or WhatsApp share click, not only `totalBookings > 0` | Prevents perpetual incomplete checklist | S |

---

### High (P1) — TTV & mobile

| # | Improvement | Rationale | Effort |
|---|-------------|-----------|--------|
| H1 | **Celebrate `onboarded=1`** — Toast/modal on dashboard: “You’re live!” + primary CTA share WhatsApp + secondary explore dashboard | Missing moment of delight; param already passed | S |
| H2 | **Skip availability step when defaults suffice** — Pre-filled Mon–Fri 9–17 from seed; show “Using default hours — change if needed” with expand-to-edit | Removes redundant step 3 for most users | M |
| H3 | **Mobile layout for availability** — Stack time inputs vertically; sticky “Save hours” footer | Reduces step 3 mobile friction | S |
| H4 | **Add one-tap “Copy link”** on step 4 and checklist | Standard pattern; WhatsApp-only is narrow | S |
| H5 | **Allow dashboard peek with persistent setup banner** — Replace hard `OnboardingGate` redirect with dismissible banner + checklist (Fresha/Square model) | Lets users explore while nudging completion | L |
| H6 | **Remove duplicate business name field in setup step 1** — Pre-fill from register; only collect page-specific fields | Reduces re-entry | S |

---

### Medium (P2) — polish & growth

| # | Improvement | Rationale | Effort |
|---|-------------|-----------|--------|
| M1 | **Industry-specific setup copy** — Step 2 helper text varies by `businessType` (salon vs clinic vs tuition) | Fresha/Vagaro vertical UX | S |
| M2 | **Replace iframe preview with static screenshot or lightweight modal** — iframe is slow/unreliable on mobile | Preview confidence without load risk | M |
| M3 | **PayHere as optional step 5 in setup wizard** — “Skip for now” with checklist carry-over | Captures payment-ready users early without blocking | M |
| M4 | **Staff education moment** — After setup, show “You’re set as the default bookable staff — add team later” instead of checklist item linking to `/staff/new` | Staff already exists; checklist item is misleading | S |
| M5 | **Funnel analytics per setup step** — `trackEvent('onboarding_step', { step, action })` on each step enter/complete | Measure actual drop-off vs estimates | S |
| M6 | **“Save & continue later” on setup** — Explicit pause without losing progress (Vagaro resumable wizard) | Reduces abandonment for interrupted mobile users | M |

---

### Low (P3) — nice-to-have

| # | Improvement | Rationale | Effort |
|---|-------------|-----------|--------|
| L1 | **Social proof in setup wizard** — Small testimonial or “X businesses in Colombo use Dinaya” on mobile | Register has this; setup is sparse on mobile | S |
| L2 | **Progress step labels in header** — Show all 4 step names (not just “2 of 4”) | Calendly-style orientation | S |
| L3 | **Embed snippet in share step** — `embedSnippet` already in overview data; surface for web-savvy users | Acuity embed pattern | S |
| L4 | **Optional calendar sync teaser** — “Connect Google Calendar — coming soon” or waitlist | Calendly activation pattern for future | S |
| L5 | **Register step 1/2 merge on desktop** — Single scrollable form when viewport wide enough | Reduce perceived step count | M |
| L6 | **Human onboarding offer** — Link to book setup call (Vagaro specialist model) for Growth plan | High-touch segment | S |

---

## 5. Recommended target IA (north star)

```
Register (1 screen)
  └─ Account + business + type + slug + language

Dashboard (immediate access)
  └─ Setup checklist card (blocking badge until core complete)
       1. Confirm your booking link          [auto-done, copy/share]
       2. Add WhatsApp number                [required]
       3. Confirm your service               [pre-filled, 1-tap confirm]
       4. Confirm your hours                 [pre-filled, 1-tap confirm]
       5. Book a test appointment            [opens public page]
       6. Share your link                    [WhatsApp + copy]
       ─ ─ ─ optional ─ ─ ─
       7. Add address & description
       8. Connect PayHere
       9. Add team members

Celebration → full dashboard stats when 1–6 complete
```

**Core complete = shareable, tested booking page.** Optional items stay in checklist without blocking stats or navigation.

---

## 6. Metrics to track post-changes

| Metric | Definition | Target |
|--------|------------|--------|
| `signup_to_setup_start` | Register success → `/dashboard/setup` load | &gt;95% |
| `setup_step_completion` | Per-step completion rate | Step 1 &gt;80% |
| `time_to_link_copy` | Register → first `copy_link` event | &lt;3 min median |
| `test_booking_rate` | % owners who complete test book within 24h | &gt;40% |
| `whatsapp_share_rate` | % owners who click WA share within 24h | &gt;50% |
| `onboarding_complete_24h` | % completing wizard within 24h | &gt;70% |
| `first_client_booking_7d` | % with `totalBookings > 0` in 7 days | &gt;25% |

---

## 7. Files to touch for implementation

| Priority | Files |
|----------|-------|
| C1–C5 | `SetupWizard.tsx`, `overview-data.ts`, `OnboardingWizard.tsx`, `OnboardingGate.tsx` |
| H1 | `DashboardOverview.tsx` or new `OnboardingCelebration.tsx` |
| H2–H4 | `SetupWizard.tsx` |
| H5 | `OnboardingGate.tsx`, `dashboard/layout.tsx` |
| M5 | `gtag.ts`, `SetupWizard.tsx` |

---

## 8. References

- [Calendly onboarding UX (UX Planet)](https://uxplanet.org/how-calendly-nails-user-onboarding-for-complex-use-cases-3306d9ece6f2)
- [Calendly setup guide](https://calendly.com/learn/calendly-setup)
- [Square Appointments setup (FitSmallBusiness)](https://fitsmallbusiness.com/how-to-set-up-square-appointments/)
- [Fresha getting started academy](https://www.fresha.com/help-center/academy/launch-your-workspace/getting-started/lessons/7)
- [Acuity quick start](https://acuityscheduling.com/learn/quick-start-guide-business-services)
- [Vagaro business account setup](https://support.vagaro.com/hc/en-us/articles/44263218471323-Create-Your-Vagaro-Business-Account)
- [Vagaro Team Pro onboarding (15 min)](https://mysite.vagaro.com/vagaroukio/team-pro)

---

*Report produced by Subagent 1 (Dinaya orchestration) — codebase audit + competitor research.*
