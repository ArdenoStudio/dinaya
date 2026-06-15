ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "intake_questions" jsonb;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "intake_answers" jsonb;
