ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "language" varchar(5) DEFAULT 'en' NOT NULL,
  ADD COLUMN IF NOT EXISTS "business_type" varchar(80),
  ADD COLUMN IF NOT EXISTS "cancellation_policy" text,
  ADD COLUMN IF NOT EXISTS "deposit_policy" text,
  ADD COLUMN IF NOT EXISTS "bank_transfer_instructions" text,
  ADD COLUMN IF NOT EXISTS "lankaqr_image_url" text;

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "deposit_percent" integer DEFAULT 0 NOT NULL;

ALTER TABLE "services"
  ADD CONSTRAINT "services_deposit_percent_range"
  CHECK ("deposit_percent" >= 0 AND "deposit_percent" <= 100);

ALTER TABLE "businesses"
  ADD CONSTRAINT "businesses_language_supported"
  CHECK ("language" IN ('en', 'si', 'ta'));
