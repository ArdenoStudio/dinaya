---
name: ultra-pr-ship-review
description: >
  Engineering PR ship gate. Use before merge — verify npm run verify, migrations, tests,
  plan gates, API auth, scope discipline. Checklist-driven SHIP|FIX|REJECT with blocker IDs.
  Triggers: "PR ready?", "ship this PR", "merge review", "pre-merge check", "CI failed",
  "can I merge?", "engineering review" — even if user does not say "PR ship review".
metadata:
  pack: apple-ultra
  version: "1.1"
paths:
  - drizzle/**
  - "**/migrations/**"
  - src/db/**
  - src/app/api/**
  - src/lib/**
  - e2e/**
  - .github/workflows/**
reads:
  - AGENTS.md
  - CONTRIBUTING.md
  - ../_shared/STACK.md
  - ../_shared/PATHS.md
  - ../_shared/PRODUCT.md
  - .ultra-ship.md
writes:
  - .ultra-ship.md
  - .ultra-ship/latest.md
chains:
  parallel_when:
    - condition: touches API, webhooks, or payments
      skills: [ultra-security-review]
    - condition: touches UI components or booking pages
      skills: [apple-design-head]
---

# Ultra PR Ship Review — Engineering Gate

You are **the product's engineering lead** deciding if a PR is safe to merge. You enforce repo conventions from `AGENTS.md` / `CONTRIBUTING.md` and `.cursor/rules/` — not subjective design taste. Default stance: **block on red**, **note on yellow**, **ship on green**.

**Output:** Checklist verdict **SHIP** | **FIX** | **REJECT** with explicit blockers using **B-*** / **W-*** IDs from [references/blockers.md](./references/blockers.md).

**Rubric:** Fast path and full ledger in [RUBRIC.md](./RUBRIC.md).

---

## Prerequisites

Read:
- [_shared/STACK.md](../_shared/STACK.md) — verify command, boundaries, migration paths
- [_shared/PATHS.md](../_shared/PATHS.md) — API auth patterns
- [_shared/PRODUCT.md](../_shared/PRODUCT.md) — plan gating reference
- `AGENTS.md` or `CONTRIBUTING.md` — migrations, testing, conventions
- `.ultra-ship.md` (if present) — prior review history

---

## When to use

Trigger when the user says:
- "PR ready?", "ship this PR", "merge review", "pre-merge check"
- After feature work before opening or merging a PR
- CI failed — diagnose what blocks ship

**When NOT to use:**
- Brand/copy audit → `ultra-brand-voice` / `ultra-content-review`
- Visual tokens → `ultra-visual-system` / `apple-design-head`
- Deep security threat model → `ultra-security-review` (run in parallel for API/payment PRs)
- Domain implementation how-to → engineering skills (`ultra-scheduling-engine`, etc.)

**Modes:**

| Mode | Scope |
|------|-------|
| **Full** | Diff + verify + migrations + tests + conventions |
| **Diff-only** | Changed files checklist without running verify |
| **Hotfix** | Minimal path — tests for touched area + security P0 |
| **Re-check** | After FIX items addressed; read `.ultra-ship/latest.md` |

---

## Subagent dispatch (large PRs)

For diffs >150 lines or multi-commit PRs, use isolated reviewer:

```bash
BASE_SHA=$(git merge-base origin/main HEAD)
HEAD_SHA=$(git rev-parse HEAD)
./scripts/review-package.sh "$BASE_SHA" "$HEAD_SHA"
```

Dispatch `generalPurpose` subagent with [agents/ship-reviewer-prompt.md](./agents/ship-reviewer-prompt.md). Never pass session history — only DESCRIPTION, PLAN, SHAs, and DIFF_FILE.

---

## Phase 0 — PR discovery

### 0.1 Gather context

```bash
git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1
git log --oneline -5
```

Record: PR title intent, files touched, migration files added, API routes added.

### 0.2 Classify change type

| Type | Extra gates |
|------|-------------|
| Schema | New `00NN_*.sql` + schema file sync (see STACK.md paths) |
| API | Auth pattern + Zod + plan gate |
| Booking UI | Slot holds, idempotency, timezone, dark mode |
| Payments | Payment gateway + webhook tests |
| Plan gating | `requireEntitlement` API + entitlement UI gate |
| Docs only | No verify required unless misleading |
| Cursor/skills | Dev-only — no production app impact |

### 0.3 Scope discipline

| Check | Block if |
|-------|----------|
| Minimal diff | Drive-by refactors unrelated to PR goal |
| Layer boundaries | lib imports from components (B-007) |
| Production boundary | dev SDK in app bundle (B-006) |
| Secrets in diff | Any real key or secret value (B-008) |

---

## Ship checklist (run in order)

### 1. Verification gate (BLOCKER B-001)

```bash
npm run verify   # or command from STACK.md — lint + test + build
```

| Result | Verdict |
|--------|---------|
| Pass | Continue |
| Fail | **FIX** — paste failing step; do not ship |

### 2. Migrations (BLOCKER B-002, REJECT B-003)

| Check | Pass |
|-------|------|
| New file `00NN_descriptive_name.sql` — next sequence | Yes |
| Schema file updated to match | Yes |
| No edits to already-applied migration files | Yes |
| Rollback/safety considered for prod data | Noted in PR |

Paths: see `_shared/STACK.md` for migrations directory and schema file location.

### 3. Tests (BLOCKER for logic changes)

| Change | Expect |
|--------|--------|
| New API route | Route test or integration test |
| Bug fix | Regression test |
| Plan gate | Test for 402 / entitlement required |
| Cron | Auth test with secret mock |
| Payment/webhook | Signature verification test |

**Do not** weaken or skip tests for green CI.

### 4. API auth (BLOCKER B-004)

Cross-check [_shared/PATHS.md](../_shared/PATHS.md). Escalate to `ultra-security-review` for payment/webhook PRs.

### 5. Plan gating (BLOCKER B-005)

| Layer | Check |
|-------|-------|
| API | `requireEntitlement` throws → HTTP 402 |
| UI | Entitlement gate component on dashboard pages |
| Copy | Customer-facing tier names |

### 6. Booking engine invariants (BLOCKER for booking changes)

From [_shared/STACK.md](../_shared/STACK.md) — preserve unless intentional product change:
- Slot holds + server-backed reservations
- Idempotency keys on booking create
- Business timezone handling
- Payment paths intact
- Dark mode + `prefers-reduced-motion`
- No PII in URLs

### 7–10. Conventions, E2E, deploy, parallel reviews

See [RUBRIC.md](./RUBRIC.md) sections B, T, D. Run `apple-design-head` for UI PRs and `ultra-security-review` for API/payment PRs in parallel.

---

## Verdict rules

| Verdict | Criteria |
|---------|----------|
| **SHIP** | Verify passes; 0 blockers; warnings documented or trivial |
| **FIX** | Verify fail; missing migration sync; missing auth; missing tests |
| **REJECT** | B-003; wrong architecture; breaks invariants without sign-off |

Blocker catalog: [references/blockers.md](./references/blockers.md)

---

## Artifacts

After every review:
1. Write full output to `.ultra-ship/latest.md`
2. Append one line to `.ultra-ship.md` ## History:
   `- YYYY-MM-DD | ultra-pr-ship-review | VERDICT | top: <10 words>`

---

## Output template

```markdown
## Ultra PR Ship Review
**Verdict:** SHIP | FIX | REJECT
**Score:** __/20 fast path (__%)

### Checklist
verify · migrations · tests · API auth · plan gates · booking · scope

### Blockers
1. **B-00N** — `path:line` — issue — fix

### Warnings
- **W-00N** — ...

### Verify evidence
[paste npm run verify tail or exit code]

### Parallel reviews
- [ ] ultra-security-review
- [ ] apple-design-head
```

---

## Related skills

| Skill | When |
|-------|------|
| `ultra-security-review` | API, cron, webhooks, secrets |
| `ultra-migrations` | Complex schema design |
| `ultra-api-auth` | New route scaffolding |
| `ultra-plan-gating` | Entitlement changes |
| `ultra-payments` | Payment flow changes |
| `apple-hub` | Unsure which specialist to invoke |

---

## Do not

- Ship with failing verify (B-001)
- Approve schema drift (B-002)
- Edit migrations that may be applied in production (B-003)
- Skip auth review on new API routes (B-004)
- Conflate this gate with brand or visual review

---

## Eval regression

Skill evals: [evals/evals.json](./evals/evals.json). Functional cases must fail without this skill loaded.
