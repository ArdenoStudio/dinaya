# Duplicate migrations from parallel branches (2026-05)

These files were created on both `master` and the product-excellence branch with
overlapping numbers (`0011`–`0013`). They were superseded by a consolidated set:

| Archived file | Merged into |
|---------------|-------------|
| `0011_subscription_pending.sql` | `drizzle/0011_booking_notifications.sql` |
| `0012_pro_growth_features.sql` | `drizzle/0012_pro_growth.sql` |
| `0012_growth_features.sql` | `drizzle/0012_pro_growth.sql` |
| `0013_phase4_features.sql` | `drizzle/0012_pro_growth.sql` + `0013_platform_settings.sql` |

The consolidated migrations use `IF NOT EXISTS` so they are safe on databases that
already applied one side of the duplicate set.
