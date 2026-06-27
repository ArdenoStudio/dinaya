---
name: ultra-plan-gating
description: your product plan gating expert for Trial/Starter/Pro/Growth (max) entitlements, requireEntitlement API enforcement, entitlement gate component UI, limits, and feature flags. Use when adding paid features, debugging 402 plan required, primary-messagingSms limits, or entitlement gate component upgrade prompts. Keywords: plan, entitlement gate component, requireEntitlement, canUseFeature, trial, starter, pro, growth.
paths:
  - `your entitlements module` (see _shared/PATHS.md)
  - src/lib/plan*.ts
  - `your feature metadata module` (see _shared/PATHS.md)
  - src/components/entitlement gate component.tsx
  - src/app/dashboard/**
metadata:
  pack: ultra
---

# Ultra Plan Gating

You are the **your product plan gating engineer**. Features ship behind Trial, Starter, Pro, and Growth (`max` internally) entitlements defined in `plan-features.ts` and enforced in APIs via `requireEntitlement` and UI via `<entitlement gate component>`.

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

- Plan limit, upgrade prompt, entitlement gate component, 402 plan required
- `canUseFeature`, `requireEntitlement`, `minimumPlanForFeature`
- Trial expiry, Starter vs Pro, Growth features
- `primary-messagingSms`, `webhooks`, `aiVoiceReceptionist` gating
- Adding a new `PlanFeature` enum value

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit API + UI gating consistency |
| **Design** | Assign feature to tier + limits |
| **Implement** | plan-features + requireEntitlement + entitlement gate component |

---

## When NOT to use

- payment gateway subscription checkout mechanics → **ultra-payments**
- Generic dashboard UI → **apple-design-head**
- API auth without plan context → **ultra-api-auth**
- messaging template implementation → **ultra-messaging**
- Admin plan JSON editing only → `/admin/plans` + local `.your-product/plans.json`

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | ``your feature metadata module` (see _shared/PATHS.md)` | Feature → minimum plan mapping |
| 2 | `your entitlements module` (see _shared/PATHS.md) | `canUseFeature`, `requireEntitlement`, `getBusinessPlan`, entitlements |
| 3 | `src/lib/plan.test.ts` | Regression tests for tiers |
| 4 | `src/components/entitlement gate component.tsx` | Server component upgrade shell |
| 5 | Call sites: `rg "requireEntitlement|entitlement gate component|canUseFeature" src/` | Find enforcement gaps |
| 6 | `src/app/admin/plans/` | Platform plan config (if applicable) |

**Plan types:** `trial` | `starter` | `pro` | `max` | `expired`  
**Display:** Growth = `max` internally; `planDisplayName()` for UI.

**Notable features:**

| Feature | Tier |
|---------|------|
| `publicBookingPage` | All |
| `primary-messagingSms` | Pro+ |
| `webhooks`, `reports` | Pro+ |
| `aiVoiceReceptionist` | Growth (`max`) — rollout gated |

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| G1 | New paid feature added to `PlanFeature` + `plan-features.ts` + tests |
| G2 | API routes call `requireEntitlement(businessId, feature)` — UI-only gate insufficient |
| G3 | `PlanRequiredError` → HTTP 402 with actionable message |
| G4 | `getBusinessPlan` respects trial expiry → `expired` |
| G5 | Limits (`bookingsPerMonth`, `staff`, `primary-messagingMessagesPerMonth`) read via `getEffectiveEntitlements` |
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
await requireEntitlement(businessId, "yourFeature");
// catch PlanRequiredError → 402
```

### 3. UI enforcement

```tsx
<entitlement gate component businessId={businessId} feature="yourFeature">
  <PaidComponent />
</entitlement gate component>
```

### 4. Limits (not just booleans)

- Check `getEffectiveEntitlements(plan).limits.*`
- Messaging uses `primary-messagingMessagesPerMonth` — see **ultra-messaging**

### 5. Tests

- Extend `src/lib/plan.test.ts` for new feature matrix
- API route test: sub-Pro business gets 402

### 6. Admin / config

- Mirror to admin plan UI if platform-editable
- Local dev: `.your-product/plans.json` (gitignored)

---

## Severity

| Severity | Examples |
|----------|----------|
| **P0** | Paid API open on Starter; feature missing from plan-features |
| **P1** | entitlement gate component without API check; wrong tier label in customer copy |
| **P2** | Upgrade CTA wording; violet shell styling |

---

## Verification

```bash
`npm run verify` (see _shared/STACK.md)
npm test -- src/lib/plan
```

Manual: downgrade test business to Starter → 402 on gated API → entitlement gate component shows on dashboard page.

---

## Output template

```markdown
## Ultra Plan Gating — [Review / Design / Implement]
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
| API `POST /api/...` | requireEntitlement | |
| Dashboard page | entitlement gate component | |

### Files to change
- [ ] ``your feature metadata module` (see _shared/PATHS.md)`
- [ ] `your entitlements module` (see _shared/PATHS.md) (if new PlanFeature)
- [ ] `src/lib/plan.test.ts`
- [ ] [routes/components]

### Verification
- [ ] `npm run verify` (see _shared/STACK.md)
- [ ] 402 on Starter for API
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| API 402 wiring | ultra-api-auth |
| messaging allowance | ultra-messaging |
| Voice Growth feature | ultra-integrations |
| Billing subscribe | ultra-payments |
| PR check | ultra-pr-ship-review |

---

## Do not

- Gate UI only without API enforcement
- Expose `max` in customer-facing strings — use Growth
- Enable `aiVoiceReceptionist` broadly without rollout decision
- Hardcode plan checks inline — use `canUseFeature` / `requireEntitlement`
- Forget trial → expired transition
- Skip `plan.test.ts` updates for new features
