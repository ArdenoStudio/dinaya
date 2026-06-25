-- Forward-only schema drift reconciliation.
-- Keep historical duplicate migration filenames (for example 0009_* / 0026_*) as-is;
-- this migration reasserts the live schema without renaming migration history.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Reapply historical uniqueness/index fixes for databases that were previously baselined.
DROP INDEX IF EXISTS "business_holidays_business_id_date_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "business_holidays_business_id_location_id_date_unique"
  ON "business_holidays" (
    "business_id",
    COALESCE("location_id", '00000000-0000-0000-0000-000000000000'::uuid),
    "date"
  );

CREATE UNIQUE INDEX IF NOT EXISTS "services_business_slug_unique"
  ON "services" ("business_id", "slug")
  WHERE "slug" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_order_unique"
  ON "payments" ("provider", "provider_order_id")
  WHERE "provider_order_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "bookings_location_id_idx"
  ON "bookings" ("location_id");

CREATE INDEX IF NOT EXISTS "availability_staff_idx"
  ON "availability" ("staff_id");

CREATE INDEX IF NOT EXISTS "availability_overrides_staff_idx"
  ON "availability_overrides" ("staff_id");

CREATE INDEX IF NOT EXISTS "bookings_client_id_idx"
  ON "bookings" ("client_id");

-- Preserve stored instants from 0031 when converting naive UTC timestamps to timestamptz.
ALTER TABLE "slot_reservations"
  ALTER COLUMN "starts_at" TYPE timestamp with time zone USING "starts_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "ends_at" TYPE timestamp with time zone USING "ends_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_referred_by_business_id_fkey'
  ) THEN
    UPDATE "businesses" AS b
    SET "referred_by_business_id" = NULL
    WHERE "referred_by_business_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "businesses" AS ref
        WHERE ref."id" = b."referred_by_business_id"
      );

    ALTER TABLE "businesses"
      ADD CONSTRAINT "businesses_referred_by_business_id_fkey"
      FOREIGN KEY ("referred_by_business_id") REFERENCES "businesses"("id") ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_no_active_overlap";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_service_id_services_id_fk";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_staff_id_staff_id_fk";

ALTER TABLE "bookings"
  ALTER COLUMN "service_id" DROP NOT NULL,
  ALTER COLUMN "staff_id" DROP NOT NULL;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_service_id_services_id_fk"
  FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_staff_id_staff_id_fk"
  FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_active_overlap"
  EXCLUDE USING gist (
    "staff_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("staff_id" IS NOT NULL AND "status" IN ('pending', 'confirmed'));
