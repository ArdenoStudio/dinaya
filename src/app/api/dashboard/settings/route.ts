import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const { name, description, phone, address } = await req.json();

  if (!name) return NextResponse.json({ error: "Business name is required." }, { status: 400 });

  await db
    .update(businesses)
    .set({ name, description: description || null, phone: phone || null, address: address || null })
    .where(eq(businesses.id, businessId));

  return NextResponse.json({ success: true });
}
