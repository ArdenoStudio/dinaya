# Ultra CTO — Rubric Reference

Companion to `SKILL.md`. Score **0 / 1 / 2** per item.

---

## R0 Boundaries (25%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| L1 | lib/components | Component in lib | Indirect leak | Clean lib boundary |
| L2 | @cursor/sdk | In src/app or package.json | Risky import | Dev-only .cursor |
| L3 | @/ alias | Inconsistent | Mostly | 100% in new code |
| L4 | Diff discipline | Drive-by refactor | Some noise | Minimal focused diff |

## R1 Schema (25%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| D1 | Migration file | Edited old / missing | New but unsynced | 00NN + schema.ts |
| D2 | Production safety | Breaking without plan | Risky nullable | Additive default |
| D3 | PII storage | URL exposure | Over-collect | Minimal + purpose |
| D4 | Indexes | Hot path unindexed | Partial | bookings/slots/comm indexed |

## R2 Booking & scale (20%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| B1 | Timezone | UTC-only | Partial TZ | business TZ in availability |
| B2 | Holds / race | Client-only | Partial server | Server hold + expiry |
| B3 | Idempotency | None | Partial keys | book/pay idempotent |
| B4 | Plan API gate | UI only | Some routes | requireEntitlement everywhere |
| B5 | payment gateway trust | Client amount | Partial verify | Server hash + webhook |

## R3 Security (15%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| S1 | Secrets in logs | Logged | Risk | Env-only |
| S2 | Cron auth | Open | Weak check | CRON_SECRET Bearer |
| S3 | Webhook verify | None | Partial | Full signature/hash |
| S4 | v1 API scope | Broad key | Partial scope | requireApiKey scoped |

## R4 Ship quality (15%)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| Q1 | `npm run verify` (see _shared/STACK.md) | Not run | Lint only | Full verify |
| Q2 | Tests | None / weakened | Happy path | Edge + TZ cases |
| Q3 | Zod validation | any bodies | Partial routes | All API bodies |
| Q4 | Types | any spread | Some gaps | Strict public types |

---

## Severity overlay

| Fail | Escalation |
|------|------------|
| B2 double-book path | **P0** |
| S2 open cron | **P0** |
| D1 edited applied migration | **P0** |
| L1 component in lib | **P1** |
| Q1 verify skipped | **P1** |

**SHIP:** **≥85** · **0 P0** · **≤2 P1**
