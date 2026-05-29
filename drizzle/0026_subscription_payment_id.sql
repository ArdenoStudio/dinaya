-- Track the last processed PayHere recurring charge so renewal webhooks (which
-- reuse the same order_id) can be deduped by the per-charge payment_id instead
-- of a fragile time window that could silently drop a legitimate renewal.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "last_payment_id" varchar(100);
