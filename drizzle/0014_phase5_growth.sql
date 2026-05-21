ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "referral_code" varchar(40);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "referred_by_business_id" uuid;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "attribution" jsonb;

UPDATE "businesses" SET "referral_code" = "slug" WHERE "referral_code" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_referral_code_unique_idx"
  ON "businesses" ("referral_code")
  WHERE "referral_code" IS NOT NULL;

ALTER TABLE "businesses"
  ADD CONSTRAINT "businesses_referred_by_business_id_fkey"
  FOREIGN KEY ("referred_by_business_id") REFERENCES "businesses"("id") ON DELETE SET NULL;
