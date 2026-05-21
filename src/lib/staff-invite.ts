import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";

type StaffInvitePayload = {
  businessId: string;
  businessName: string;
  email: string;
  name: string;
  staffId: string;
  exp: number;
};

function secret(): string {
  return getAppSecret("Staff invite token signing");
}

function encode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createStaffInviteToken(input: {
  businessId: string;
  businessName: string;
  email: string;
  name: string;
  staffId: string;
  expiresInDays?: number;
}): string {
  const payload = encode(
    JSON.stringify({
      businessId: input.businessId,
      businessName: input.businessName,
      email: input.email.toLowerCase(),
      name: input.name,
      staffId: input.staffId,
      exp: Date.now() + (input.expiresInDays ?? 7) * 24 * 60 * 60 * 1000,
    } satisfies StaffInvitePayload),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffInviteToken(token: string): StaffInvitePayload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decode(payload)) as StaffInvitePayload;
    if (!parsed.businessId || !parsed.email || !parsed.staffId || !parsed.name) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildStaffInviteUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/accept-invite?token=${encodeURIComponent(token)}`;
}
