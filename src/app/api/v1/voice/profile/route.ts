import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  locations,
  services,
  staff,
  staffLocations,
  staffServices,
  voiceIntegrations,
} from "@/db/schema";
import { requireApiKey } from "@/lib/api-key-auth";
import { canUseFeature, getBusinessPlan, planDisplayName } from "@/lib/plan";
import {
  VOICE_RECEPTIONIST_ROLLOUT,
  isVoiceReceptionistRolloutOpen,
  serializeVoiceIntegration,
} from "@/lib/voice-receptionist";

function appBaseUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const keyResult = await requireApiKey(req, "voice:read");
  if (!keyResult.ok) return keyResult.response;
  const { businessId } = keyResult.context;

  const [business] = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      description: businesses.description,
      phone: businesses.phone,
      email: businesses.email,
      address: businesses.address,
      timezone: businesses.timezone,
      language: businesses.language,
      businessType: businesses.businessType,
      cancellationPolicy: businesses.cancellationPolicy,
      depositPolicy: businesses.depositPolicy,
      bankTransferInstructions: businesses.bankTransferInstructions,
      lankaqrImageUrl: businesses.lankaqrImageUrl,
      websiteUrl: businesses.websiteUrl,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  if (!isVoiceReceptionistRolloutOpen()) {
    return NextResponse.json(
      {
        error: VOICE_RECEPTIONIST_ROLLOUT.message,
        feature: "aiVoiceReceptionist",
        rollout: VOICE_RECEPTIONIST_ROLLOUT.status,
      },
      { status: 503 },
    );
  }

  const plan = await getBusinessPlan(businessId);
  if (!canUseFeature(plan, "aiVoiceReceptionist")) {
    return NextResponse.json(
      {
        error: `AI Voice Receptionist requires the ${planDisplayName("max")} plan.`,
        feature: "aiVoiceReceptionist",
        requiredPlan: planDisplayName("max"),
      },
      { status: 402 },
    );
  }

  const [integration] = await db
    .select()
    .from(voiceIntegrations)
    .where(eq(voiceIntegrations.businessId, businessId))
    .limit(1);

  const [locationRows, serviceRows, staffRows] = await Promise.all([
    db
      .select({
        id: locations.id,
        name: locations.name,
        slug: locations.slug,
        address: locations.address,
        phone: locations.phone,
        timezone: locations.timezone,
        isDefault: locations.isDefault,
        sortOrder: locations.sortOrder,
      })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)))
      .orderBy(asc(locations.sortOrder), asc(locations.name)),
    db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        durationMinutes: services.durationMinutes,
        priceLkr: services.priceLkr,
        requiresPayment: services.requiresPayment,
        depositPercent: services.depositPercent,
        beforeBuffer: services.beforeBuffer,
        afterBuffer: services.afterBuffer,
        minimumNoticeHours: services.minimumNoticeHours,
        dailyCapacity: services.dailyCapacity,
      })
      .from(services)
      .where(and(eq(services.businessId, businessId), eq(services.isActive, true)))
      .orderBy(asc(services.name)),
    db
      .select({
        id: staff.id,
        name: staff.name,
        bio: staff.bio,
      })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)))
      .orderBy(asc(staff.name)),
  ]);

  const staffIds = staffRows.map((row) => row.id);
  const serviceIds = serviceRows.map((row) => row.id);

  const [staffServiceRows, staffLocationRows] = await Promise.all([
    staffIds.length > 0 && serviceIds.length > 0
      ? db
          .select({
            staffId: staffServices.staffId,
            serviceId: staffServices.serviceId,
            priceOverrideLkr: staffServices.priceOverrideLkr,
          })
          .from(staffServices)
          .where(
            and(
              inArray(staffServices.staffId, staffIds),
              inArray(staffServices.serviceId, serviceIds),
            ),
          )
      : Promise.resolve([]),
    staffIds.length > 0
      ? db
          .select({
            staffId: staffLocations.staffId,
            locationId: staffLocations.locationId,
          })
          .from(staffLocations)
          .where(inArray(staffLocations.staffId, staffIds))
      : Promise.resolve([]),
  ]);

  const baseUrl = appBaseUrl(req);

  return NextResponse.json({
    business,
    voiceIntegration: serializeVoiceIntegration(integration ?? null),
    locations: locationRows,
    services: serviceRows,
    staff: staffRows,
    staffServices: staffServiceRows,
    staffLocations: staffLocationRows,
    endpoints: {
      availability:
        `${baseUrl}/api/v1/availability?businessId=${business.id}&serviceId={serviceId}&staffId={staffId}&date={yyyy-mm-dd}`,
      bookingCreate: `${baseUrl}/api/v1/bookings`,
      calendar: `${baseUrl}/api/v1/calendar?from={iso}&to={iso}`,
    },
    bookingSource: "voice_agent",
  });
}
