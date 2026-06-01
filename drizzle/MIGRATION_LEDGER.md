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
