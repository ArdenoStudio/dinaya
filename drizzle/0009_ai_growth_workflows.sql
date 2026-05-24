ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "communication_opt_out" boolean DEFAULT false NOT NULL;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "last_ai_contact_at" timestamp;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "loyalty_tier" varchar(40);

ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "provider" varchar(80);
ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "feature" varchar(80);
ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(180);
ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "meta" jsonb;

CREATE TABLE IF NOT EXISTS "ai_workflow_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "location_id" uuid,
  "feature" varchar(80) NOT NULL,
  "workflow_key" varchar(160) NOT NULL,
  "entity_type" varchar(40),
  "entity_id" uuid,
  "channel" varchar(40),
  "provider" varchar(80),
  "status" varchar(40) DEFAULT 'queued' NOT NULL,
  "subject" varchar(200),
  "body" text,
  "scheduled_for" timestamp,
  "executed_at" timestamp,
  "idempotency_key" varchar(180) NOT NULL,
  "error" text,
  "meta" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_workflow_runs_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ai_workflow_runs_location_id_locations_id_fk"
    FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "ai_content_calendar" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "content_date" date NOT NULL,
  "channel" varchar(40) DEFAULT 'social' NOT NULL,
  "title" varchar(160) NOT NULL,
  "caption" text NOT NULL,
  "status" varchar(40) DEFAULT 'draft' NOT NULL,
  "approved_at" timestamp,
  "published_at" timestamp,
  "provider" varchar(80),
  "provider_message_id" varchar(180),
  "error" text,
  "meta" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_content_calendar_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ai_content_calendar_location_id_locations_id_fk"
    FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "social_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "provider" varchar(80) NOT NULL,
  "account_id" varchar(160),
  "account_name" varchar(160),
  "access_token_encrypted" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "meta" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "social_connections_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "ai_workflow_runs_business_feature_idx"
  ON "ai_workflow_runs" ("business_id", "feature");
CREATE INDEX IF NOT EXISTS "ai_workflow_runs_business_created_at_idx"
  ON "ai_workflow_runs" ("business_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_workflow_runs_business_idempotency_unique"
  ON "ai_workflow_runs" ("business_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "ai_content_calendar_business_date_idx"
  ON "ai_content_calendar" ("business_id", "content_date");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_content_calendar_business_location_date_unique"
  ON "ai_content_calendar" ("business_id", "location_id", "content_date");
CREATE UNIQUE INDEX IF NOT EXISTS "social_connections_business_provider_unique"
  ON "social_connections" ("business_id", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "communications_business_idempotency_unique"
  ON "communications" ("business_id", "idempotency_key");
