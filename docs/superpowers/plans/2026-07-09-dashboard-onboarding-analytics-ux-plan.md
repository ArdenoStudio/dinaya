# Dashboard Onboarding · Analytics · Cross-Device UX — Master Plan

> **Status:** PLAN ONLY (no product code in this PR)  
> **Date:** 2026-07-09  
> **Owners:** Ovindu (GTM / weekly funnel review) · Suven (build)  
> **Method:** Parallel research swarm (onboarding, analytics, incomplete UI, mobile/tablet/laptop, calendar, admin acquisition, forms) + live login smoke on a fresh test account  
> **North star:** Signup → setup → share link → **first real booking** (not dashboard exploration)

---

## Executive verdict

Onboarding P1 blockers from June (`C1–C5`, `H1–H2`, `H4–H5`) are **already shipped** (Apple eval 96/100). The next gap is not another wizard rewrite — it is:

1. **Measure the funnel** so Ovindu/Suven can see drop-off and clicks  
2. **Make daily ops usable on phone + tablet** (calendar + nav)  
3. **Fix trust-breaking incomplete UI** (voice “coming soon”, AI Hub, reports)

**Recommended stack for founders:** GA4 + Vercel Analytics + Microsoft Clarity (already wired) + a new **`/admin/acquisition`** page backed by Postgres. Defer PostHog until ~100 live tenants.

---

## Live smoke (2026-07-09)

Registered `ux-plan-*@dinaya.test` against local `npm run dev`, walked setup → dashboard at ~390 / ~820 / ~1440px.

| Finding | Severity |
|---------|----------|
| Hard gate to `/dashboard/setup` — no skip / explore-later | P1 (activation tradeoff — keep for now, soften later) |
| Tablet (820px) still hamburger-only — wasted space | P0 UX |
| Mobile calendar: controls scroll away; week grid cramped | P0 UX |
| Calendar paints blank ~1–2s before grid | P1 |
| Desktop overview + sidebar feel solid | OK |

Screenshots: `/opt/cursor/artifacts/dashboard-ux-plan/screenshots/`

---

## Workstreams (ship order)

### Wave 0 — Founder visibility (do first)

| ID | Work | Effort | Owner |
|----|------|--------|-------|
| A0 | Confirm `NEXT_PUBLIC_GA_MEASUREMENT_ID` + `NEXT_PUBLIC_CLARITY_PROJECT_ID` in production | S | Ovindu + Suven |
| A1 | Extend `src/lib/analytics/gtag.ts` with onboarding step + dashboard nav events | S | Suven |
| A2 | Migration: `signup_utm_*`, `first_booking_at` on `businesses` + backfill | S | Suven |
| A3 | Capture UTMs on `/api/auth/register` | S | Suven |
| A4 | Build `/admin/acquisition` (funnel KPIs, stuck accounts, cohorts) | M | Suven |
| A5 | Weekly 30-min review ritual (metrics below) | — | Both |

**Why first:** Without A0–A4 you are guessing. Clarity shows *what they click*; admin funnel shows *who activates*.

#### Event taxonomy (GA4)

```
onboarding_setup_start        { resume_step, business_slug }
onboarding_step_complete      { step: 1-4, business_slug }
onboarding_link_copy          { source: setup_wizard | checklist }
onboarding_whatsapp_share     { source }
onboarding_test_book_click    { business_slug }
onboarding_complete           { business_slug }   // exists — pass slug
dashboard_nav_click           { route_id, surface: bottom_tab|more_sheet|tablet_rail|sidebar }
dashboard_cta_click           { cta_id, page }
dashboard_calendar_view       { view: week|day|agenda }
dashboard_calendar_event_open { }
dashboard_bookings_tab_change { tab }
activation_first_booking      { business_slug, days_to_activate }  // also write DB
```

No PII in event params (no email/phone). Update privacy copy if expanding tracking.

#### `/admin/acquisition` widgets

1. KPI strip: signups 7d/30d · onboarding rate · first-booking rate · trial→paid  
2. Funnel bars: Signup → Onboarded → First booking → Paid  
3. Source mix: `ref` / `signup_utm_source` / `business_type`  
4. Weekly cohort table (8 weeks)  
5. Stuck list: signed up >3d, `onboarding_completed_at` null  
6. Link to existing `/admin/referrals`

Auth: `requirePlatformAdmin()` (same as other admin pages). Ships **without** GA4 Data API — pure SQL.

#### Weekly review (Ovindu + Suven)

| Metric | Who watches |
|--------|-------------|
| % signups with ≥1 confirmed/paid booking in 7d (**north star**) | Both |
| Wizard completion rate | Suven |
| Drop-off by setup step (1–4) | Both |
| Top `dashboard_nav_click` destinations (Clarity + GA) | Ovindu |
| Stuck accounts list → WhatsApp outreach | Ovindu |

---

### Wave 1 — Mobile & tablet ops (P0 UX)

| ID | Work | Effort | Files |
|----|------|--------|-------|
| M1 | Calendar **day / agenda** default `<lg`; keep week at `lg+` | M | `src/app/dashboard/calendar/page.tsx` |
| M2 | Sticky calendar toolbar (date nav + New booking) on scroll | S | calendar page |
| M3 | Calendar skeleton while loading | S | calendar page |
| M4 | Phone **bottom nav** (Overview, Calendar, Bookings, Clients, More) | M | `DashboardShell.tsx`, new `DashboardBottomNav` |
| M5 | Tablet **icon rail** at `md–lg` (not hamburger) | M | `macos-sidebar.tsx`, `DashboardShell.tsx` |
| M6 | Keep cards through 1024px; tables at `xl+` for Bookings/Payments | M | `DataTable.tsx`, `BookingsClient.tsx` |
| M7 | Client detail stack `<lg`; wrap headers | S | `clients/[id]/page.tsx` |
| M8 | `e2e/dashboard-mobile.spec.ts` at 390×844 | M | `e2e/` |

