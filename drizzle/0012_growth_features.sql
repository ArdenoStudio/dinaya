ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain" varchar(255);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply" text;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_replied_at" timestamp;
