DO $$ BEGIN
  CREATE TYPE "deal_status" AS ENUM ('active', 'expired', 'cancelled', 'sold_out');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "deal_suggestion_status" AS ENUM ('pending', 'accepted', 'dismissed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "deals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  "staff_id" uuid REFERENCES "staff"("id") ON DELETE SET NULL,
  "discount_percent" integer NOT NULL,
  "slots_total" integer NOT NULL,
  "slots_redeemed" integer DEFAULT 0 NOT NULL,
  "impression_count" integer DEFAULT 0 NOT NULL,
  "deal_window_start" timestamp with time zone NOT NULL,
  "deal_window_end" timestamp with time zone NOT NULL,
  "appt_window_start" timestamp with time zone NOT NULL,
  "appt_window_end" timestamp with time zone NOT NULL,
  "status" "deal_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "deal_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "staff_id" uuid NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  "suggested_discount_percent" integer NOT NULL,
  "suggested_slots_total" integer NOT NULL,
  "appt_window_start" timestamp with time zone NOT NULL,
  "appt_window_end" timestamp with time zone NOT NULL,
  "gap_minutes" integer NOT NULL,
  "reason" text NOT NULL,
  "status" "deal_suggestion_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deal_id" uuid REFERENCES "deals"("id") ON DELETE SET NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "discounted_price_lkr" integer;

CREATE INDEX IF NOT EXISTS "deals_status_deal_window_end_idx"
  ON "deals" ("status", "deal_window_end");

CREATE INDEX IF NOT EXISTS "deals_business_status_idx"
  ON "deals" ("business_id", "status");

CREATE INDEX IF NOT EXISTS "deals_business_created_at_idx"
  ON "deals" ("business_id", "created_at");

CREATE INDEX IF NOT EXISTS "deal_suggestions_business_status_idx"
  ON "deal_suggestions" ("business_id", "status");

CREATE INDEX IF NOT EXISTS "bookings_deal_id_idx"
  ON "bookings" ("deal_id")
  WHERE "deal_id" IS NOT NULL;
