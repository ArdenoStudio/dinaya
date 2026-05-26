ALTER TABLE "api_keys"
  ADD COLUMN "key_type" varchar(40) DEFAULT 'generic' NOT NULL,
  ADD COLUMN "device_id" varchar(120),
  ADD COLUMN "device_name" varchar(120);

CREATE INDEX IF NOT EXISTS "api_keys_business_key_type_idx" ON "api_keys" ("business_id", "key_type");
