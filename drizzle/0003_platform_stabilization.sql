CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_no_active_overlap'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_no_active_overlap"
      EXCLUDE USING gist (
        "staff_id" WITH =,
        tstzrange("starts_at", "ends_at", '[)') WITH &&
      )
      WHERE ("status" IN ('pending', 'confirmed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_valid_time_range'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_valid_time_range"
      CHECK ("ends_at" > "starts_at");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_rating_range'
  ) THEN
    ALTER TABLE "reviews"
      ADD CONSTRAINT "reviews_rating_range"
      CHECK ("rating" BETWEEN 1 AND 5);
  END IF;
END $$;
