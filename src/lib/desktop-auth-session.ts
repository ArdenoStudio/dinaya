import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, businesses, users } from "@/db/schema";
import { generateApiKey } from "@/lib/api-keys";
import { desktopNativeBookingsEnabled } from "@/lib/desktop-native";

export type DesktopAuthSession = {
  desktopKey: string;
  auth: {
    deviceId: string;
    deviceName: string;
    keyId: string;
    keyType: "desktop";
  };
  business: {
    customDomain: string | null;
    id: string;
    name: string;
    plan: string;
    slug: string;
    timezone: string;
  };
  featureFlags: {
    desktopNativeBookings: boolean;
  };
  user: {
    email: string;
    id: string;
    name: string;
    role: string;
  };
};

export class DesktopAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DesktopAuthError";
    this.status = status;
  }
}

export async function createDesktopAuthSession(input: {
  deviceName: string;
  email: string;
  password: string;
}): Promise<DesktopAuthSession> {
  const email = input.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new DesktopAuthError("Invalid email or password.", 401);
  }

  const [business] = await db
    .select({
      customDomain: businesses.customDomain,
      deletedAt: businesses.deletedAt,
      id: businesses.id,
      isSuspended: businesses.isSuspended,
      name: businesses.name,
      plan: businesses.plan,
      slug: businesses.slug,
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, user.businessId))
    .limit(1);

  if (!business || business.isSuspended || business.deletedAt) {
    throw new DesktopAuthError("This business account is not active.", 403);
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new DesktopAuthError("Invalid email or password.", 401);
  }

  const deviceId = randomUUID();
  const deviceName = input.deviceName.trim() || "Dinaya Desktop";
  const { keyHash, rawKey } = generateApiKey();
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

  return {
    auth: {
      deviceId,
      deviceName,
      keyId: createdKey.id,
      keyType: "desktop",
    },
    business: {
      customDomain: business.customDomain,
      id: business.id,
      name: business.name,
      plan: business.plan,
      slug: business.slug,
      timezone: business.timezone,
    },
    desktopKey: rawKey,
    featureFlags: {
      desktopNativeBookings: desktopNativeBookingsEnabled(business.id),
    },
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    },
  };
}
