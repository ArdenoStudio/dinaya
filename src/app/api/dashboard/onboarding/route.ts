import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { availability, businesses, locations, services, staff } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { inferDirectoryCategory } from "@/lib/directory";
import { updateLocationAiConfig } from "@/lib/locations";
import { buildPublicBookingUrl } from "@/lib/booking-url";
import { z } from "@/lib/validation";

const stepSchema = z.object({
  step: z.number().int().min(0).max(4),
});

function inferDirectoryCity(address: string | null | undefined): string {
  if (!address) return "Colombo";
  const lower = address.toLowerCase();
  for (const city of ["Colombo", "Kandy", "Galle", "Negombo", "Jaffna", "Dehiwala", "Nugegoda", "Maharagama", "Battaramulla", "Moratuwa"]) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return "Colombo";
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const [business] = await db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      phone: businesses.phone,
      address: businesses.address,
      businessType: businesses.businessType,
      language: businesses.language,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
      onboardingStep: businesses.onboardingStep,
      onboardingCompletedAt: businesses.onboardingCompletedAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  const [firstService] = await db
    .select({
      id: services.id,
      name: services.name,
      durationMinutes: services.durationMinutes,
      priceLkr: services.priceLkr,
      description: services.description,
    })
    .from(services)
    .where(and(eq(services.businessId, businessId), eq(services.isActive, true)))
    .orderBy(asc(services.createdAt))
    .limit(1);

  const staffList = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)))
    .orderBy(asc(staff.createdAt));

  const ownerStaff = staffList[0];
  let availabilityRows: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
  if (ownerStaff) {
    availabilityRows = await db
      .select({
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
      })
      .from(availability)
      .where(eq(availability.staffId, ownerStaff.id))
      .orderBy(asc(availability.dayOfWeek));
  }

  const bookingUrl = buildPublicBookingUrl({
    slug: business.slug,
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
  });

  return NextResponse.json({
    business,
    firstService: firstService ?? null,
    staffList,
    availabilityRows,
    bookingUrl,
    completed: Boolean(business.onboardingCompletedAt),
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = stepSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid step." }, { status: 400 });
  }

  await db
    .update(businesses)
    .set({ onboardingStep: parsed.data.step })
    .where(eq(businesses.id, businessId));

  return NextResponse.json({ ok: true, step: parsed.data.step });
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const [business] = await db
    .select({
      businessType: businesses.businessType,
      address: businesses.address,
      onboardingCompletedAt: businesses.onboardingCompletedAt,
      directoryListed: businesses.directoryListed,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  const directoryCategory = inferDirectoryCategory(business.businessType);
  const directoryCity = inferDirectoryCity(business.address);

  if (business.onboardingCompletedAt) {
    if (!business.directoryListed) {
      await db
        .update(businesses)
        .set({
          directoryListed: true,
          directoryCategory,
          directoryCity,
        })
        .where(eq(businesses.id, businessId));
    }
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  await db
    .update(businesses)
    .set({
      onboardingCompletedAt: new Date(),
      onboardingStep: 4,
      directoryListed: true,
      directoryCategory,
      directoryCity,
    })
    .where(eq(businesses.id, businessId));

  const [defaultLocation] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isDefault, true)))
    .limit(1);

  if (defaultLocation) {
    await updateLocationAiConfig(businessId, defaultLocation.id, {
      clientReactivationCampaign: true,
    });
  }

  return NextResponse.json({ ok: true });
}
