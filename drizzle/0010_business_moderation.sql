ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "is_suspended" boolean DEFAULT false NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
