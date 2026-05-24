ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verified_at" timestamp;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply" text;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply_at" timestamp;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply_source" varchar(20);

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_custom_domain_unique_idx"
  ON "businesses" ("custom_domain")
  WHERE "custom_domain" IS NOT NULL;
