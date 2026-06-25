READY_TO_IMPLEMENT: true

# Master Improvement Plan — Dinaya Onboarding

**Date:** 2026-06-23  
**Synthesized from:** 5 research subagents + Phase 0 audit + Apple eval (93/100 baseline on PR #138)

---

## Executive Summary

Dinaya's onboarding **foundation is strong** (vertical seeding, WhatsApp share, 4-step wizard with Apple A-grade polish), but **three structural issues** block a perfect product score: (1) staff users can loop on the setup gate, (2) step-1 settings PATCH resets `language` to English via Zod defaults, and (3) the post-setup checklist marks "Share" incomplete until a real booking arrives — contradicting the wizard's step-4 share moment. Fixing these plus a celebration state on first dashboard land closes the gap to **95+** across Apple + brand dimensions.

---

## Priority 1 — Critical (must fix)

| ID | Change | File(s) | Score impact |
|----|--------|---------|--------------|
| C1 | **Staff gate loop** — only owners redirect to `/dashboard/setup` | `layout.tsx`, `OnboardingGate.tsx` | R2 Agency +10 |
| C2 | **Language reset** — partial settings PATCH; don't apply `language` default when omitted | `settings/route.ts`, optional `SetupWizard` | R4 i18n +8 |
| C3 | **Share checklist** — mark done when `onboardingCompletedAt` set OR `totalBookings > 0` | `overview-data.ts` | R0 Purpose +5 |
| C4 | **Onboarding celebration** — consume `?onboarded=1` with dismissible success banner | `DashboardOverview.tsx` + new client banner | R0 Purpose +5 |
| C5 | **GET error handling** — check `res.ok` on onboarding fetch | `SetupWizard.tsx` | R2 Agency +3 |

---

## Priority 2 — High impact

| ID | Change | File(s) | Score impact |
|----|--------|---------|--------------|
| H1 | **Rename checklist** — "Get more bookings" not "Grow your bookings" | `OnboardingWizard.tsx` | Brand +3 |
| H2 | **Register copy** — replace "Seeds…" helpers with plain language | `register/page.tsx` | Brand +4 |
| H3 | **Register tokens** — align `inputCls` with `dashboardInputClass` | `register/page.tsx` | R3 Craft +3 |
| H4 | **POST complete validation** — require phone + active service before `onboardingCompletedAt` | `onboarding/route.ts` | R2 +3 |
| H5 | **Test booking CTA** on step 4 — "Book yourself" link to public page | `SetupWizard.tsx` | R0 +5 (future) |

---

## Priority 3 — Polish / pilot (Wax in the City)

| ID | Change | Notes |
|----|--------|-------|
| P1 | Multi-branch seed script for pilot | `scripts/seed-pilot-wax.ts` — deferred |
| P2 | Waxing service presets | New `businessType` or pilot seed |
| P3 | si/ta setup copy | i18n pass on wizard strings |

---

## Implementation grouping (no file conflicts)

| Agent | Scope | Files |
|-------|-------|-------|
| IMPL-1 | Gate + celebration + checklist | `OnboardingGate.tsx`, `layout.tsx`, `overview-data.ts`, `OnboardingCelebration.tsx`, `DashboardOverview.tsx` |
| IMPL-2 | Settings partial PATCH + onboarding validation | `settings/route.ts`, `onboarding/route.ts` |
| IMPL-3 | SetupWizard res.ok + step 4 test link | `SetupWizard.tsx` |
| IMPL-4 | Register copy + tokens | `register/page.tsx` |

---

## Apple skills target after P1

| Round | Expected overall |
|-------|------------------|
| EVAL_ROUND_1 (pre) | 93 A |
| EVAL_ROUND_2 (post P1) | **95–97 A** |

Loop terminates at ≥93 with 0 P0 and 0 P1.

---

## Assumptions

- PayHere remains post-wizard checklist (competitor-aligned).
- 4-step wizard retained; no full greenfield restructure in this iteration.
- Stack: Neon/Drizzle (not Supabase-specific APIs).
