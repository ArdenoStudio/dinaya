# Ultra PR Ship Review — Rubric Reference

Companion to `SKILL.md`. Operational protocol stays in the skill file.

**Scoring:** 0 = fail · 1 = partial · 2 = pass

**Targets:**
- **Fast path (most PRs):** 10 gates × 2 pts = 20 → **≥17 (85%)** for SHIP candidate
- **Full ledger:** 48 items × 2 pts = 96 → **≥82 (85%)** for complex PRs

---

## Fast-path gate scorecard (20 pts)

| ID | Gate | 2 = Pass |
|----|------|----------|
| G1 | verify | `npm run verify` (or STACK.md equivalent) exit 0 with evidence pasted |
| G2 | migrations | New `00NN_*.sql` + schema file sync; no edited applied migrations |
| G3 | tests | Logic changes have regression or route tests |
| G4 | api-auth | cron/dashboard/v1 patterns match PATHS.md |
| G5 | plan-gates | `requireEntitlement` + entitlement UI gate where tiered |
| G6 | boundaries | no lib → components; no dev SDK in app bundle |
| G7 | secrets | no real keys/secrets in diff |
| G8 | scope | no drive-by refactors |
| G9 | booking | slot holds, idempotency, timezone if booking touched |
| G10 | deploy | new env/cron documented if applicable |

**Ship candidate:** ≥17/20 with zero severity-overlay failures.

---

## Severity overlay (any 0 → auto-blocker)

| Item | Escalation | Blocker ID |
|------|------------|------------|
| G1 / V1 verify fail | **BLOCKER** | B-001 |
| M2 edited applied migration | **REJECT** | B-003 |
| A4 unauthenticated privileged route | **BLOCKER** | B-004 |
| P3 plan bypass via API | **BLOCKER** | B-005 |
| B7 dev SDK in production | **BLOCKER** | B-006 |
| B6 lib imports components | **BLOCKER** | B-007 |
| G7 secret in diff | **BLOCKER** | B-008 |

See [references/blockers.md](./references/blockers.md) for full catalog.

---

## Full ledger sections (96 pts)

### 1. Verification (8 items · 16 pts) — V1–V8

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| V1 | CI verify command | Not run or failed | Partial (lint only) | Full verify pass with output |
| V2 | Lint clean | Errors in diff | Warnings only | Zero new lint errors |
| V3 | Unit tests | Failing or skipped | Pass but no new tests | Pass + coverage for logic |
| V4 | Build | Build fails | Build passes with warnings | Clean production build |
| V5 | Typecheck | TS errors | Implicit any in new code | Strict pass |
| V6 | Targeted tests | None for hotfix | Some paths | All changed modules covered |
| V7 | E2E (if applicable) | Auth/booking broken | Not updated when needed | Updated or N/A documented |
| V8 | Verify evidence | Claimed without output | Partial log | Full tail pasted |

### 2. Schema & migrations (8 items · 16 pts) — M1–M8

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| M1 | New migration file | Schema changed, no SQL | Wrong sequence | `00NN_descriptive.sql` next seq |
| M2 | No edit applied migrations | Old migration edited | Comment-only edit | Forward-only policy upheld |
| M3 | Schema sync | Drift | Partial columns | schema file matches migration |
| M4 | Rollback note | Destructive unnoted | Note in PR | Safe rollout documented |
| M5 | Index strategy | Missing on FK | Partial | Appropriate indexes |
| M6 | Nullable defaults | Breaking without default | Some defaults | Safe defaults for new cols |
| M7 | db:migrate run | Not run locally | Run with issues | Clean apply noted |
| M8 | Drizzle/ORM patterns | Raw SQL anti-pattern | Mixed | Matches neighbor migrations |

