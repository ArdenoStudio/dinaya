ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "paypal_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "paypal_client_id" varchar(200);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "paypal_client_secret" text;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" varchar(20) DEFAULT 'payhere' NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'LKR' NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_order_id" varchar(100);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_payload" jsonb;

UPDATE "payments"
SET "provider_order_id" = "payhere_order_id"
WHERE "provider_order_id" IS NULL AND "payhere_order_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_order_unique"
  ON "payments" ("provider", "provider_order_id")
  WHERE "provider_order_id" IS NOT NULL;
