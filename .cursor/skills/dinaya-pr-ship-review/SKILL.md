---
name: dinaya-pr-ship-review
description: Engineering PR ship gate for Dinaya. Use before merge — verify npm run verify, migrations, tests, plan gates, API auth patterns, scope discipline, and AGENTS.md conventions. Checklist-driven with blockers vs warnings. Not a design or brand review.
metadata:
  pack: dinaya
  version: "1.0"
paths:
  - drizzle/**
  - src/db/schema.ts
  - src/app/api/**
  - src/lib/**
  - e2e/**
  - .github/workflows/**
---

# Dinaya PR Ship Review — Engineering Gate

You are **Dinaya's engineering lead** deciding if a PR is safe to merge. You enforce repo conventions from `AGENTS.md` and `.cursor/rules/` — not subjective design taste. Default stance: **block on red**, **note on yellow**, **ship on green**.

**Output:** Checklist verdict **SHIP** | **FIX** | **REJECT** with explicit blockers.

---

## Prerequisites

Read:
- [_shared/STACK.md](../_shared/STACK.md) — verify gate, boundaries
- [_shared/PATHS.md](../_shared/PATHS.md) — API auth patterns
- [_shared/PRODUCT.md](../_shared/PRODUCT.md) — plan gating reference
- `AGENTS.md` — migrations, testing, conventions

---

## When to use

Trigger when the user says:
- "PR ready?", "ship this PR", "merge review", "pre-merge check"
- After feature work before opening or merging a PR
- CI failed — diagnose what blocks ship

**When NOT to use:**
- Brand/copy audit → `dinaya-brand-voice` / `dinaya-content-review`
- Visual tokens → `dinaya-visual-system` / `apple-design-head`
- Deep security threat model → `dinaya-security-review` (run in parallel for API/payment PRs)
- Domain implementation how-to → engineering skills (`dinaya-booking-engine`, etc.)

**Modes:**

| Mode | Scope |
|------|-------|
| **Full** | Diff + verify + migrations + tests + conventions |
| **Diff-only** | Changed files checklist without running verify |
| **Hotfix** | Minimal path — tests for touched area + security P0 |
| **Re-check** | After FIX items addressed |

---

## Phase 0 — PR discovery

### 0.1 Gather context

```bash
git diff --name-only origin/master...HEAD 2>/dev/null || git diff --name-only HEAD~1
git log --oneline -5
```

Record: PR title intent, files touched, migration files added, API routes added.

### 0.2 Classify change type

| Type | Extra gates |
|------|-------------|
| Schema | New `drizzle/00NN_*.sql` + `schema.ts` sync |
| API | Auth pattern + Zod + plan gate |
| Booking UI | Slot holds, idempotency, timezone, dark mode |
| Payments | PayHere + webhook tests |
| Plan gating | `requirePro` API + `<ProGate>` UI |
| Docs only | No verify required unless misleading |
| Cursor/skills | Dev-only — no `src/app` production impact |

### 0.3 Scope discipline

| Check | Block if |
|-------|----------|
| Minimal diff | Drive-by refactors unrelated to PR goal |
| Layer boundaries | `src/lib/` imports from `src/components/` |
| Production boundary | `@cursor/sdk` in app bundle |
| Secrets in diff | Any real key, merchant secret, `CRON_SECRET` value |

---

## Ship checklist (run in order)

### 1. Verification gate (BLOCKER)

```bash
npm run verify   # lint + test + build — matches CI
```

| Result | Verdict |
|--------|---------|
| Pass | Continue |
| Fail | **FIX** — paste failing step; do not ship |

Optional targeted runs when full verify is heavy:
```bash
npm test -- path/to/changed.test.ts
npm run lint
npm run build
```

### 2. Migrations (BLOCKER if schema changed)

| Check | Pass |
|-------|------|
| New file `drizzle/00NN_descriptive_name.sql` — next sequence | Yes |
| `src/db/schema.ts` updated to match | Yes |
| No edits to already-applied migration files | Yes |
| Rollback/safety considered for prod data | Noted in PR |

```bash
ls -1 drizzle/*.sql | tail -3
rg 'CREATE TABLE|ALTER TABLE' drizzle/*.sql --glob 'drizzle/00*.sql' | tail -5
```

If schema changed locally: `npm run db:migrate` (note in review if not run).

### 3. Tests (BLOCKER for logic changes)

| Change | Expect |
|--------|--------|
| New API route | Route test or integration test |
| Bug fix | Regression test |
| Plan gate | Test for 402 / Pro required |
| Cron | Auth test with `CRON_SECRET` mock |
| PayHere/webhook | Hash verification test |

```bash
rg '\.test\.ts' --glob 'src/**' -l | xargs -I{} basename {} | sort -u | tail -20
```

**Do not** weaken or skip tests for green CI.

### 4. API auth (BLOCKER for new/changed routes)

| Prefix | Required |
|--------|----------|
| `/api/cron/*` | `Authorization: Bearer $CRON_SECRET` |
| `/api/dashboard/*` | `requireApiBusiness()` |
| `/api/v1/*` | `requireApiKey(req, scope)` |
| Paid features | `requirePro(businessId, feature)` |

Cross-check [_shared/PATHS.md](../_shared/PATHS.md). Escalate to `dinaya-security-review` for payment/webhook PRs.

### 5. Plan gating (BLOCKER if feature is tiered)

| Layer | Check |
|-------|-------|
| API | `requirePro` throws → HTTP 402 |
| UI | `<ProGate feature="…">` on dashboard pages |
| Copy | Customer tier = Growth not "max" |

Feature metadata: `src/lib/plan-features.ts`, `src/lib/plan.ts`.

### 6. Booking engine invariants (BLOCKER for `/book` changes)

From [_shared/STACK.md](../_shared/STACK.md) — preserve unless intentional product change:
- Slot holds + server-backed reservations
- Idempotency keys on booking create
- Business timezone via `availability.ts`
- PayHere / manual pay paths intact
- Dark mode + `prefers-reduced-motion`
- No PII in URLs

### 7. Code conventions (WARNING → BLOCKER if systematic)

| Rule | Check |
|------|-------|
| `@/` imports | Used consistently |
| Zod validation | POST/PATCH bodies validated |
| Match neighbors | Naming/style consistent |
| No `console.log` | Left in production paths |
| Error handling | User-safe messages |

### 8. E2E impact (WARNING)

If PR touches auth, booking flow, or plan gates:
- Note if `e2e/` specs need update
- CI runs e2e when secrets set — flag missing coverage

### 9. Env & deploy (WARNING)

| Item | Note |
|------|------|
| New env var | Document in `docs/deployment-checklist.md` |
| Cron schedule | `.github/workflows/` invoker if new job |
| Feature flag | Default safe for production |

### 10. Parallel reviews (RECOMMENDED)

| PR touches | Also run |
|------------|----------|
| UI components | `apple-design-head` or `dinaya-visual-system` |
| Customer copy | `dinaya-brand-voice` |
| Payments/secrets | `dinaya-security-review` |

---

## Verdict rules

| Verdict | Criteria |
|---------|----------|
| **SHIP** | `npm run verify` passes; 0 blockers; warnings documented or trivial |
| **FIX** | Verify fail; missing migration sync; missing auth; missing tests for logic; plan gate hole |
| **REJECT** | Wrong architecture; breaks booking invariants; secrets committed; edits applied migrations |

**Blockers (any one = FIX or REJECT):**
1. `npm run verify` fails
2. Schema change without migration + `schema.ts`
3. Edited historical migration file
4. Unauthenticated privileged API
5. Plan-gated feature open on Starter via API
6. `@cursor/sdk` or secrets in production paths
7. `src/lib` imports components

---

## Review workflow

1. **Discover** — `git diff`, classify change
2. **Run** — `npm run verify` (required for SHIP)
3. **Check** — Migrations → tests → auth → plan gates → booking invariants
4. **Scan** — Scope, secrets, layer violations
5. **Verdict** — SHIP / FIX / REJECT with numbered blockers
6. **Handoff** — List follow-up skills if needed

---

## Output template

```markdown
## Dinaya PR Ship Review
**Verdict:** SHIP | FIX | REJECT
### Checklist: verify · migrations · tests · API auth · plan gates · booking invariants · scope
### Blockers (numbered) · Warnings · Follow-up reviews (security / design)
```

---

## Related skills

| Skill | When |
|-------|------|
| `dinaya-security-review` | API, cron, webhooks, secrets |
| `dinaya-migrations` | Complex schema design |
| `dinaya-api-auth` | New route scaffolding |
| `dinaya-plan-gating` | Entitlement changes |
| `dinaya-payhere` | Payment flow changes |
| `dinaya-hub` | Unsure which specialist to invoke |

---

## Do not

- Ship with failing `npm run verify`
- Approve schema drift (code without migration)
- Skip auth review on new `/api/*` routes
- Treat missing plan-gate tests as optional for paid features
- Edit migrations that may be applied in production
- Weaken tests to green CI
- Conflate this gate with brand or visual review — link those separately
