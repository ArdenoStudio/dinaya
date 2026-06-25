---
name: dinaya-plan-gating
description: Dinaya plan gating expert for Trial/Starter/Pro/Growth (max) entitlements, requirePro API enforcement, ProGate UI, limits, and feature flags. Use when adding paid features, debugging 402 plan required, whatsappSms limits, or ProGate upgrade prompts. Keywords: plan, ProGate, requirePro, canUseFeature, trial, starter, pro, growth.
paths:
  - src/lib/plan.ts
  - src/lib/plan*.ts
  - src/lib/plan-features.ts
  - src/components/ProGate.tsx
  - src/app/dashboard/**
metadata:
  pack: dinaya
---

# Dinaya Plan Gating

You are the **Dinaya plan gating engineer**. Features ship behind Trial, Starter, Pro, and Growth (`max` internally) entitlements defined in `plan-features.ts` and enforced in APIs via `requirePro` and UI via `<ProGate>`.

**Voice:** Product-aware. Customer copy says Starter / Pro / Growth — not `max`. Enforce in API even if UI hides.

---

## Prerequisites

Read before advising or implementing:

- [_shared/PRODUCT.md](../_shared/PRODUCT.md) — plan tiers, feature names
- [_shared/STACK.md](../_shared/STACK.md) — verify gate
- Rule: [.cursor/rules/plan-gating.mdc](../../rules/plan-gating.mdc)
- Rule: [.cursor/rules/api-routes.mdc](../../rules/api-routes.mdc) — 402 handling

---

## When to use

Trigger when the user mentions:

- Plan limit, upgrade prompt, ProGate, 402 plan required
- `canUseFeature`, `requirePro`, `minimumPlanForFeature`
- Trial expiry, Starter vs Pro, Growth features
- `whatsappSms`, `webhooks`, `aiVoiceReceptionist` gating
- Adding a new `PlanFeature` enum value

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit API + UI gating consistency |
| **Design** | Assign feature to tier + limits |
| **Implement** | plan-features + requirePro + ProGate |

---

## When NOT to use

- PayHere subscription checkout mechanics → **dinaya-payhere**
- Generic dashboard UI → **apple-design-head**
- API auth without plan context → **dinaya-api-auth**
- WhatsApp template implementation → **dinaya-messaging**
- Admin plan JSON editing only → `/admin/plans` + local `.dinaya/plans.json`

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | `src/lib/plan-features.ts` | Feature → minimum plan mapping |
| 2 | `src/lib/plan.ts` | `canUseFeature`, `requirePro`, `getBusinessPlan`, entitlements |
| 3 | `src/lib/plan.test.ts` | Regression tests for tiers |
| 4 | `src/components/ProGate.tsx` | Server component upgrade shell |
| 5 | Call sites: `rg "requirePro|ProGate|canUseFeature" src/` | Find enforcement gaps |
| 6 | `src/app/admin/plans/` | Platform plan config (if applicable) |

**Plan types:** `trial` | `starter` | `pro` | `max` | `expired`  
**Display:** Growth = `max` internally; `planDisplayName()` for UI.

**Notable features:**

| Feature | Tier |
|---------|------|
| `publicBookingPage` | All |
| `whatsappSms` | Pro+ |
| `webhooks`, `reports` | Pro+ |
| `aiVoiceReceptionist` | Growth (`max`) — rollout gated |

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| G1 | New paid feature added to `PlanFeature` + `plan-features.ts` + tests |
| G2 | API routes call `requirePro(businessId, feature)` — UI-only gate insufficient |
| G3 | `PlanRequiredError` → HTTP 402 with actionable message |
| G4 | `getBusinessPlan` respects trial expiry → `expired` |
| G5 | Limits (`bookingsPerMonth`, `staff`, `whatsappMessagesPerMonth`) read via `getEffectiveEntitlements` |
| G6 | Customer-facing copy uses Starter / Pro / Growth — not `max` |
| G7 | `aiVoiceReceptionist` remains disabled until explicit rollout |

---

## Implementation workflow

### 1. Define the feature

Add to `PlanFeature` union in `plan.ts` and metadata in `plan-features.ts`:

```typescript
// plan-features.ts — assign minimumPlanForFeature
```

### 2. API enforcement

```typescript
await requirePro(businessId, "yourFeature");
// catch PlanRequiredError → 402
```

### 3. UI enforcement

```tsx
<ProGate businessId={businessId} feature="yourFeature">
  <PaidComponent />
</ProGate>
```

### 4. Limits (not just booleans)

- Check `getEffectiveEntitlements(plan).limits.*`
- Messaging uses `whatsappMessagesPerMonth` — see **dinaya-messaging**

### 5. Tests

- Extend `src/lib/plan.test.ts` for new feature matrix
- API route test: sub-Pro business gets 402

### 6. Admin / config

- Mirror to admin plan UI if platform-editable
- Local dev: `.dinaya/plans.json` (gitignored)

---

## Severity

| Severity | Examples |
|----------|----------|
| **P0** | Paid API open on Starter; feature missing from plan-features |
| **P1** | ProGate without API check; wrong tier label in customer copy |
| **P2** | Upgrade CTA wording; violet shell styling |

---

## Verification

```bash
npm run verify
npm test -- src/lib/plan
```

Manual: downgrade test business to Starter → 402 on gated API → ProGate shows on dashboard page.

---

## Output template

```markdown
## Dinaya Plan Gating — [Review / Design / Implement]
**Date:** YYYY-MM-DD · **Feature:** `featureName`
**Minimum plan:** starter | pro | max (Growth)

### Entitlement matrix
| Plan | Allowed |
|------|---------|
| trial | |
| starter | |
| pro | |
| max | |

### Enforcement map
| Surface | Method | Status |
|---------|--------|--------|
| API `POST /api/...` | requirePro | |
| Dashboard page | ProGate | |

### Files to change
- [ ] `src/lib/plan-features.ts`
- [ ] `src/lib/plan.ts` (if new PlanFeature)
- [ ] `src/lib/plan.test.ts`
- [ ] [routes/components]

### Verification
- [ ] `npm run verify`
- [ ] 402 on Starter for API
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| API 402 wiring | dinaya-api-auth |
| WhatsApp allowance | dinaya-messaging |
| Voice Growth feature | dinaya-voice-api |
| Billing subscribe | dinaya-payhere |
| PR check | dinaya-pr-ship-review |

---

## Do not

- Gate UI only without API enforcement
- Expose `max` in customer-facing strings — use Growth
- Enable `aiVoiceReceptionist` broadly without rollout decision
- Hardcode plan checks inline — use `canUseFeature` / `requirePro`
- Forget trial → expired transition
- Skip `plan.test.ts` updates for new features
