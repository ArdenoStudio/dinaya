-- Businesses marked onboarding-complete in 0017 were never opted into the directory.
-- Backfill listing for active businesses that finished setup (or pre-dated the wizard).
UPDATE "businesses"
SET
  "directory_listed" = true,
  "directory_city" = COALESCE("directory_city", 'Colombo'),
  "directory_category" = COALESCE(
    "directory_category",
    CASE
      WHEN "business_type" IN ('salon', 'spa', 'beauty', 'salon_barber') THEN 'salon'
      WHEN "business_type" IN ('clinic', 'healthcare', 'dental') THEN 'clinic'
      WHEN "business_type" IN ('tutoring', 'education', 'tuition') THEN 'tutoring'
      WHEN "business_type" IN ('fitness', 'gym', 'sports', 'spa_wellness') THEN 'fitness'
      WHEN "business_type" IN ('consulting', 'freelance', 'photography', 'vehicle_service') THEN 'consulting'
      ELSE 'other'
    END
  )
WHERE
  "onboarding_completed_at" IS NOT NULL
  AND "directory_listed" = false
  AND "deleted_at" IS NULL
  AND "is_suspended" = false;
