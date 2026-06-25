ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "booking_page_background" varchar(20) DEFAULT 'white' NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "booking_page_background_color" varchar(7);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "booking_hero_overlay" varchar(20) DEFAULT 'light' NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "booking_hero_overlay_opacity" integer DEFAULT 60 NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "booking_theme_preset" varchar(40);
