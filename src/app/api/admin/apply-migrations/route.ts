import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// One-time endpoint to apply pending migrations 0009-0015.
// All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so re-running is safe.
// Remove this file once confirmed working.

const MIGRATION_STEPS: { label: string; sql: string }[] = [
  // ── 0009: AI growth workflows ────────────────────────────────────────────────
  { label: "0009 clients.communication_opt_out", sql: `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "communication_opt_out" boolean DEFAULT false NOT NULL` },
  { label: "0009 clients.last_ai_contact_at", sql: `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "last_ai_contact_at" timestamp` },
  { label: "0009 clients.loyalty_tier", sql: `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "loyalty_tier" varchar(40)` },
  { label: "0009 communications.provider", sql: `ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "provider" varchar(80)` },
  { label: "0009 communications.feature", sql: `ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "feature" varchar(80)` },
  { label: "0009 communications.idempotency_key", sql: `ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(180)` },
  { label: "0009 communications.meta", sql: `ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "meta" jsonb` },
  { label: "0009 CREATE ai_workflow_runs", sql: `CREATE TABLE IF NOT EXISTS "ai_workflow_runs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"business_id" uuid NOT NULL,"location_id" uuid,"feature" varchar(80) NOT NULL,"workflow_key" varchar(160) NOT NULL,"entity_type" varchar(40),"entity_id" uuid,"channel" varchar(40),"provider" varchar(80),"status" varchar(40) DEFAULT 'queued' NOT NULL,"subject" varchar(200),"body" text,"scheduled_for" timestamp,"executed_at" timestamp,"idempotency_key" varchar(180) NOT NULL,"error" text,"meta" jsonb,"created_at" timestamp DEFAULT now() NOT NULL,CONSTRAINT "ai_workflow_runs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action,CONSTRAINT "ai_workflow_runs_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action)` },
  { label: "0009 CREATE ai_content_calendar", sql: `CREATE TABLE IF NOT EXISTS "ai_content_calendar" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"business_id" uuid NOT NULL,"location_id" uuid NOT NULL,"content_date" date NOT NULL,"channel" varchar(40) DEFAULT 'social' NOT NULL,"title" varchar(160) NOT NULL,"caption" text NOT NULL,"status" varchar(40) DEFAULT 'draft' NOT NULL,"approved_at" timestamp,"published_at" timestamp,"provider" varchar(80),"provider_message_id" varchar(180),"error" text,"meta" jsonb,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL,CONSTRAINT "ai_content_calendar_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action,CONSTRAINT "ai_content_calendar_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action)` },
  { label: "0009 CREATE social_connections", sql: `CREATE TABLE IF NOT EXISTS "social_connections" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"business_id" uuid NOT NULL,"provider" varchar(80) NOT NULL,"account_id" varchar(160),"account_name" varchar(160),"access_token_encrypted" text,"is_active" boolean DEFAULT true NOT NULL,"meta" jsonb,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL,CONSTRAINT "social_connections_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action)` },
  { label: "0009 INDEX ai_workflow_runs_business_feature_idx", sql: `CREATE INDEX IF NOT EXISTS "ai_workflow_runs_business_feature_idx" ON "ai_workflow_runs" ("business_id", "feature")` },
  { label: "0009 INDEX ai_workflow_runs_business_created_at_idx", sql: `CREATE INDEX IF NOT EXISTS "ai_workflow_runs_business_created_at_idx" ON "ai_workflow_runs" ("business_id", "created_at")` },
  { label: "0009 UNIQUE ai_workflow_runs_business_idempotency_unique", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "ai_workflow_runs_business_idempotency_unique" ON "ai_workflow_runs" ("business_id", "idempotency_key")` },
  { label: "0009 INDEX ai_content_calendar_business_date_idx", sql: `CREATE INDEX IF NOT EXISTS "ai_content_calendar_business_date_idx" ON "ai_content_calendar" ("business_id", "content_date")` },
  { label: "0009 UNIQUE ai_content_calendar_business_location_date_unique", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "ai_content_calendar_business_location_date_unique" ON "ai_content_calendar" ("business_id", "location_id", "content_date")` },
  { label: "0009 UNIQUE social_connections_business_provider_unique", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "social_connections_business_provider_unique" ON "social_connections" ("business_id", "provider")` },
  { label: "0009 UNIQUE communications_business_idempotency_unique", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "communications_business_idempotency_unique" ON "communications" ("business_id", "idempotency_key")` },

  // ── 0010: Business moderation ────────────────────────────────────────────────
  { label: "0010 businesses.is_suspended", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "is_suspended" boolean DEFAULT false NOT NULL` },
  { label: "0010 businesses.deleted_at", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp` },
  { label: "0010 subscription_status enum pending", sql: `ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'pending'` },

  // ── 0011: Booking notifications ──────────────────────────────────────────────
  { label: "0011 CREATE booking_notifications", sql: `CREATE TABLE IF NOT EXISTS "booking_notifications" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,"type" varchar(40) NOT NULL,"channel" varchar(20) NOT NULL,"status" varchar(20) DEFAULT 'pending' NOT NULL,"provider" varchar(40),"provider_message_id" varchar(180),"error" text,"sent_at" timestamp,"created_at" timestamp DEFAULT now() NOT NULL)` },
  { label: "0011 UNIQUE booking_notifications_booking_type_channel_unique", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "booking_notifications_booking_type_channel_unique" ON "booking_notifications" ("booking_id", "type", "channel")` },
  { label: "0011 INDEX booking_notifications_type_sent_at_idx", sql: `CREATE INDEX IF NOT EXISTS "booking_notifications_type_sent_at_idx" ON "booking_notifications" ("type", "sent_at")` },
  { label: "0011 bookings.cancelled_at", sql: `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp` },
  { label: "0011 bookings.cancellation_reason", sql: `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_reason" text` },

  // ── 0012: Pro growth ─────────────────────────────────────────────────────────
  { label: "0012 businesses.hide_dinaya_branding", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "hide_dinaya_branding" boolean DEFAULT false NOT NULL` },
  { label: "0012 businesses.custom_domain", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain" varchar(255)` },
  { label: "0012 businesses.custom_domain_verified", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verified" boolean DEFAULT false NOT NULL` },
  { label: "0012 businesses.directory_listed", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_listed" boolean DEFAULT false NOT NULL` },
  { label: "0012 businesses.directory_city", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_city" varchar(80)` },
  { label: "0012 businesses.directory_district", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_district" varchar(80)` },
  { label: "0012 businesses.directory_category", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "directory_category" varchar(80)` },
  { label: "0012 payments.receipt_sent_at", sql: `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receipt_sent_at" timestamp` },
  { label: "0012 reviews.owner_reply", sql: `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply" text` },
  { label: "0012 reviews.owner_replied_at", sql: `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_replied_at" timestamp` },
  { label: "0012 reviews.owner_reply_source", sql: `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "owner_reply_source" varchar(20)` },
  { label: "0012 UNIQUE businesses_custom_domain_unique_idx", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "businesses_custom_domain_unique_idx" ON "businesses" ("custom_domain") WHERE "custom_domain" IS NOT NULL` },
  { label: "0012 INDEX businesses_directory_listed_idx", sql: `CREATE INDEX IF NOT EXISTS "businesses_directory_listed_idx" ON "businesses" ("directory_listed", "directory_city")` },

  // ── 0013: Platform settings ──────────────────────────────────────────────────
  { label: "0013 CREATE platform_settings", sql: `CREATE TABLE IF NOT EXISTS "platform_settings" ("key" varchar(120) PRIMARY KEY,"value" jsonb NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL,"updated_by" varchar(255))` },
  { label: "0013 CREATE admin_audit_events", sql: `CREATE TABLE IF NOT EXISTS "admin_audit_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"at" timestamp DEFAULT now() NOT NULL,"actor_email" varchar(255) NOT NULL,"action" varchar(120) NOT NULL,"target" varchar(500),"meta" jsonb)` },
  { label: "0013 INDEX admin_audit_events_at_idx", sql: `CREATE INDEX IF NOT EXISTS "admin_audit_events_at_idx" ON "admin_audit_events" ("at" DESC)` },
  { label: "0013 businesses.custom_domain_verification_token", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verification_token" varchar(64)` },
  { label: "0013 bookings.google_calendar_event_id", sql: `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "google_calendar_event_id" varchar(255)` },

  // ── 0014: Phase 5 growth ─────────────────────────────────────────────────────
  { label: "0014 businesses.referral_code", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "referral_code" varchar(40)` },
  { label: "0014 businesses.referred_by_business_id", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "referred_by_business_id" uuid` },
  { label: "0014 bookings.attribution", sql: `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "attribution" jsonb` },
  { label: "0014 UPDATE businesses referral_code", sql: `UPDATE "businesses" SET "referral_code" = "slug" WHERE "referral_code" IS NULL` },
  { label: "0014 UNIQUE businesses_referral_code_unique_idx", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "businesses_referral_code_unique_idx" ON "businesses" ("referral_code") WHERE "referral_code" IS NOT NULL` },
  { label: "0014 FK businesses_referred_by_business_id_fkey", sql: `ALTER TABLE "businesses" ADD CONSTRAINT "businesses_referred_by_business_id_fkey" FOREIGN KEY ("referred_by_business_id") REFERENCES "businesses"("id") ON DELETE SET NULL` },

  // ── 0015: Security & performance indexes ─────────────────────────────────────
  { label: "0015 INDEX clients_business_created_at_idx", sql: `CREATE INDEX IF NOT EXISTS "clients_business_created_at_idx" ON "clients" ("business_id", "created_at")` },
  { label: "0015 INDEX bookings_business_starts_at_idx", sql: `CREATE INDEX IF NOT EXISTS "bookings_business_starts_at_idx" ON "bookings" ("business_id", "starts_at")` },
  { label: "0015 INDEX bookings_business_status_starts_at_idx", sql: `CREATE INDEX IF NOT EXISTS "bookings_business_status_starts_at_idx" ON "bookings" ("business_id", "status", "starts_at")` },
  { label: "0015 INDEX bookings_staff_starts_at_idx", sql: `CREATE INDEX IF NOT EXISTS "bookings_staff_starts_at_idx" ON "bookings" ("staff_id", "starts_at")` },
  { label: "0015 INDEX payments_booking_id_idx", sql: `CREATE INDEX IF NOT EXISTS "payments_booking_id_idx" ON "payments" ("booking_id")` },
  { label: "0015 INDEX payments_status_created_at_idx", sql: `CREATE INDEX IF NOT EXISTS "payments_status_created_at_idx" ON "payments" ("status", "created_at")` },
  { label: "0015 INDEX reviews_business_published_created_at_idx", sql: `CREATE INDEX IF NOT EXISTS "reviews_business_published_created_at_idx" ON "reviews" ("business_id", "is_published", "created_at")` },
  { label: "0015 INDEX webhooks_business_active_idx", sql: `CREATE INDEX IF NOT EXISTS "webhooks_business_active_idx" ON "webhooks" ("business_id", "is_active")` },
  { label: "0015 businesses.custom_domain_status", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_status" varchar(40) DEFAULT 'none' NOT NULL` },
  { label: "0015 businesses.custom_domain_last_checked_at", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_last_checked_at" timestamp` },
  { label: "0015 businesses.custom_domain_error", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_error" text` },
  { label: "0015 businesses.custom_domain_config", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_config" jsonb` },
  { label: "0015 businesses.custom_domain_verification", sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verification" jsonb` },
  { label: "0015 UPDATE businesses custom_domain_status", sql: `UPDATE "businesses" SET "custom_domain_status" = CASE WHEN "custom_domain" IS NULL THEN 'none' WHEN "custom_domain_verified" = true THEN 'active' ELSE 'pending_dns' END WHERE "custom_domain_status" = 'none'` },
  { label: "0015 UNIQUE businesses_custom_domain_lower_unique_idx", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "businesses_custom_domain_lower_unique_idx" ON "businesses" (lower("custom_domain")) WHERE "custom_domain" IS NOT NULL` },
];

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const sql = neon(process.env.DATABASE_URL);
  const results: { label: string; ok: boolean; error?: string }[] = [];

  for (const step of MIGRATION_STEPS) {
    try {
      await sql(step.sql);
      results.push({ label: step.label, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ label: step.label, ok: false, error: msg });
      console.warn(`[apply-migrations] skipped: ${step.label} — ${msg}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({ total: results.length, failed: failed.length, results });
}
