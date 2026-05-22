CREATE INDEX IF NOT EXISTS "clients_business_created_at_idx"
  ON "clients" ("business_id", "created_at");

CREATE INDEX IF NOT EXISTS "bookings_business_starts_at_idx"
  ON "bookings" ("business_id", "starts_at");

CREATE INDEX IF NOT EXISTS "bookings_business_status_starts_at_idx"
  ON "bookings" ("business_id", "status", "starts_at");

CREATE INDEX IF NOT EXISTS "bookings_staff_starts_at_idx"
  ON "bookings" ("staff_id", "starts_at");

CREATE INDEX IF NOT EXISTS "payments_booking_id_idx"
  ON "payments" ("booking_id");

CREATE INDEX IF NOT EXISTS "payments_status_created_at_idx"
  ON "payments" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "reviews_business_published_created_at_idx"
  ON "reviews" ("business_id", "is_published", "created_at");

CREATE INDEX IF NOT EXISTS "webhooks_business_active_idx"
  ON "webhooks" ("business_id", "is_active");

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_status" varchar(40) DEFAULT 'none' NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_last_checked_at" timestamp;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_error" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_config" jsonb;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verification" jsonb;

UPDATE "businesses"
SET "custom_domain_status" = CASE
  WHEN "custom_domain" IS NULL THEN 'none'
  WHEN "custom_domain_verified" = true THEN 'active'
  ELSE 'pending_dns'
END
WHERE "custom_domain_status" = 'none';

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_custom_domain_lower_unique_idx"
  ON "businesses" (lower("custom_domain"))
  WHERE "custom_domain" IS NOT NULL;
