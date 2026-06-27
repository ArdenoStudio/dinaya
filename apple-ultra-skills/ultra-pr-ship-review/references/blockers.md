# Ship Review — Blocker & Warning Catalog

**BLOCKER** = must fix before merge (any one → FIX or REJECT).  
**WARNING** = document or fix soon; does not alone block SHIP.

Single source of truth for blocker IDs referenced in review output.

---

## BLOCKERS

| ID | Condition | Detect | Fix |
|----|-----------|--------|-----|
| B-001 | verify fails | `npm run verify` non-zero (see STACK.md) | Fix failing step; re-run; paste evidence |
| B-002 | schema drift | schema file changed, no new migration | Add `00NN_descriptive_name.sql` |
| B-003 | edited applied migration | git diff touches old `00*.sql` | Revert; new forward migration only |
| B-004 | missing API auth | new route without require* / CRON Bearer | Add pattern from PATHS.md |
| B-005 | plan gate hole | tiered feature open on lower tier API | requireEntitlement + test 402 |
| B-006 | production boundary | dev SDK in app/lib production paths | Remove; keep dev-only in `.cursor/` |
| B-007 | layer violation | lib imports components | Move or invert dependency |
| B-008 | secret in diff | merchant secret, API_KEY=, CRON_SECRET= value | Env-only; rotate if leaked |

---

## WARNINGS

| ID | Condition | Detect |
|----|-----------|--------|
| W-001 | missing e2e for auth/booking/plan | PR touches flow, no e2e update |
| W-002 | new env undocumented | new `process.env` without deployment checklist |
| W-003 | console.log in prod path | `rg console.log src/` on changed files |
| W-004 | Zod missing on POST/PATCH | manual `JSON.parse` without schema |
| W-005 | drive-by refactor | files unrelated to PR intent |
| W-006 | missing parallel review | UI PR without design review noted |

---

## Grep helpers

```bash
# Changed files
git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1

# Auth scan on new API routes
git diff origin/main...HEAD -- 'src/app/api/**' | rg -n 'export async function (GET|POST|PATCH|DELETE)'

# Secrets in diff
git diff origin/main...HEAD | rg -i 'secret|api_key|password|token' | rg -v 'process\.env'

# Layer violation
rg "from ['\"]@?/?.*components" src/lib/

# Applied migration edits
git diff origin/main...HEAD -- 'drizzle/*.sql' '**/migrations/*.sql'
```

Paths: substitute `drizzle/`, `src/db/schema.ts` with values from `_shared/STACK.md` and `_shared/PATHS.md`.

---

## Verdict rules

- **SHIP:** verify pass + 0 BLOCKERS + warnings triaged
- **FIX:** any BLOCKER or verify fail
- **REJECT:** B-003, architectural wrong-model, intentional invariant break without product sign-off
