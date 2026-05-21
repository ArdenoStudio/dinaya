DO $$ BEGIN
  CREATE TYPE "billing_interval" AS ENUM('monthly', 'annual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_interval" "billing_interval" DEFAULT 'monthly' NOT NULL;
