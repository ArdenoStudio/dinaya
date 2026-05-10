import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { name, businessName, slug, email, password } = await req.json();

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

  const [business] = await db
    .insert(businesses)
    .values({ slug, name: businessName, email })
    .returning({ id: businesses.id });

  await db.insert(users).values({
    businessId: business.id,
    name,
    email,
    passwordHash,
    role: "owner",
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
