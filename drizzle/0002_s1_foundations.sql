ALTER TABLE "businesses" ADD COLUMN "timezone" text DEFAULT 'Asia/Colombo' NOT NULL;

CREATE TABLE "activity_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "entity" varchar(80) NOT NULL,
  "entity_id" uuid,
  "action" varchar(80) NOT NULL,
  "meta" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "service_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "services" ADD COLUMN "category_id" uuid;
ALTER TABLE "staff_services" ADD COLUMN "price_override_lkr" integer;
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_id_service_id_pk" PRIMARY KEY ("staff_id", "service_id");

CREATE TABLE "business_holidays" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "date" date NOT NULL,
  "name" varchar(120) NOT NULL,
  "is_closed" boolean DEFAULT true NOT NULL,
  "start_time" time,
  "end_time" time,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "bookings" ADD COLUMN "source" varchar(40) DEFAULT 'public' NOT NULL;
CREATE UNIQUE INDEX "clients_business_id_phone_unique" ON "clients" ("business_id", "phone");
CREATE UNIQUE INDEX "reviews_booking_id_unique" ON "reviews" ("booking_id");

ALTER TYPE "public"."webhook_event" ADD VALUE IF NOT EXISTS 'booking.rescheduled' AFTER 'booking.confirmed';

CREATE TABLE "automation_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "trigger" varchar(80) NOT NULL,
  "delay_minutes" integer DEFAULT 0 NOT NULL,
  "conditions" jsonb,
  "actions" jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "automation_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rule_id" uuid NOT NULL,
  "entity_id" uuid NOT NULL,
  "trigger_version" varchar(80) DEFAULT 'v1' NOT NULL,
  "status" varchar(40) DEFAULT 'pending' NOT NULL,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "message_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "channel" varchar(40) NOT NULL,
  "name" varchar(120) NOT NULL,
  "subject" varchar(200),
  "body" text NOT NULL,
  "variables" text[],
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "communications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "booking_id" uuid,
  "client_id" uuid,
  "channel" varchar(40) NOT NULL,
  "direction" varchar(20) DEFAULT 'outbound' NOT NULL,
  "status" varchar(40) DEFAULT 'pending' NOT NULL,
  "subject" varchar(200),
  "body" text,
  "provider_message_id" varchar(180),
  "error" text,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "webhook_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "webhook_id" uuid NOT NULL,
  "event" "webhook_event" NOT NULL,
  "entity_id" uuid,
  "status" varchar(40) DEFAULT 'pending' NOT NULL,
  "status_code" integer,
  "request_body" jsonb,
  "response_body" text,
  "error" text,
  "attempts" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "metrics_daily" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "date" date NOT NULL,
  "metric" varchar(80) NOT NULL,
  "dims" jsonb,
  "value" numeric(14, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "key_hash" text NOT NULL,
  "scopes" text[] NOT NULL,
  "last_used_at" timestamp,
  "expires_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "business_holidays" ADD CONSTRAINT "business_holidays_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "communications" ADD CONSTRAINT "communications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "communications" ADD CONSTRAINT "communications_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "communications" ADD CONSTRAINT "communications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "metrics_daily" ADD CONSTRAINT "metrics_daily_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "activity_log_business_created_at_idx" ON "activity_log" ("business_id", "created_at");
CREATE UNIQUE INDEX "service_categories_business_id_name_unique" ON "service_categories" ("business_id", "name");
CREATE UNIQUE INDEX "business_holidays_business_id_date_unique" ON "business_holidays" ("business_id", "date");
CREATE INDEX "automation_rules_business_trigger_idx" ON "automation_rules" ("business_id", "trigger");
CREATE UNIQUE INDEX "automation_runs_rule_entity_version_unique" ON "automation_runs" ("rule_id", "entity_id", "trigger_version");
CREATE INDEX "communications_business_created_at_idx" ON "communications" ("business_id", "created_at");
CREATE INDEX "webhook_deliveries_webhook_created_at_idx" ON "webhook_deliveries" ("webhook_id", "created_at");
CREATE UNIQUE INDEX "metrics_daily_business_metric_date_dims_unique" ON "metrics_daily" ("business_id", "date", "metric", "dims");
CREATE UNIQUE INDEX "api_keys_key_hash_unique" ON "api_keys" ("key_hash");
