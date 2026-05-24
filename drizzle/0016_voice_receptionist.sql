CREATE TABLE IF NOT EXISTS "voice_integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "api_key_id" uuid,
  "status" varchar(40) DEFAULT 'not_requested' NOT NULL,
  "provider_name" varchar(120) DEFAULT 'Peak Agents' NOT NULL,
  "business_phone" varchar(30),
  "ai_phone_number" varchar(30),
  "handoff_phone" varchar(30),
  "languages" text[] DEFAULT ARRAY['en']::text[] NOT NULL,
  "welcome_message" text,
  "fallback_message" text,
  "opening_rules" text,
  "service_rules" text,
  "booking_rules" text,
  "faq_notes" text,
  "setup_notes" text,
  "requested_at" timestamp,
  "last_tested_at" timestamp,
  "activated_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "voice_integrations_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE cascade,
  CONSTRAINT "voice_integrations_api_key_id_api_keys_id_fk"
    FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE set null
);

CREATE UNIQUE INDEX IF NOT EXISTS "voice_integrations_business_id_unique"
  ON "voice_integrations" ("business_id");

CREATE INDEX IF NOT EXISTS "voice_integrations_status_idx"
  ON "voice_integrations" ("status");
