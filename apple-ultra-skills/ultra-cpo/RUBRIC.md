# Ultra CPO — Rubric Reference

Companion to `SKILL.md`. Score **0 / 1 / 2** per item.

---

## R0 Pain (30%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| P1 | Owner-validated | Founder fantasy | Anecdotal | Outreach/support evidence |
| P2 | Frequency | Rare edge | Monthly | Weekly workflow pain |
| P3 | Pain language | Feature names | Mixed | DMs, no-shows, deposits, reviews |
| P4 | Status quo cost | Neutral | Minor annoyance | Clear money/time loss |
| P5 | Beachhead fit | Off-vertical | Adjacent | target customer/barber/spa cluster |

## R1 Plan fit (25%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| G1 | Tier table | Violates PRODUCT.md | Ambiguous | Matches gating class |
| G2 | API enforce | UI only | Partial `requireEntitlement` | API + entitlement gate component |
| G3 | Limits | Ignores primary messaging channel/staff caps | Mentioned | Enforced in plan.ts |
| G4 | Feature label | Ad-hoc name | Close | Exact `plan.ts` label |
| G5 | Upgrade story | None | Weak | Clear tier upsell moment |

## R2 Activation (20%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| A1 | First booking | No path | Indirect | Direct booking impact |
| A2 | Customer-visible | Internal only | Partial | `/book/[slug]` improvement |
| A3 | Time-to-value | >1 week setup | Days | Same session / concierge |
| A4 | Repeat bookings | N/A only | Possible | CRM/reminder loop |

## R3 Scope (15%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| S1 | MVP size | Multi-quarter | One quarter | ≤2 week founder slice |
| S2 | Defer list | None | Implicit | Named v2+ cuts |
| S3 | Schema | Breaking change | Risky | Additive migration |
| S4 | Verify path | Untested | Partial | `npm run verify` (see _shared/STACK.md) planned |

## R4 Cannibalization (10%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| C1 | Booking hub | Extra steps/clutter | Minor | Preserves core flow |
| C2 | Positioning | "AI platform" creep | Mixed | Booking page first |
| C3 | Nav pillar | Orphan item | New section | Fits route-map pillar |

---

## Severity overlay

| Fail | Escalation |
|------|------------|
| G1 messaging on Starter | **P0** |
| G1 AI on wrong tier | **P0** |
| A1 no booking path for core feature | **P1** |
| S1 no defer list, scope >1 quarter | **P1** |
| C1 breaks slot hold / payment gateway | **P0** |

**SHIP:** weighted **≥85** · **0 P0** · **≤2 P1**