**Acceptance (M1):** On 390px, no required horizontal scroll for today’s schedule; tap opens booking detail; week grid unchanged on laptop.

---

### Wave 2 — Trust & incomplete UI

| ID | Issue | Severity | Fix |
|----|-------|----------|-----|
| T1 | AI Voice in nav / integrations while rollout paused | P0 | Gate as “Coming soon”; remove actionable setup |
| T2 | AI Hub toggles look live without WhatsApp/messaging | P0 | Prerequisite banners before toggles |
| T3 | Reports: route map promises date filters + CSV; UI missing | P1 | Wire `DateRangePicker` + export |
| T4 | Integrations “Env required” / wrong WhatsApp CTA | P1 | Owner-facing copy + correct links |
| T5 | Availability “Add staff first” dead-end | P1 | CTA → `/dashboard/staff/new` |
| T6 | Clients `STAGE_DOT` typo | P2 | Fix map |
| T7 | Automations cron copy 15 vs 30 min | P2 | Align copy |
| T8 | `nativeStatus: "native"` oversells voice/reports | P2 | Mark foundation where true |

---

### Wave 3 — Onboarding activation lift (post-analytics)

June P1 is done. Next activation bets (only after Wave 0 so you can measure):

| ID | Change | Impact |
|----|--------|--------|
| O1 | Step 1: require WhatsApp only; defer address/description | Lower drop-off |
| O2 | Collapse hours step to “Confirm defaults” one-tap | Faster to share |
| O3 | Make test-book a tracked activation moment (not just a link) | First booking rehearsal |
| O4 | Soften hard gate → persistent setup banner (v2) | Explore without abandon |
| O5 | Register `inputCls` → `dashboardInputClass` (open H3) | Craft |

Do **not** greenfield-rewrite the wizard. Do **not** put PayHere inside the wizard.

---

### Wave 4 — Forms & empty-state polish

Shared components: extend `DashboardField`, add `DashboardFormActions`, `EmptyStateCompact`. Migrate services/staff/locations create flows off raw inputs. Effort: one focused agent pass (~forms + empties), then verify.

---

## Multi-agent implementation map (when you say “build”)

| Agent | Scope | Conflict risk |
|-------|-------|---------------|
| **IMPL-A** | Analytics events + UTM + `first_booking_at` migration | Low |
| **IMPL-B** | `/admin/acquisition` UI | Low |
| **IMPL-C** | Calendar day/agenda + skeleton + sticky header | Medium (calendar only) |
| **IMPL-D** | Bottom nav + tablet rail | Medium (shell) |
| **IMPL-E** | Trust gates (voice, AI Hub, integrations CTAs) | Low |
| **IMPL-F** | Reports date range + CSV | Low |
| **IMPL-G** | DataTable breakpoint + client detail responsive | Medium |
| **IMPL-H** | Forms/empty states | Medium |
| **IMPL-I** | Playwright mobile specs | Low (after C/D) |

Run A+B first (parallel). Then C+D+E in parallel. Then F+G+H. I last.

---

## Explicit say-no list

- PostHog / Mixpanel before admin funnel exists  
- Tenant-facing “activation analytics” upsell  
- Events ticketing / iPay / AI Voice as onboarding lead  
- Fresha-parity calendar (resources, POS)  
- Full Sinhala/Tamil dashboard i18n before funnel measurement  
- Rewriting onboarding from scratch  

---

## Success criteria

| Gate | Pass |
|------|------|
| Founders | Can open `/admin/acquisition` and name this week’s activation % without SQL |
| Clarity/GA | `dashboard_nav_click` + onboarding step events visible |
| Mobile | Salon owner can confirm today’s booking on phone without pinching calendar |
| Tablet | Persistent nav (icon rail), not phone hamburger |
| Trust | Voice/AI Hub never look “live” when blocked |
| Verify | `npm run verify` green on each impl PR |

---

## Related docs

- `agents/outputs/MASTER_IMPROVEMENT_PLAN.md` — June onboarding (mostly shipped)  
- `docs/launch-research-2026/07-first-100-customers-action-plan.md` — B5 tracking  
- `docs/launch-research-2026/06-product-and-marketing-gap-list.md` — Launch Analytics gap  
- `src/lib/analytics/gtag.ts` — existing GA4 helpers  
- `src/components/analytics/{GoogleAnalytics,MicrosoftClarity}.tsx`

---

## Appendix — Incomplete UI quick table

| Page | Issue | Sev |
|------|-------|-----|
| Voice / Integrations | Coming soon but actionable | P0 |
| AI Hub | Live-looking toggles without prerequisites | P0 |
| Calendar | No day view; mobile unusable | P0 |
| Mobile/Tablet shell | No bottom nav / no tablet rail | P1 |
| Reports | Missing date filter + CSV | P1 |
| Bookings new | Confirm appears late; weak field errors | P1 |
| Availability | No staff → no CTA | P1 |
| Clients | Stage dot typo | P2 |
