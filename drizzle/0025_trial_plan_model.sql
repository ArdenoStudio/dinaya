-- New businesses start on the 14-day trial instead of a free-forever plan.
-- ('trial' / 'expired' are added in 0024 and must be committed before use.)
ALTER TABLE "businesses" ALTER COLUMN "plan" SET DEFAULT 'trial';

-- Migrate existing Free-plan businesses onto a fresh 14-day trial.
UPDATE "businesses"
SET "plan" = 'trial',
    "plan_expires_at" = now() + interval '14 days'
WHERE "plan" = 'free';
