CREATE TABLE IF NOT EXISTS "broadcasts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "channel" varchar(40) NOT NULL,
  "subject" varchar(200),
  "body" text NOT NULL,
  "audience_type" varchar(40) NOT NULL,
  "audience_filter" jsonb,
  "status" varchar(40) DEFAULT 'draft' NOT NULL,
  "recipient_count" integer DEFAULT 0 NOT NULL,
  "sent_count" integer DEFAULT 0 NOT NULL,
  "skipped_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "broadcasts_business_created_at_idx" ON "broadcasts" ("business_id", "created_at");
