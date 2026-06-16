import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businessHolidays } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";

const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(1).max(120),
  isClosed: z.boolean().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;

  const rows = await db
    .select()
    .from(businessHolidays)
    .where(eq(businessHolidays.businessId, authResult.context.businessId))
    .orderBy(businessHolidays.date);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;

  const parsed = holidaySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid holiday." }, { status: 400 });
  }

  const data = parsed.data;
  const [holiday] = await db
    .insert(businessHolidays)
    .values({
      businessId: authResult.context.businessId,
      date: data.date,
      name: data.name,
      isClosed: data.isClosed ?? true,
      startTime: data.isClosed === false ? data.startTime ?? null : null,
      endTime: data.isClosed === false ? data.endTime ?? null : null,
      locationId: data.locationId ?? null,
    })
    .onConflictDoNothing()
    .returning();

  if (!holiday) {
    return NextResponse.json({ error: "A holiday already exists for this date." }, { status: 409 });
  }

  return NextResponse.json(holiday, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Holiday id required." }, { status: 400 });
  }

  await db
    .delete(businessHolidays)
    .where(
      and(eq(businessHolidays.id, id), eq(businessHolidays.businessId, authResult.context.businessId)),
    );

  return NextResponse.json({ ok: true });
}
