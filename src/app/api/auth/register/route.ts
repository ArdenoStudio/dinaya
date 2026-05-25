import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
import { eq, inArray } from "drizzle-orm";
import { normalizeReferralCode } from "@/lib/referrals";
import { withApiHandler } from "@/lib/api-handler";
import { withRateLimit } from "@/lib/rate-limit";
import { registerSchema, type RegisterInput } from "@/lib/schemas/register";

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

async function cleanupRegistration(input: {
  businessId?: string;
  userId?: string;
  staffId?: string;
  serviceIds?: string[];
  locationId?: string;
}): Promise<void> {
  try {
    if (input.serviceIds?.length) {
      await db.delete(staffServices).where(inArray(staffServices.serviceId, input.serviceIds));
      await db.delete(services).where(inArray(services.id, input.serviceIds));
    }
    if (input.staffId) {
      await db.delete(staffLocations).where(eq(staffLocations.staffId, input.staffId));
      await db.delete(availability).where(eq(availability.staffId, input.staffId));
      await db.delete(staff).where(eq(staff.id, input.staffId));
    }
    if (input.locationId) {
      await db.delete(locations).where(eq(locations.id, input.locationId));
    }
    if (input.businessId) {
      await db.delete(messageTemplates).where(eq(messageTemplates.businessId, input.businessId));
      await db.delete(users).where(eq(users.businessId, input.businessId));
      await db.delete(businesses).where(eq(businesses.id, input.businessId));
    } else if (input.userId) {
      await db.delete(users).where(eq(users.id, input.userId));
    }
  } catch (cleanupError) {
    console.error("[register] cleanup failed", cleanupError);
  }
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
    const cleanupState: {
      businessId?: string;
      userId?: string;
      staffId?: string;
      serviceIds?: string[];
      locationId?: string;
    } = {};

    try {
      const [business] = await db
        .insert(businesses)
        .values({
          slug,
          name: businessName,
          email,
          businessType: selectedBusinessType,
          language: selectedLanguage,
          referralCode: slug,
          referredByBusinessId,
          cancellationPolicy: "Please contact the business as early as possible if you need to cancel or reschedule.",
          depositPolicy: "Some services may require a deposit to reduce no-shows.",
        })
        .returning({ id: businesses.id });

      cleanupState.businessId = business.id;

      const [user] = await db
        .insert(users)
        .values({
          businessId: business.id,
          name,
          email,
          passwordHash,
          role: "owner",
        })
        .returning({ id: users.id });

      cleanupState.userId = user.id;

      const [ownerStaff] = await db
        .insert(staff)
        .values({
          businessId: business.id,
          name,
          bio: "Owner",
          isActive: true,
        })
        .returning({ id: staff.id });

      cleanupState.staffId = ownerStaff.id;

      const serviceRows = await db
        .insert(services)
        .values(
          PRESET_SERVICES[selectedBusinessType].map((preset) => ({
            businessId: business.id,
            ...preset,
            requiresPayment: false,
            depositPercent: 0,
            beforeBuffer: 0,
            afterBuffer: 0,
            minimumNoticeHours: 2,
          })),
        )
        .returning({ id: services.id });

      cleanupState.serviceIds = serviceRows.map((row) => row.id);

      if (serviceRows.length > 0) {
        await db.insert(staffServices).values(
          serviceRows.map((service) => ({
            staffId: ownerStaff.id,
            serviceId: service.id,
          })),
        );
      }

      await db.insert(availability).values(
        [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          staffId: ownerStaff.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
        })),
      );

      const [defaultLocation] = await db
        .insert(locations)
        .values({
          businessId: business.id,
          name: businessName,
          slug: "main",
          timezone: "Asia/Colombo",
          isDefault: true,
          isActive: true,
          sortOrder: 0,
        })
        .returning({ id: locations.id });

      cleanupState.locationId = defaultLocation.id;

      await db.insert(staffLocations).values({
        staffId: ownerStaff.id,
        locationId: defaultLocation.id,
        isPrimary: true,
      });

      await db.insert(messageTemplates).values([
        {
          businessId: business.id,
          channel: "whatsapp",
          name: "Booking confirmation",
          body: "Hi {{clientName}}, your {{serviceName}} booking at {{businessName}} is confirmed for {{appointmentTime}}.",
          variables: ["clientName", "serviceName", "businessName", "appointmentTime"],
        },
        {
          businessId: business.id,
          channel: "whatsapp",
          name: "Appointment reminder",
          body: "Hi {{clientName}}, reminder: your {{serviceName}} booking at {{businessName}} is on {{appointmentTime}}.",
          variables: ["clientName", "serviceName", "businessName", "appointmentTime"],
        },
      ]);

      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      await cleanupRegistration(cleanupState);
      throw error;
    }
  }, "Unable to create account.");
}
