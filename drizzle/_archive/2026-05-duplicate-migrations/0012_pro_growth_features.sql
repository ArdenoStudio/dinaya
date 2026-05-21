ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "hide_dinaya_branding" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain" varchar(255);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_listed" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_city" varchar(80);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_district" varchar(80);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_category" varchar(80);

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receipt_sent_at" timestamp;

CREATE INDEX IF NOT EXISTS "businesses_directory_listed_idx"
  ON "businesses" ("directory_listed", "directory_city");
