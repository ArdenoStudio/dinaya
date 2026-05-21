import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { getLocationForBusiness, slugifyLocationName } from "@/lib/locations";
import { z } from "@/lib/validation";

const locationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  address: z.string().trim().max(1000).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  timezone: z.string().trim().min(1).max(80).optional(),
  slug: z.string().trim().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const row = await getLocationForBusiness(businessId, id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const existing = await getLocationForBusiness(businessId, id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = locationUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the location details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const patch = parsed.data;
  const update: Partial<typeof locations.$inferInsert> = {};

  if (patch.name !== undefined) update.name = patch.name;
  if (patch.address !== undefined) update.address = patch.address || null;
  if (patch.phone !== undefined) update.phone = patch.phone || null;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;
  if (patch.isActive !== undefined) update.isActive = patch.isActive;
  if (patch.sortOrder !== undefined) update.sortOrder = patch.sortOrder;

  if (patch.slug !== undefined) {
    const slug = patch.slug?.trim() || slugifyLocationName(patch.name ?? existing.name);
    if (slug) {
      const [conflict] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(eq(locations.businessId, businessId), eq(locations.slug, slug)))
        .limit(1);
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: "That branch slug is already in use." }, { status: 409 });
      }
      update.slug = slug;
    }
  }

  if (patch.isDefault === true) {
    await db
      .update(locations)
      .set({ isDefault: false })
      .where(eq(locations.businessId, businessId));
    update.isDefault = true;
  }

  if (Object.keys(update).length > 0) {
    await db.update(locations).set(update).where(eq(locations.id, id));
  }

  const updated = await getLocationForBusiness(businessId, id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const existing = await getLocationForBusiness(businessId, id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Set another branch as default before deleting this one." },
      { status: 409 }
    );
  }

  await db.delete(locations).where(and(eq(locations.id, id), eq(locations.businessId, businessId)));
  return NextResponse.json({ success: true });
}
