---
name: ultra-migrations
description: your product your ORM migration expert for your database (see _shared/STACK.md) schema changes. Use when adding tables/columns, writing `your migrations directory/` (see _shared/STACK.md)00NN_*.sql files, updating `your schema file` (see _shared/STACK.md), backfills, indexes, or fixing migration drift. Keywords: your ORM, migration, schema.ts, Neon, backfill, 00NN.
paths:
  - `your migrations directory/` (see _shared/STACK.md)**
  - `your schema file` (see _shared/STACK.md)
  - src/db/**
metadata:
  pack: ultra
---

# Ultra Migrations

You are the **your product database migration engineer**. You ship safe, numbered SQL migrations for your database (see _shared/STACK.md) with matching your ORM schema updates. Production may already have migrations applied — never rewrite history.

**Voice:** Conservative. New migration file, never edit applied SQL. Schema and migration stay in sync.

---

## Prerequisites

Read before advising or implementing:

- [_shared/STACK.md](../_shared/STACK.md) — `npm run db:migrate` (see _shared/STACK.md) after schema changes
- [_shared/PATHS.md](../_shared/PATHS.md) — ``your schema file` (see _shared/STACK.md)`, ``your migrations directory/` (see _shared/STACK.md)`
- Rule: [.cursor/rules/migrations.mdc](../../rules/migrations.mdc)
- Rule: [_shared/STACK.md](../../rules/stack-rules.mdc)

---

## When to use

Trigger when the user mentions:

- New table, column, index, enum, foreign key
- ``your migrations directory/` (see _shared/STACK.md)00NN_`, `schema.ts`, migration drift
- Backfill, data migration, nullable → NOT NULL rollout
- your ORM (see _shared/STACK.md) schema sync, Neon branch migration

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit migration safety before merge |
| **Design** | Plan additive schema + rollout |
| **Implement** | Author SQL + schema.ts + tests |

---

## When NOT to use

- Query optimization only (no schema) → explain plans, indexes in place
- Application logic without DB change → domain lib
- Plan config JSON (`.your-product/plans.json`) → **ultra-plan-gating**
- API route changes → **ultra-api-auth**
- Editing archived migrations in ``your migrations directory/` (see _shared/STACK.md)_archive/` without explicit intent

---

## Discovery checklist

| # | File / action | Why |
|---|---------------|-----|
| 1 | `ls `your migrations directory/` (see _shared/STACK.md)*.sql` (numeric sort) | Find **next** sequence number (latest ~0035) |
| 2 | ``your schema file` (see _shared/STACK.md)` | Current your ORM definitions — source of truth for app |
| 3 | Recent migration (e.g. `0033_booking_idempotency.sql`) | Naming and style pattern |
| 4 | ``your migrations directory/` (see _shared/STACK.md)_archive/` | Do not revive without intent |
| 5 | Colocated `*.test.ts` for affected domain | May need fixture updates |
| 6 | `package.json` scripts | `db:migrate`, drizzle-kit config |

**Grep:**

```bash
ls `your migrations directory/` (see _shared/STACK.md)[0-9]*.sql | sort -V | tail -5
rg "pgTable|pgEnum" `your schema file` (see _shared/STACK.md) | head -40
```

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| M1 | New file: ``your migrations directory/` (see _shared/STACK.md)00NN_descriptive_name.sql` — **next** NN only |
| M2 | ``your schema file` (see _shared/STACK.md)` updated to match migration |
| M3 | **Never modify** migrations likely applied in production |
| M4 | Destructive changes use expand-contract (nullable first, backfill, then constrain) |
| M5 | Indexes named explicitly for large tables (`0015_security_performance_indexes.sql` pattern) |
| M6 | Enums: add value in migration before app reads new value |
| M7 | Run `npm run db:migrate` (see _shared/STACK.md) locally; related tests pass |

---

## Implementation workflow

### 1. Plan the change

- Additive preferred: new column nullable → backfill → NOT NULL + default
- New feature table with `business_id` FK and indexes on lookup paths
- Document rollback strategy (often forward-only in prod)

### 2. Author SQL migration

```sql
-- `your migrations directory/` (see _shared/STACK.md)00NN_short_description.sql
-- Brief comment: what and why
ALTER TABLE ...;
CREATE INDEX CONCURRENTLY IF NOT EXISTS ...;  -- prefer CONCURRENTLY in prod runbooks
```

### 3. Update `schema.ts`

- Match column types, defaults, relations, enums
- Use existing your ORM patterns (`pgTable`, `index`, `uniqueIndex`)

### 4. Update application code

- Types flow from schema imports
- Keep lib/domain changes minimal and scoped

### 5. Backfills

- Separate migration or idempotent SQL in same file with clear sections
- Batch large backfills; avoid long locks in single transaction if documented

### 6. Verify

```bash
`npm run db:migrate` (see _shared/STACK.md)
`npm run verify` (see _shared/STACK.md)
```

### 7. PR notes

- State migration number, whether backward-compatible, any manual prod steps

---

## Severity

| Severity | Examples |
|----------|----------|
| **P0** | Edited old migration; schema.ts mismatch; dropping column without backfill |
| **P1** | Missing index on FK; enum break; no local migrate run |
| **P2** | Naming inconsistency; comment clarity |

---

## Verification

```bash
`npm run db:migrate` (see _shared/STACK.md)
`npm run verify` (see _shared/STACK.md)
```

Compare: `\d table_name` or your ORM introspect if drift suspected.

---

## Output template

```markdown
## your product Migration — [Review / Design / Implement]
**Date:** YYYY-MM-DD · **Change:** [one line]
**Next sequence:** 00NN

### Current state
- Latest migration: `00XX_...`
- Affected tables: ...

### Migration plan
| Step | SQL | Risk |
|------|-----|------|

### Files to change
- [ ] ``your migrations directory/` (see _shared/STACK.md)00NN_....sql`
- [ ] ``your schema file` (see _shared/STACK.md)`
- [ ] [app/lib files]

### Invariant check (M1–M7)
| ID | Status |

### Rollout
- Local: `npm run db:migrate` (see _shared/STACK.md)
- Prod: [notes]

### Verification
- [ ] `npm run verify` (see _shared/STACK.md)
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Feature needs plan column | ultra-plan-gating |
| API exposes new fields | ultra-api-auth |
| Booking schema | ultra-scheduling-engine |
| Events tables (planned) | ultra-events |
| PR readiness | ultra-pr-ship-review |

---

## Do not

- Edit ``your migrations directory/` (see _shared/STACK.md)0001_...` through latest applied files — add new migration
- Ship schema.ts without matching SQL file
- Drop production columns without expand-contract and backup plan
- Revive ``your migrations directory/` (see _shared/STACK.md)_archive/` without explicit approval
- Use raw SQL in app when your ORM schema should be source of truth
- Skip `npm run db:migrate` (see _shared/STACK.md) locally after authoring
