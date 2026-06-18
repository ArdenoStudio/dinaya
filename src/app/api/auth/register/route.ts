import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  availability,
  businesses,
  locations,
  messageTemplates,
  services,
  staff,
  staffLocations,
  staffServices,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { normalizeReferralCode } from "@/lib/referrals";
import { withApiHandler } from "@/lib/api-handler";
import { withRateLimit } from "@/lib/rate-limit";
import { registerSchema, type RegisterInput } from "@/lib/schemas/register";
import { TRIAL_LENGTH_DAYS } from "@/lib/plan";

type BusinessType = NonNullable<RegisterInput["businessType"]>;

const PRESET_SERVICES: Record<
  BusinessType,
  { name: string; durationMinutes: number; priceLkr: number; description: string }[]
> = {
  salon_barber: [
    { name: "Haircut", durationMinutes: 30, priceLkr: 1500, description: "Standard cut and styling." },
    { name: "Hair colouring consultation", durationMinutes: 45, priceLkr: 2500, description: "Consultation before colour work." },
    { name: "Beard trim", durationMinutes: 20, priceLkr: 800, description: "Shape and tidy beard service." },
  ],
  clinic: [
    { name: "Doctor consultation", durationMinutes: 20, priceLkr: 2500, description: "In-person consultation slot." },
    { name: "Follow-up visit", durationMinutes: 15, priceLkr: 1500, description: "Follow-up for existing patients." },
  ],
  tuition: [
    { name: "One-to-one class", durationMinutes: 60, priceLkr: 2500, description: "Individual learning session." },
    { name: "Group class", durationMinutes: 90, priceLkr: 1500, description: "Scheduled group class slot." },
  ],
  vehicle_service: [
    { name: "Vehicle inspection", durationMinutes: 30, priceLkr: 1000, description: "Initial inspection and estimate." },
    { name: "Full service appointment", durationMinutes: 120, priceLkr: 7500, description: "Workshop service booking." },
  ],
  photography: [
    { name: "Shoot consultation", durationMinutes: 30, priceLkr: 0, description: "Plan package, date, and location." },
    { name: "Portrait session", durationMinutes: 60, priceLkr: 12000, description: "Studio or outdoor portrait session." },
  ],
  consulting: [
    { name: "Discovery call", durationMinutes: 30, priceLkr: 0, description: "Understand the requirement before quoting." },
    { name: "Consultation", durationMinutes: 60, priceLkr: 5000, description: "Paid advisory session." },
  ],
  spa_wellness: [
    { name: "Massage therapy", durationMinutes: 60, priceLkr: 6500, description: "Relaxation or recovery session." },
    { name: "Facial treatment", durationMinutes: 45, priceLkr: 5500, description: "Skin care appointment." },
  ],
  other: [
    { name: "Consultation", durationMinutes: 30, priceLkr: 0, description: "Default appointment type." },
    { name: "Standard appointment", durationMinutes: 60, priceLkr: 2500, description: "General booking slot." },
  ],
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; cause?: { code?: string } };
  return maybe.code === "23505" || maybe.cause?.code === "23505";
}

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "register",
    limit: 5,
    windowSeconds: 60 * 15,
  });
  if (!limited.ok) return limited.response;

  return withApiHandler(async () => {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check your registration details.", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, businessName, slug, email, password, businessType, language, referrerCode } = parsed.data;
    const selectedBusinessType = businessType ?? "other";
    const selectedLanguage = language ?? "en";
    let referredByBusinessId: string | null = null;

    if (referrerCode) {
      const normalizedReferrer = normalizeReferralCode(referrerCode);
      const [referrer] = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.referralCode, normalizedReferrer))
        .limit(1);
      referredByBusinessId = referrer?.id ?? null;
    }

    const [existingBusiness] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (existingBusiness) {
      return NextResponse.json({ error: "That URL is already taken. Try a different one." }, { status: 409 });
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Pre-generate ids so every insert is independent. neon-http has no
    // interactive transactions, but db.batch() runs them atomically in a single
    // transaction (all-or-nothing) — so a mid-sequence failure can't leave
    // orphaned rows and no manual compensation is needed. Order matters: parent
    // rows must precede the rows that reference them via foreign keys.
    const businessId = randomUUID();
    const staffId = randomUUID();
    const locationId = randomUUID();
    const presetServices = PRESET_SERVICES[selectedBusinessType].map((preset) => ({
      id: randomUUID(),
      businessId,
      ...preset,
      requiresPayment: false,
      depositPercent: 0,
      beforeBuffer: 0,
      afterBuffer: 0,
      minimumNoticeHours: 2,
    }));

    try {
      await db.batch([
        db.insert(businesses).values({
          id: businessId,
          slug,
          name: businessName,
          email,
          businessType: selectedBusinessType,
          language: selectedLanguage,
          referralCode: slug,
          referredByBusinessId,
          plan: "trial",
          planExpiresAt: addDays(new Date(), TRIAL_LENGTH_DAYS),
          cancellationPolicy: "Please contact the business as early as possible if you need to cancel or reschedule.",
          depositPolicy: "Some services may require a deposit to reduce no-shows.",
        }),
        db.insert(users).values({
          businessId,
          name,
          email,
          passwordHash,
          role: "owner",
        }),
        db.insert(staff).values({
          id: staffId,
          businessId,
          name,
          bio: "Owner",
          isActive: true,
        }),
        db.insert(services).values(presetServices),
        db.insert(staffServices).values(
          presetServices.map((service) => ({
            staffId,
            serviceId: service.id,
          })),
        ),
        db.insert(availability).values(
          [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            staffId,
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
          })),
        ),
        db.insert(locations).values({
          id: locationId,
          businessId,
          name: businessName,
          slug: "main",
          timezone: "Asia/Colombo",
          isDefault: true,
          isActive: true,
          sortOrder: 0,
        }),
        db.insert(staffLocations).values({
          staffId,
          locationId,
          isPrimary: true,
        }),
        db.insert(messageTemplates).values([
          {
            businessId,
            channel: "whatsapp",
            name: "Booking confirmation",
            body: "Hi {{clientName}}, your {{serviceName}} booking at {{businessName}} is confirmed for {{appointmentTime}}.",
            variables: ["clientName", "serviceName", "businessName", "appointmentTime"],
          },
          {
            businessId,
            channel: "whatsapp",
            name: "Appointment reminder",
            body: "Hi {{clientName}}, reminder: your {{serviceName}} booking at {{businessName}} is on {{appointmentTime}}.",
            variables: ["clientName", "serviceName", "businessName", "appointmentTime"],
          },
        ]),
      ]);

      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      // The batch is atomic, so a failure leaves no partial rows. A slug/email
      // unique violation (e.g. a concurrent signup that raced the pre-checks
      // above) becomes a clean 409 instead of a 500.
      if (isUniqueViolation(error)) {
        return NextResponse.json(
          { error: "That URL or email is already taken. Please try again." },
          { status: 409 },
        );
      }
      throw error;
    }
  }, "Unable to create account.");
}
