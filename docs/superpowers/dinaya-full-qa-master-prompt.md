# Dinaya Full-Stack QA — Master Prompt

Copy everything below the line into a new Cursor agent chat. Replace `TARGET` with `local` or `https://dinaya.lk`.

---

## MASTER PROMPT (copy from here)

You are running a **full Dinaya platform QA pass** — marketing site, auth, dashboard, public booking, embed, discover, plan gates, APIs, and integrations. Use the Dinaya skill pack; do not skip layers.

**Target:** `TARGET` (if local: start dev server on port 3001, ensure `.env.local` has `DATABASE_URL` + `AUTH_SECRET`)

### Phase 0 — Setup

1. Read `.cursor/skills/dinaya-hub/SKILL.md` and route yourself across skills as needed.
2. Read `.cursor/skills/_shared/STACK.md`, `PRODUCT.md`, `PATHS.md`.
3. Run automated baseline:
   ```bash
   npm run verify
   E2E_DISABLE_RATE_LIMIT=true npm run test:e2e
   ```
4. Record pass/fail for each e2e spec in `e2e/`. Note skips from `e2e/MANUAL_INTEGRATION_CHECKLIST.md`.

### Phase 1 — Marketing & public site

Test at **375px and 1280px**, light + dark where available.

| Route | Check |
|-------|-------|
| `/` | Hero, CTA, demo/booking widget, no broken links |
| `/pricing` | Starter/Pro/Growth cards, LKR prices, annual toggle |
| `/features`, `/solutions`, `/about`, `/our-story` | Copy, nav, footer |
| `/help`, `/docs/*` | Docs load, search if present |
| `/legal/terms`, `/legal/privacy`, `/legal/refund` | Render |
| `/discover`, `/discover/[city]` | Listings load |
| `/whats-new` | Renders |

**Skills:** `dinaya-brand-voice`, `dinaya-content-review`, `dinaya-visual-system`, `apple-design-head` (marketing surfaces)

### Phase 2 — Auth flows

| Route | Check |
|-------|-------|
| `/register` | Create test business or use existing e2e account |
| `/auth/signin` | Login, error states, redirect to dashboard |
| `/forgot-password`, `/reset-password` | Forms render (full flow if mail configured) |
| `/accept-invite` | Page loads |

### Phase 3 — Dashboard (authenticated)

Login as **Starter**, **Pro**, and **Growth** test accounts (or flip plan via SQL per `e2e/MANUAL_INTEGRATION_CHECKLIST.md`).

**Workspace:** `/dashboard`, `/dashboard/calendar`, `/dashboard/bookings`, `/dashboard/clients`

**Catalog:** `/dashboard/services`, `/dashboard/staff`, `/dashboard/locations`, `/dashboard/availability`

**Growth:** `/dashboard/reviews`, `/dashboard/payments`, `/dashboard/marketing`, `/dashboard/deals`, `/dashboard/broadcasts`, `/dashboard/ai`, `/dashboard/reports`

**Configure:** `/dashboard/settings`, `/dashboard/settings/integrations`, `/dashboard/settings/api-keys`, `/dashboard/settings/webhooks`, `/dashboard/billing`, `/dashboard/automations`

For each route: page loads, no 500, primary action works, plan gates match tier (`dinaya-plan-gating`).

**Skills:** `dinaya-plan-gating`, `apple-design-head` (dashboard density, empty states)

### Phase 4 — Public booking (critical path)

Pick a test business slug from e2e helpers or register fresh.

| Step | Route / action | Check |
|------|----------------|-------|
| Hub | `/book/[slug]` | Services list, branding, mobile layout |
| Service | `/book/[slug]/[serviceSlug]` | Date → time → form state machine |
| Hold | Select slot | Hold succeeds, timer if shown |
| Confirm | Submit booking | Confirmation or pay redirect |
| Pay | `/book/[slug]/pay` | PayHere redirect (sandbox if configured) |
| Done | `/book/[slug]/confirmed` | Details, add to calendar, payment poller |
| Manage | Reschedule/cancel token URL | `e2e/reschedule.spec.ts` path |
| Embed | `/embed/book/[slug]` | Widget, resize, no double scroll |
| Deals | Book with active deal | Discount applied if deal exists |

**Skills:** `dinaya-booking-engine`, `dinaya-payhere`, `apple-design-head` (checkout + scheduling patterns SC1–SC10)

