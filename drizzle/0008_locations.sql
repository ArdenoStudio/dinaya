CREATE TABLE IF NOT EXISTS "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "slug" varchar(50),
  "address" text,
  "phone" varchar(20),
  "timezone" text DEFAULT 'Asia/Colombo' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "ai_config" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "locations_business_id_idx" ON "locations" ("business_id");
CREATE UNIQUE INDEX IF NOT EXISTS "locations_business_slug_unique"
  ON "locations" ("business_id", "slug") WHERE "slug" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "staff_locations" (
  "staff_id" uuid NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "is_primary" boolean DEFAULT false NOT NULL,
  CONSTRAINT "staff_locations_staff_id_location_id_pk" PRIMARY KEY("staff_id","location_id")
);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "location_id" uuid REFERENCES "locations"("id");
ALTER TABLE "business_holidays" ADD COLUMN IF NOT EXISTS "location_id" uuid REFERENCES "locations"("id");

INSERT INTO "locations" ("business_id", "name", "address", "phone", "timezone", "is_default", "sort_order")
SELECT b."id", b."name", b."address", b."phone", b."timezone", true, 0
FROM "businesses" b
WHERE NOT EXISTS (
  SELECT 1 FROM "locations" l WHERE l."business_id" = b."id"
);

INSERT INTO "staff_locations" ("staff_id", "location_id", "is_primary")
SELECT s."id", l."id", true
FROM "staff" s
INNER JOIN "locations" l ON l."business_id" = s."business_id" AND l."is_default" = true
WHERE NOT EXISTS (
  SELECT 1 FROM "staff_locations" sl WHERE sl."staff_id" = s."id"
);

UPDATE "bookings" b
SET "location_id" = l."id"
FROM "locations" l
WHERE b."location_id" IS NULL
  AND l."business_id" = b."business_id"
  AND l."is_default" = true;
