ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL;

-- Existing businesses skip the wizard
UPDATE "businesses" SET "onboarding_completed_at" = "created_at" WHERE "onboarding_completed_at" IS NULL;
