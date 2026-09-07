ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "price_variants" jsonb;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "price_variant" jsonb;
