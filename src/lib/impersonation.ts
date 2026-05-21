import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";

export type ImpersonationPayload = {
  userId: string;
  adminEmail: string;
  exp: number;
};

function secret(): string {
  return getAppSecret("Impersonation token signing");
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

export function createImpersonationToken(input: {
  userId: string;
  adminEmail: string;
  expiresInMinutes?: number;
}): string {
  const payload = encode(
    JSON.stringify({
      userId: input.userId,
      adminEmail: input.adminEmail,
      exp: Date.now() + (input.expiresInMinutes ?? 15) * 60 * 1000,
    } satisfies ImpersonationPayload),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyImpersonationToken(token: string): ImpersonationPayload | null {
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
    const parsed = JSON.parse(decode(payload)) as ImpersonationPayload;
    if (!parsed.userId || !parsed.adminEmail) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildImpersonationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/auth/impersonate?token=${encodeURIComponent(token)}`;
}
