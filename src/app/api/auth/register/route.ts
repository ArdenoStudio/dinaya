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
import { eq } from "drizzle-orm";

type BusinessType =
  | "salon_barber"
  | "clinic"
  | "tuition"
  | "vehicle_service"
  | "photography"
  | "consulting"
  | "spa_wellness"
  | "other";

const BUSINESS_TYPES = new Set<BusinessType>([
  "salon_barber",
  "clinic",
  "tuition",
  "vehicle_service",
  "photography",
  "consulting",
  "spa_wellness",
  "other",
]);

const PRESET_SERVICES: Record<BusinessType, { name: string; durationMinutes: number; priceLkr: number; description: string }[]> = {
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

function cleanBusinessType(value: unknown): BusinessType {
  return typeof value === "string" && BUSINESS_TYPES.has(value as BusinessType)
    ? (value as BusinessType)
    : "other";
}

function cleanLanguage(value: unknown): "en" | "si" | "ta" {
  return value === "si" || value === "ta" ? value : "en";
}

export async function POST(req: NextRequest) {
  const { name, businessName, slug, email, password, businessType, language } = await req.json();

  if (!name || !businessName || !slug || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Slug validation
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug may only contain lowercase letters, numbers, and hyphens." },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const [existingBusiness] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (existingBusiness) {
    return NextResponse.json({ error: "That URL is already taken. Try a different one." }, { status: 409 });
  }

  // Check email uniqueness
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const selectedBusinessType = cleanBusinessType(businessType);
  const selectedLanguage = cleanLanguage(language);

  await db.transaction(async (tx) => {
    const [business] = await tx
      .insert(businesses)
      .values({
        slug,
        name: businessName,
        email,
        businessType: selectedBusinessType,
        language: selectedLanguage,
        cancellationPolicy: "Please contact the business as early as possible if you need to cancel or reschedule.",
        depositPolicy: "Some services may require a deposit to reduce no-shows.",
      })
      .returning({ id: businesses.id });

    await tx.insert(users).values({
      businessId: business.id,
      name,
      email,
      passwordHash,
      role: "owner",
    });

    const [ownerStaff] = await tx
      .insert(staff)
      .values({
        businessId: business.id,
        name,
        bio: "Owner",
        isActive: true,
      })
      .returning({ id: staff.id });

    const serviceRows = await tx
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
        }))
      )
      .returning({ id: services.id });

    if (serviceRows.length > 0) {
      await tx.insert(staffServices).values(
        serviceRows.map((service) => ({
          staffId: ownerStaff.id,
          serviceId: service.id,
        }))
      );
    }

    await tx.insert(availability).values(
      [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        staffId: ownerStaff.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      }))
    );

    const [defaultLocation] = await tx
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

    await tx.insert(staffLocations).values({
      staffId: ownerStaff.id,
      locationId: defaultLocation.id,
      isPrimary: true,
    });

    await tx.insert(messageTemplates).values([
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
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
