CREATE TABLE IF NOT EXISTS "platform_settings" (
  "key" varchar(120) PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" varchar(255)
);

CREATE TABLE IF NOT EXISTS "admin_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "at" timestamp DEFAULT now() NOT NULL,
  "actor_email" varchar(255) NOT NULL,
  "action" varchar(120) NOT NULL,
  "target" varchar(500),
  "meta" jsonb
);

CREATE INDEX IF NOT EXISTS "admin_audit_events_at_idx" ON "admin_audit_events" ("at" DESC);

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verification_token" varchar(64);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "google_calendar_event_id" varchar(255);
