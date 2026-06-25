# Dinaya Onboarding — Phase 0 Audit Report

**Date:** 2026-06-23  
**Orchestrator:** Cloud Agent session  
**Assumptions:** Script references `/app` and Supabase; actual repo uses `src/app`, Neon Postgres + Drizzle ORM (Supabase-compatible pooler supported per `.env.example`). Pilot client Wax in the City is product context, not yet in codebase.

---

## 1. Repository map (onboarding-relevant)

| Area | Path | Role |
|------|------|------|
| Signup UI | `src/app/(auth)/register/page.tsx` | 2-step registration → auto sign-in → `/dashboard/setup` |
| Sign-in redirect | `src/app/auth/signin/page.tsx` | `justRegistered` → `/dashboard/setup` |
| Setup wizard | `src/components/dashboard/SetupWizard.tsx` | 4-step gated onboarding (owner only) |
| Setup skeleton | `src/components/dashboard/SetupWizardSkeleton.tsx` | Layout skeleton + gate flash prevention |
| Route gate | `src/components/dashboard/OnboardingGate.tsx` | Redirect incomplete owners to setup |
| Setup page | `src/app/dashboard/setup/page.tsx` | Server guard: owner + not completed |
| Dashboard layout | `src/app/dashboard/layout.tsx` | Loads `onboardingCompletedAt`, minimal chrome |
| Post-setup checklist | `src/components/dashboard/OnboardingWizard.tsx` | 6-item growth checklist on overview |
| Checklist data | `src/lib/dashboard/overview-data.ts` | Step labels, done predicates, hrefs |
| Onboarding API | `src/app/api/dashboard/onboarding/route.ts` | GET state, PATCH step, POST complete |
| Registration | `src/lib/auth/register-business-account.ts` | Atomic seed: business, user, staff, services, availability, location, templates |
| Register API | `src/app/api/auth/register/route.ts` | Zod + `registerBusinessAccount` |
| Schema | `src/db/schema.ts` | `onboarding_step`, `onboarding_completed_at` on `businesses` |
| Migration | `drizzle/0017_onboarding.sql` | Onboarding columns + backfill existing businesses |

**Not onboarding but adjacent:** `src/app/dashboard/settings/*`, PayHere in settings (not in setup wizard), WhatsApp templates seeded at registration.

---

## 2. Current onboarding step map

### A. Pre-onboarding: Registration (`/register`)

| Step | UI | Data created |
|------|-----|--------------|
| R1 | Name, email, password | — |
| R2 | Business name, slug, type, language | Via API: `businesses`, `users`, `staff`, `services` (presets), `availability` (Mon–Sat 9–17), `locations`, `staff_locations`, `staff_services`, `message_templates` |

Redirect: `signIn` → `/dashboard/setup`.

### B. Gated setup wizard (`/dashboard/setup`) — **4 steps**

| Step | Label (current, post-PR #138) | API / persistence |
|------|--------------------------------|-------------------|
| 1 | Your page info | `PATCH /api/dashboard/settings` + `PATCH onboarding step=1` |
| 2 | What clients book | `PATCH /api/dashboard/services/:id` + step=2 |
| 3 | When clients can book | `POST /api/dashboard/availability` + step=3 |
| 4 | Share your link | `POST /api/dashboard/onboarding` sets `onboarding_completed_at`, directory listing |

Resume: `businesses.onboarding_step` → wizard opens at `step + 1`.  
Gate: `OnboardingGate` + layout `minimalChrome` until complete.

### C. Post-onboarding checklist (dashboard overview)

6 items: page details, first service, who takes bookings, booking hours, PayHere, share link — **separate** from wizard; shows until all predicates true.

---

## 3. Data model (onboarding writes)

**At registration (transaction):**
- `businesses`: slug, name, email, type, plan=trial, policies, `onboarding_step=0`, `onboarding_completed_at=null`
- `users`: owner credentials
- `staff`: owner as active member
- `services`: 2–3 presets by `businessType`
- `availability`: Mon–Sat 09:00–17:00
- `locations`: default branch, Asia/Colombo
- `message_templates`: WhatsApp confirmation + reminder

**During wizard:**
- Step 1 → `businesses.name`, `phone`, `address`, `description`
- Step 2 → first active `services` row
- Step 3 → `availability` rows for owner staff
- Step 4 → `onboarding_completed_at`, `onboarding_step=4`, `directory_listed=true`, AI reactivation flag on default location

---

## 4. Apple & Dinaya skills inventory

| Skill | Path | Onboarding relevance |
|-------|------|----------------------|
| **apple-design-head** | `.cursor/skills/apple-design-head/SKILL.md` | Primary ship gate — R0–R4, P0/P1, 93+=A |
| dinaya-brand-voice | `.cursor/skills/dinaya-brand-voice/SKILL.md` | Copy, CTAs, Sri Lanka tone |
| dinaya-visual-system | `.cursor/skills/dinaya-visual-system/SKILL.md` | Tokens, touch, spacing |
| dinaya-booking-engine | `.cursor/skills/dinaya-booking-engine/PATTERNS.md` | Scheduling patterns |
| dinaya-plan-gating | `.cursor/skills/dinaya-plan-gating/SKILL.md` | Trial entitlements |
| dinaya-payhere | `.cursor/skills/dinaya-payhere/SKILL.md` | PayHere not in wizard |
| dinaya-pr-ship-review | `.cursor/skills/dinaya-pr-ship-review/SKILL.md` | PR verify gate |

**Apple evaluation dimensions (weighted):** R0 Purpose 25%, R1 Wayfinding 25%, R2 Agency 25%, R3 Craft 20%, R4 Flexibility 15%. Ship: ≥85 A−, 0 P0, ≤2 P1. Perfect band: **93–100 (A)**.

**Latest known score (PR #138 branch):** 93/100 A, 0 P0, 0 P1 — after polish pass.

---

## 5. Obvious gaps (Phase 0)

| ID | Gap | Severity |
|----|-----|----------|
| G1 | **Dual onboarding systems** — 4-step wizard vs 6-item dashboard checklist overlap conceptually | High |
| G2 | **PayHere / WhatsApp not in wizard** — deferred to post-setup checklist | Medium (by design?) |
| G3 | **Register page** still uses legacy `inputCls` / gray tokens — not aligned with polished SetupWizard | Medium |
| G4 | **No Wax in the City pilot template** — greenfield pilot needs seeded multi-branch | Low (pilot-specific) |
| G5 | **POST /onboarding** does not server-validate phone/address/service before complete | Medium |
| G6 | **i18n** — wizard English-only; `language` field exists but not used in setup copy | Medium |
| G7 | **Register → setup** is 6 effective steps (2 register + 4 setup) — ON1 says ≤3 to first value | High (research) |
| G8 | **Script stack mismatch** — orchestration doc says Framer Motion + `/app`; repo is `src/app`, motion via CSS/Framer in places | Info |

---

## 6. File path correction for orchestration script

Use `src/app`, `src/components`, `src/lib`, `src/db/schema.ts`, `src/hooks`, `src/app/globals.css` — not root-level `/app`.

---

**Phase 0 complete.** Proceeding to Phase 1 parallel research subagents.
