import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { inArray, like } from "drizzle-orm";
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
import { TRIAL_LENGTH_DAYS } from "@/lib/plan";
import type { RegisterInput } from "@/lib/schemas/register";

export const PERSONA_PASSWORD = "TestPass123!";
export const PERSONA_SLUG_PREFIX = "e2e-persona-";
export const PERSONA_EMAIL_DOMAIN = "dinaya.test";

export type PersonaPlan = "trial" | "starter" | "pro" | "max";

export type PersonaRecord = {
  index: number;
  name: string;
  email: string;
  password: string;
  businessName: string;
  slug: string;
  plan: PersonaPlan;
  businessType: NonNullable<RegisterInput["businessType"]>;
  language: "en" | "si" | "ta";
  businessId: string;
  staffId: string;
  locationId: string;
  serviceId: string;
  serviceName: string;
};

const BUSINESS_TYPES: NonNullable<RegisterInput["businessType"]>[] = [
  "salon_barber",
  "clinic",
  "tuition",
  "vehicle_service",
  "photography",
  "consulting",
  "spa_wellness",
  "other",
];

const PRESET_SERVICES: Record<
  NonNullable<RegisterInput["businessType"]>,
  { name: string; durationMinutes: number; priceLkr: number; description: string }[]
> = {
  salon_barber: [
    { name: "Haircut", durationMinutes: 30, priceLkr: 1500, description: "Standard cut." },
  ],
  clinic: [
    { name: "Doctor consultation", durationMinutes: 20, priceLkr: 2500, description: "Consultation." },
  ],
  tuition: [
    { name: "One-to-one class", durationMinutes: 60, priceLkr: 2500, description: "Class slot." },
  ],
  vehicle_service: [
    { name: "Vehicle inspection", durationMinutes: 30, priceLkr: 1000, description: "Inspection." },
  ],
  photography: [
    { name: "Shoot consultation", durationMinutes: 30, priceLkr: 0, description: "Consultation." },
  ],
  consulting: [
    { name: "Discovery call", durationMinutes: 30, priceLkr: 0, description: "Discovery." },
  ],
  spa_wellness: [
    { name: "Massage therapy", durationMinutes: 60, priceLkr: 6500, description: "Massage." },
  ],
  other: [
    { name: "Standard appointment", durationMinutes: 60, priceLkr: 2500, description: "Appointment." },
  ],
};

const PLANS: PersonaPlan[] = ["trial", "starter", "pro", "max"];

export function personaSlug(index: number): string {
  return `${PERSONA_SLUG_PREFIX}${String(index).padStart(4, "0")}`;
}

export function personaEmail(index: number): string {
  return `persona-${String(index).padStart(4, "0")}@${PERSONA_EMAIL_DOMAIN}`;
}

export function planForIndex(index: number): PersonaPlan {
  return PLANS[index % PLANS.length]!;
}

let cachedPasswordHash: string | null = null;

async function passwordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(PERSONA_PASSWORD, 10);
  }
  return cachedPasswordHash;
}

export function buildPersonaMeta(index: number): Omit<
  PersonaRecord,
  "businessId" | "staffId" | "locationId" | "serviceId" | "serviceName"
> {
  const businessType = BUSINESS_TYPES[index % BUSINESS_TYPES.length]!;
  const language = (["en", "si", "ta"] as const)[index % 3]!;
  const slug = personaSlug(index);
  return {
    index,
    name: `Persona ${index}`,
    email: personaEmail(index),
    password: PERSONA_PASSWORD,
    businessName: `E2E Persona ${index}`,
    slug,
    plan: planForIndex(index),
    businessType,
    language,
  };
}

export async function seedPersona(index: number): Promise<PersonaRecord> {
  const meta = buildPersonaMeta(index);
  const businessType = meta.businessType;
  const preset = PRESET_SERVICES[businessType][0]!;
  const businessId = randomUUID();
  const staffId = randomUUID();
  const locationId = randomUUID();
  const serviceId = randomUUID();
  const hash = await passwordHash();
  const planExpiresAt =
    meta.plan === "trial"
      ? addDays(new Date(), TRIAL_LENGTH_DAYS)
      : addDays(new Date(), 30);

  await db.batch([
    db.insert(businesses).values({
      id: businessId,
      slug: meta.slug,
      name: meta.businessName,
      email: meta.email,
      businessType,
      language: meta.language,
      referralCode: meta.slug,
      plan: meta.plan === "starter" ? "starter" : meta.plan === "trial" ? "trial" : meta.plan,
      planExpiresAt,
      cancellationPolicy: "Contact the business to cancel or reschedule.",
      depositPolicy: "Deposits may apply for some services.",
    }),
    db.insert(users).values({
      businessId,
      name: meta.name,
      email: meta.email,
      passwordHash: hash,
      role: "owner",
    }),
    db.insert(staff).values({
      id: staffId,
      businessId,
      name: meta.name,
      bio: "Owner",
      isActive: true,
    }),
    db.insert(services).values({
      id: serviceId,
      businessId,
      name: preset.name,
      durationMinutes: preset.durationMinutes,
      priceLkr: preset.priceLkr,
      description: preset.description,
      requiresPayment: false,
      depositPercent: 0,
      beforeBuffer: 0,
      afterBuffer: 0,
      minimumNoticeHours: 0,
    }),
    db.insert(staffServices).values({ staffId, serviceId }),
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
      name: meta.businessName,
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
    db.insert(messageTemplates).values({
      businessId,
      channel: "whatsapp",
      name: "Booking confirmation",
      body: "Hi {{clientName}}, your {{serviceName}} booking is confirmed for {{appointmentTime}}.",
      variables: ["clientName", "serviceName", "appointmentTime"],
    }),
  ]);

  return {
    ...meta,
    businessId,
    staffId,
    locationId,
    serviceId,
    serviceName: preset.name,
  };
}

export async function deletePersonasBySlugPrefix(prefix = PERSONA_SLUG_PREFIX): Promise<number> {
  const rows = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(like(businesses.slug, `${prefix}%`));

  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return 0;

  await db.delete(businesses).where(inArray(businesses.id, ids));
  return ids.length;
}
