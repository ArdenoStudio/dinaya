ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deal_slot_released" boolean DEFAULT false NOT NULL;

ALTER TABLE "deal_suggestions" ADD COLUMN IF NOT EXISTS "meta" jsonb;
