import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, services } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { bookingRouterSchema } from "@/lib/booking-router";

async function listServices(businessId: string) {
  return db
    .select({ id: services.id, name: services.name, isActive: services.isActive })
    .from(services)
    .where(eq(services.businessId, businessId))
    .orderBy(asc(services.name));
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const [[business], serviceList] = await Promise.all([
    db
      .select({ bookingRouter: businesses.bookingRouter })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    listServices(businessId),
  ]);

  return NextResponse.json({
    router: business?.bookingRouter ?? null,
    services: serviceList,
  });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = bookingRouterSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the router details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const router = parsed.data;

  // Every option must point at a service owned by this business.
  if (router.options.length > 0) {
    const ownedServices = await db
      .select({ id: services.id, isActive: services.isActive })
      .from(services)
      .where(and(eq(services.businessId, businessId)));
    const ownedIds = new Set(ownedServices.map((s) => s.id));
    const stranger = router.options.find((o) => !ownedIds.has(o.serviceId));
    if (stranger) {
      return NextResponse.json(
        { error: "A router option points at a service that doesn't exist." },
        { status: 400 },
      );
    }

    if (router.enabled) {
      const activeIds = new Set(ownedServices.filter((s) => s.isActive).map((s) => s.id));
      const hasActiveTarget = router.options.some((o) => activeIds.has(o.serviceId));
      if (!hasActiveTarget) {
        return NextResponse.json(
          { error: "Add at least one answer that routes to an active service." },
          { status: 400 },
        );
      }
    }
  }

  await db
    .update(businesses)
    .set({ bookingRouter: router })
    .where(eq(businesses.id, businessId));

  return NextResponse.json({ router });
}
