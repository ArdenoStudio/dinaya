ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "hide_dinaya_branding" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain" varchar(255);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_listed" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_city" varchar(80);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_district" varchar(80);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_category" varchar(80);

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receipt_sent_at" timestamp;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply" text;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_replied_at" timestamp;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply_source" varchar(20);

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_custom_domain_unique_idx"
  ON "businesses" ("custom_domain")
  WHERE "custom_domain" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "businesses_directory_listed_idx"
  ON "businesses" ("directory_listed", "directory_city");
