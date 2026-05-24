import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";

type PasswordResetPayload = {
  userId: string;
  email: string;
  exp: number;
  passwordVersion: string;
};

function secret(): string {
  return getAppSecret("Password reset token signing");
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

function passwordVersionForHash(passwordHash: string): string {
  return createHmac("sha256", secret())
    .update(`password-version:${passwordHash}`)
    .digest("base64url");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function createPasswordResetToken(input: {
  userId: string;
  email: string;
  passwordHash: string;
  expiresInHours?: number;
}): string {
  const expiresInHours = input.expiresInHours ?? 1;
  const payload = encode(
    JSON.stringify({
      userId: input.userId,
      email: input.email,
      exp: Date.now() + expiresInHours * 60 * 60 * 1000,
      passwordVersion: passwordVersionForHash(input.passwordHash),
    } satisfies PasswordResetPayload)
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (!timingSafeStringEqual(signature, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decode(payload)) as PasswordResetPayload;
    if (!parsed.userId || !parsed.email || !parsed.passwordVersion) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPasswordResetTokenCurrent(
  payload: PasswordResetPayload | null,
  passwordHash: string,
): boolean {
  if (!payload) return false;
  return timingSafeStringEqual(payload.passwordVersion, passwordVersionForHash(passwordHash));
}

export function buildPasswordResetUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}
