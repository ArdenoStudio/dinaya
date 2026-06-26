-- Prevent overlapping active slot holds for the same staff member.
-- Uses a trigger (not a partial EXCLUDE with now()) because now() is not immutable in index predicates.

CREATE OR REPLACE FUNCTION prevent_overlapping_slot_reservations()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM slot_reservations AS existing
    WHERE existing.staff_id = NEW.staff_id
      AND existing.id IS DISTINCT FROM NEW.id
      AND existing.expires_at > now()
      AND existing.session_token <> NEW.session_token
      AND existing.starts_at < NEW.ends_at
      AND existing.ends_at > NEW.starts_at
  ) THEN
    RAISE EXCEPTION 'slot_taken' USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS slot_reservations_overlap_check ON slot_reservations;

CREATE TRIGGER slot_reservations_overlap_check
  BEFORE INSERT OR UPDATE ON slot_reservations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_overlapping_slot_reservations();
