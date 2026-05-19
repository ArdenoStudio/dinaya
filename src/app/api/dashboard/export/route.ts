import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  activityLog,
  availability,
  availabilityOverrides,
  bookings,
  businesses,
  clients,
  clientNotes,
  payments,
  reviews,
  services,
  staff,
  staffServices,
  users,
} from "@/db/schema";
import { getBusinessContext } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  const context = await getBusinessContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = context;

  const [
    businessRows,
    userRows,
    serviceRows,
    staffRows,
    staffServiceRows,
    availabilityRows,
    overrideRows,
    clientRows,
    bookingRows,
    reviewRows,
    paymentRows,
    activityRows,
  ] = await Promise.all([
    db
      .select({
        id: businesses.id,
        slug: businesses.slug,
        name: businesses.name,
        description: businesses.description,
        logoUrl: businesses.logoUrl,
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
        instagramUrl: businesses.instagramUrl,
        facebookUrl: businesses.facebookUrl,
        websiteUrl: businesses.websiteUrl,
        galleryImages: businesses.galleryImages,
        plan: businesses.plan,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.businessId, businessId)),
    db.select().from(services).where(eq(services.businessId, businessId)),
    db.select().from(staff).where(eq(staff.businessId, businessId)),
    db
      .select({
        staffId: staffServices.staffId,
        serviceId: staffServices.serviceId,
        priceOverrideLkr: staffServices.priceOverrideLkr,
      })
      .from(staffServices)
      .innerJoin(staff, eq(staffServices.staffId, staff.id))
      .where(eq(staff.businessId, businessId)),
    db
      .select()
      .from(availability)
      .innerJoin(staff, eq(availability.staffId, staff.id))
      .where(eq(staff.businessId, businessId)),
    db
      .select()
      .from(availabilityOverrides)
      .innerJoin(staff, eq(availabilityOverrides.staffId, staff.id))
      .where(eq(staff.businessId, businessId)),
    db.select().from(clients).where(eq(clients.businessId, businessId)),
    db.select().from(bookings).where(eq(bookings.businessId, businessId)),
    db.select().from(reviews).where(eq(reviews.businessId, businessId)),
    db
      .select({
        id: payments.id,
        bookingId: payments.bookingId,
        amountLkr: payments.amountLkr,
        payhereOrderId: payments.payhereOrderId,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.businessId, businessId)),
    db.select().from(activityLog).where(eq(activityLog.businessId, businessId)),
  ]);

  const clientIds = clientRows.map((client) => client.id);
  const noteRows = clientIds.length
    ? await db.select().from(clientNotes).where(inArray(clientNotes.clientId, clientIds))
    : [];

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      business: businessRows[0] ?? null,
      users: userRows,
      services: serviceRows,
      staff: staffRows,
      staffServices: staffServiceRows,
      availability: availabilityRows.map((row) => row.availability),
      availabilityOverrides: overrideRows.map((row) => row.availability_overrides),
      clients: clientRows,
      clientNotes: noteRows,
      bookings: bookingRows,
      reviews: reviewRows,
      payments: paymentRows,
      activityLog: activityRows,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="dinaya-export-${businessId}.json"`,
      },
    }
  );
}
