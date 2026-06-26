-- Prevent overlapping active slot holds for the same staff member.
ALTER TABLE "slot_reservations" DROP CONSTRAINT IF EXISTS "slot_reservations_no_active_overlap";

ALTER TABLE "slot_reservations"
  ADD CONSTRAINT "slot_reservations_no_active_overlap"
  EXCLUDE USING gist (
    "staff_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("expires_at" > now());
