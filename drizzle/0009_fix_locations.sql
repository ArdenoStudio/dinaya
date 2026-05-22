-- Fix 1: business_holidays unique constraint must include location_id
-- The old index only covers (business_id, date), so two branches cannot share
-- the same holiday date. Drop it and replace with a COALESCE-based index that
-- treats NULL location_id (business-wide holiday) as a stable sentinel value.

DROP INDEX IF EXISTS "business_holidays_business_id_date_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "business_holidays_business_id_location_id_date_unique"
  ON "business_holidays" (
    "business_id",
    COALESCE("location_id", '00000000-0000-0000-0000-000000000000'::uuid),
    "date"
  );

-- Fix 2: add index on bookings.location_id for calendar and report queries
CREATE INDEX IF NOT EXISTS "bookings_location_id_idx"
  ON "bookings" ("location_id");
