CREATE TABLE IF NOT EXISTS "booking_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "type" varchar(40) NOT NULL,
  "channel" varchar(20) NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "provider" varchar(40),
  "provider_message_id" varchar(180),
  "error" text,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_notifications_booking_type_channel_unique"
  ON "booking_notifications" ("booking_id", "type", "channel");

CREATE INDEX IF NOT EXISTS "booking_notifications_type_sent_at_idx"
  ON "booking_notifications" ("type", "sent_at");

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_reason" text;
