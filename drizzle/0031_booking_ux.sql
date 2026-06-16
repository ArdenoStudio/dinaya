-- Tenant booking accent color
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "accent_color" varchar(7);

-- Per-service public URLs: /book/{slug}/{serviceSlug}
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "slug" varchar(80);

CREATE UNIQUE INDEX IF NOT EXISTS "services_business_slug_unique"
  ON "services" ("business_id", "slug")
  WHERE "slug" IS NOT NULL;

-- Temporary slot holds while a guest completes booking
CREATE TABLE IF NOT EXISTS "slot_reservations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "staff_id" uuid NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  "starts_at" timestamp NOT NULL,
  "ends_at" timestamp NOT NULL,
  "session_token" varchar(64) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "slot_reservations_expires_idx" ON "slot_reservations" ("expires_at");
CREATE INDEX IF NOT EXISTS "slot_reservations_staff_starts_idx" ON "slot_reservations" ("staff_id", "starts_at");