### Phase 5 — Plan gate matrix

Verify UI matches `e2e/plan-features.spec.ts` expectations:

- **Starter:** public booking ✓, automations/deals/webhooks blocked
- **Pro:** automations, deals, calendar, webhooks ✓; AI Hub blocked
- **Growth:** AI Hub, voice setup, customization ✓

**Skill:** `dinaya-plan-gating`

### Phase 6 — APIs & integrations (smoke)

| Area | Check |
|------|-------|
| Dashboard APIs | Key routes return 200/402 as expected (`e2e/manual-integration.spec.ts`) |
| Cron | Routes reject without `CRON_SECRET` |
| v1 voice | `/api/v1/` with API key on Growth (`dinaya-voice-api`) |
| Webhooks | Create/list webhooks on Pro+ |
| Google Calendar | Connect UI on Pro+ (skip OAuth if no credentials) |
| Messaging | WhatsApp/SMS channel visible on Pro+ (`dinaya-messaging`) |

**Skills:** `dinaya-api-auth`, `dinaya-security-review`

### Phase 7 — Admin (if platform admin access)

`/admin`, `/admin/accounts`, `/admin/plans`, `/admin/health`, `/admin/subscriptions`

**Skill:** `dinaya-security-review` (admin auth)

### Phase 8 — Executive & brand scoring

Run scored reviews on findings:

| Skill | Question |
|-------|----------|
| `dinaya-ceo` | Is the overall product coherent for SL salon beachhead? |
| `dinaya-cpo` | Any broken activation path blocking first real booking? |
| `dinaya-cfo` | Pricing page accurate vs `src/lib/plan.ts`? |
| `dinaya-brand-voice` | Marketing copy violations? |
| `dinaya-visual-system` | Token violations on booking hub? |
| `dinaya-pr-ship-review` | Would you ship this build? |
| `apple-design-head` | Booking + checkout + dashboard ship gate |

### Phase 9 — Final report

Produce this exact structure:

```markdown
# Dinaya Full QA Report
**Date:** YYYY-MM-DD · **Target:** [local|production] · **Commit:** [sha]

## Summary
- **Automated:** verify [PASS/FAIL] · e2e [PASS/FAIL/SKIP count]
- **Manual:** [routes tested] · **Blockers:** [count]

## P0 — Ship blockers
- [ ] ...

## P1 — Fix before release
- [ ] ...

## P2 — Backlog
- [ ] ...

## Surface scores
| Surface | Score | Verdict | Skill |
|---------|-------|---------|-------|
| Marketing | /100 | | brand-voice + apple-design-head |
| Booking flow | /100 | | booking-engine + apple-design-head |
| Dashboard | /100 | | plan-gating + apple-design-head |
| Security | /100 | | security-review |
| Overall | /100 | SHIP/ITERATE/REJECT | pr-ship-review |

## Automated test log
| Spec | Result |
|------|--------|

## Manual test log
| Route | 375 | 1280 | Dark | Notes |

## Skills invoked
- [list]

## Recommended next actions
1. ...
```

### Rules

- Fix P0s if in agent mode with permission; otherwise document with file paths.
- Use `computerUse` or screenshots for visual defects — cite route + viewport.
- Never log secrets. PayHere/Google/WhatsApp tests skip gracefully if env missing.
- Match Dinaya voice in report — practical, specific, file paths for every finding.
- Run `npm run verify` again after any fixes.

---

## Quick local commands

```bash
# Terminal 1
npm run dev -- -p 3001

# Terminal 2
npm run verify
E2E_DISABLE_RATE_LIMIT=true npm run test:e2e

# Optional live production smoke (read-only)
PLAYWRIGHT_BASE_URL=https://dinaya.lk npm run test:e2e -- e2e/live-vercel.spec.ts
```

## Skill routing cheat sheet

| Finding type | Skill |
|--------------|-------|
| Wrong plan gate | dinaya-plan-gating |
| Slot/hold bug | dinaya-booking-engine |
| Payment webhook | dinaya-payhere |
| Copy/positioning | dinaya-brand-voice |
| Colors/tokens | dinaya-visual-system |
| UI craft | apple-design-head |
| Auth/secrets | dinaya-security-review |
| Strategy call | dinaya-ceo |
