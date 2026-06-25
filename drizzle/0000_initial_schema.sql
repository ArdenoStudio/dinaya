CREATE TYPE "public"."plan" AS ENUM('free', 'pro');
CREATE TYPE "public"."role" AS ENUM('owner', 'staff');
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed', 'refunded');
CREATE TYPE "public"."webhook_event" AS ENUM(
  'booking.created',
  'booking.confirmed',
  'booking.cancelled',
  'booking.completed',
  'booking.no_show'
);

CREATE TABLE "businesses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(50) NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "logo_url" text,
  "phone" varchar(20),
  "email" varchar(255),
  "address" text,
  "instagram_url" text,
  "facebook_url" text,
  "website_url" text,
  "gallery_images" text[],
  "plan" "plan" DEFAULT 'free' NOT NULL,
  "plan_expires_at" timestamp,
  "payhere_enabled" boolean DEFAULT false NOT NULL,
  "payhere_merchant_id" varchar(100),
  "payhere_merchant_secret" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "role" "role" DEFAULT 'owner' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "duration_minutes" integer NOT NULL,
  "price_lkr" integer DEFAULT 0 NOT NULL,
  "requires_payment" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "before_buffer" integer DEFAULT 0 NOT NULL,
  "after_buffer" integer DEFAULT 0 NOT NULL,
  "minimum_notice_hours" integer DEFAULT 0 NOT NULL,
  "daily_capacity" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "bio" text,
  "avatar_url" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "staff_services" (
  "staff_id" uuid NOT NULL,
  "service_id" uuid NOT NULL
);

CREATE TABLE "availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL,
  "day_of_week" smallint NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL
);

CREATE TABLE "availability_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL,
  "date" date NOT NULL,
  "is_blocked" boolean DEFAULT true NOT NULL,
  "start_time" time,
  "end_time" time,
  "reason" varchar(200)
);

CREATE TABLE "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "service_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "client_name" varchar(100) NOT NULL,
  "client_phone" varchar(20) NOT NULL,
  "client_email" varchar(255),
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" "booking_status" DEFAULT 'pending' NOT NULL,
  "notes" text,
  "staff_notes" text,
  "reminder_sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "booking_id" uuid,
  "client_name" varchar(100) NOT NULL,
  "rating" smallint NOT NULL,
  "comment" text,
  "is_published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "webhooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "url" text NOT NULL,
  "secret" text,
  "events" "webhook_event"[] NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL,
  "amount_lkr" integer NOT NULL,
  "payhere_order_id" varchar(100),
  "status" "payment_status" DEFAULT 'pending' NOT NULL,
  "payhere_payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "payments_payhere_order_id_unique" UNIQUE("payhere_order_id")
);

ALTER TABLE "users" ADD CONSTRAINT "users_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "staff" ADD CONSTRAINT "staff_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_id_staff_id_fk"
  FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_id_services_id_fk"
  FOREIGN KEY ("service_id") REFERENCES "public"."services"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "availability" ADD CONSTRAINT "availability_staff_id_staff_id_fk"
  FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_staff_id_staff_id_fk"
  FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk"
  FOREIGN KEY ("service_id") REFERENCES "public"."services"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_staff_id_fk"
  FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk"
  FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id")
  ON DELETE set null ON UPDATE no action;
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk"
  FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id")
  ON DELETE cascade ON UPDATE no action;
