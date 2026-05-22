CREATE TABLE IF NOT EXISTS "platform_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event" varchar(120) NOT NULL,
  "business_id" uuid,
  "user_id" uuid,
  "session_id" varchar(120),
  "props" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "platform_events"
    ADD CONSTRAINT "platform_events_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "platform_events"
    ADD CONSTRAINT "platform_events_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "platform_events_event_created_at_idx"
  ON "platform_events" ("event", "created_at");
CREATE INDEX IF NOT EXISTS "platform_events_business_created_at_idx"
  ON "platform_events" ("business_id", "created_at");
CREATE INDEX IF NOT EXISTS "platform_events_created_at_idx"
  ON "platform_events" ("created_at");
