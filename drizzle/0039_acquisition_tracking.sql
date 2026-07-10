-- Acquisition funnel fields for founder /admin/acquisition reporting.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS signup_utm_source varchar(80),
  ADD COLUMN IF NOT EXISTS signup_utm_medium varchar(80),
  ADD COLUMN IF NOT EXISTS signup_utm_campaign varchar(120),
  ADD COLUMN IF NOT EXISTS first_booking_at timestamp;

CREATE INDEX IF NOT EXISTS businesses_created_at_idx ON businesses (created_at);
CREATE INDEX IF NOT EXISTS businesses_signup_utm_source_idx
  ON businesses (signup_utm_source)
  WHERE signup_utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS businesses_first_booking_at_idx
  ON businesses (first_booking_at)
  WHERE first_booking_at IS NOT NULL;

-- Backfill first booking timestamp from existing bookings.
UPDATE businesses b
SET first_booking_at = sub.first_at
FROM (
  SELECT business_id, MIN(created_at) AS first_at
  FROM bookings
  WHERE status IS DISTINCT FROM 'cancelled'
  GROUP BY business_id
) AS sub
WHERE b.id = sub.business_id
  AND b.first_booking_at IS NULL;
