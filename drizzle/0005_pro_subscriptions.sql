DO $$ BEGIN
  CREATE TYPE "subscription_status" AS ENUM ('active', 'past_due', 'cancelled', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "payhere_order_id" varchar(100) NOT NULL UNIQUE,
  "payhere_subscription_id" varchar(100) UNIQUE,
  "plan" "plan" DEFAULT 'pro' NOT NULL,
  "status" "subscription_status" DEFAULT 'active' NOT NULL,
  "amount_lkr" integer NOT NULL,
  "current_period_end" timestamp,
  "cancelled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "subscriptions_business_id_idx"
  ON "subscriptions" ("business_id");