### 3. API & auth (12 items · 24 pts) — A1–A12

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| A1 | Route auth present | Missing on privileged route | Partial | Correct require* per prefix |
| A2 | Cron Bearer | Open cron | Wrong header | `CRON_SECRET` pattern |
| A3 | Dashboard session | No requireApiBusiness | Inconsistent | Matches PATHS.md |
| A4 | API key scope | Missing scope | Wrong scope | requireApiKey + scope |
| A5 | Zod validation | Manual parse | Partial schema | Full Zod on POST/PATCH |
| A6 | Error responses | Stack traces leaked | Generic 500 | Safe user messages |
| A7 | Rate limiting | N/A abused endpoint | Partial | Appropriate limits |
| A8 | Webhook verify | No signature check | Weak check | Provider hash/signature |
| A9 | Idempotency | Duplicate writes possible | Partial keys | Idempotency on creates |
| A10 | HTTP codes | Wrong semantics | Mostly correct | 402 for plan, 401/403 correct |
| A11 | Input size limits | Unbounded | Partial | Bounded bodies/uploads |
| A12 | Logging | PII/secrets logged | Verbose | Safe structured logs |

### 4. Plan gating (6 items · 12 pts) — P1–P6

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| P1 | API entitlement | Tiered feature open | UI only gated | requireEntitlement on API |
| P2 | UI gate | Missing ProGate | Partial pages | All dashboard surfaces gated |
| P3 | Bypass path | API bypasses UI gate | Edge case | No bypass |
| P4 | Feature metadata | Hardcoded tiers | Partial | plan-features module used |
| P5 | 402 test | No test | Manual only | Automated 402 test |
| P6 | Copy tiers | Internal names exposed | Mixed | Customer-facing tier names |

### 5. Tests (8 items · 16 pts) — T1–T8

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| T1 | New route test | No test | Smoke only | Auth + happy path |
| T2 | Regression | Bug fix no test | Weak assertion | Repro test added |
| T3 | Mock boundaries | Over-mocked | Some real DB | Appropriate integration |
| T4 | Cron auth test | Missing | Partial mock | CRON_SECRET tested |
| T5 | Webhook test | Missing | Partial | Signature verification |
| T6 | Plan gate test | Missing | UI only | API 402 tested |
| T7 | No test weakening | Tests skipped/gutted | Flaky ignored | Tests strengthened |
| T8 | Fixture hygiene | Hardcoded secrets | Partial | Env-based fixtures |

### 6. Scope & boundaries (6 items · 12 pts) — B1–B6

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| B1 | Minimal diff | Large unrelated refactor | Some drive-by | Focused PR |
| B2 | Import alias | Inconsistent | Mostly `@/` | Consistent alias |
| B3 | Layer boundaries | lib → components | One violation | Clean separation |
| B4 | Dev-only code | Shipped to app | Borderline | .cursor/ only |
| B5 | console.log | Left in prod paths | Debug only | Removed or gated |
| B6 | Comment noise | AI slop comments | Some noise | Meaningful comments only |

### 7. Product invariants (6 items · 12 pts) — I1–I6

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| I1 | Slot holds | Broken reservation | Partial | Server-backed holds |
| I2 | Timezone | UTC-only bug | Partial | Business TZ correct |
| I3 | Payment path | Broken checkout | Partial | Gateway intact |
| I4 | Dark mode | Regressed | Partial | Both themes work |
| I5 | Reduced motion | Ignored | Partial | prefers-reduced-motion |
| I6 | PII in URLs | Exposed | Partial | No PII in query strings |

### 8. Deploy & ops (4 items · 8 pts) — D1–D4

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| D1 | Env vars | New var undocumented | PR note only | Deployment checklist updated |
| D2 | Cron workflow | New job no invoker | Partial | .github/workflows/ added |
| D3 | Feature flag default | Unsafe default | Documented | Safe prod default |
| D4 | Migration deploy order | Risky | Noted | Rollout plan in PR |

---

## Verdict mapping

| Score | Verdict | Action |
|-------|---------|--------|
| Fast ≥17/20, 0 overlay zeros | SHIP | Merge when human approves |
| Any overlay zero or verify fail | FIX | Numbered blockers with B-* IDs |
| Wrong architecture / applied migration edit | REJECT | Stop; redesign |

---

## Handoff

| Result | Next skill |
|--------|------------|
| SHIP + UI | `apple-design-head` |
| SHIP + API/payments | `ultra-security-review` |
| FIX migrations | `ultra-migrations` |
| FIX auth | `ultra-api-auth` |
| FIX plan gates | `ultra-plan-gating` |
