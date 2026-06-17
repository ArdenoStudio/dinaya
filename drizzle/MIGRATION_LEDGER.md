# Migration Ledger

Drizzle SQL files that may already be applied in production are immutable. Do
not rename or rewrite them to tidy historical numbering.

The following duplicate sequence numbers are legacy pairs with an explicit
canonical order:

- `0009_ai_growth_workflows.sql`
- `0009_fix_locations.sql`
- `0026_starter_plan.sql`
- `0026_subscription_payment_id.sql`

New migrations must use the next unused sequence after the current highest
number.

## Applying migrations

Run `npm run db:migrate` (→ `scripts/db-migrate.mjs`). It applies pending
`drizzle/*.sql` files in lexicographic order over Neon's HTTP driver and records
each in a `_sql_migrations` table.

Do **not** use `drizzle-kit migrate` — these migrations have no drizzle journal,
and drizzle-kit's Neon **websocket** driver cannot connect from Node (it hangs
and silently no-ops, which is how local DBs drifted).

First run against an already-provisioned DB (where `businesses` exists)
*baselines* every current migration as already-applied — it never re-runs
history. A fresh/empty DB gets every migration applied in order. Author new
migrations to be idempotent (`IF NOT EXISTS`, `ADD VALUE IF NOT EXISTS`, …).
