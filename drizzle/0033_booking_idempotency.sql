CREATE TABLE IF NOT EXISTS "booking_idempotency_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "idempotency_key" varchar(180) NOT NULL,
  "request_hash" varchar(64) NOT NULL,
  "response_status" integer NOT NULL,
  "response_body" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_idempotency_business_key_unique"
  ON "booking_idempotency_keys" ("business_id", "idempotency_key");

CREATE INDEX IF NOT EXISTS "booking_idempotency_expires_idx"
  ON "booking_idempotency_keys" ("expires_at");
