import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, businesses, users } from "@/db/schema";
import { generateApiKey } from "@/lib/api-keys";
import { desktopNativeBookingsEnabled } from "@/lib/desktop-native";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
  deviceName: z.string().trim().min(1).max(120).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "desktop-auth-login",
    limit: 20,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your login details." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      timezone: businesses.timezone,
      plan: businesses.plan,
      customDomain: businesses.customDomain,
      deletedAt: businesses.deletedAt,
      isSuspended: businesses.isSuspended,
    })
    .from(businesses)
    .where(eq(businesses.id, user.businessId))
    .limit(1);

  if (!business || business.isSuspended || business.deletedAt) {
    return NextResponse.json({ error: "This business account is not active." }, { status: 403 });
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const deviceId = randomUUID();
  const deviceName = parsed.data.deviceName ?? "Dinaya Desktop";
  const { rawKey, keyHash } = generateApiKey();
  const [createdKey] = await db
    .insert(apiKeys)
    .values({
      businessId: business.id,
      deviceId,
      deviceName,
      keyHash,
      keyType: "desktop",
      name: `Desktop - ${deviceName}`,
      scopes: ["desktop:read", "desktop:bookings", "desktop:write"],
    })
    .returning({ id: apiKeys.id });

  return NextResponse.json({
    desktopKey: rawKey,
    auth: {
      keyId: createdKey.id,
      keyType: "desktop",
      deviceId,
      deviceName,
    },
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      timezone: business.timezone,
      plan: business.plan,
      customDomain: business.customDomain,
    },
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    featureFlags: {
      desktopNativeBookings: desktopNativeBookingsEnabled(business.id),
    },
  });
}
