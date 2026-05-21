import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";

type ClientTokenPayload = {
  bookingId: string;
  clientPhone: string;
  exp: number;
};

function secret(): string {
  return getAppSecret("Client booking token signing");
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

export function createClientBookingToken(input: {
  bookingId: string;
  clientPhone: string;
  expiresInDays?: number;
}): string {
  const expiresInDays = input.expiresInDays ?? 90;
  const payload = encode(JSON.stringify({
    bookingId: input.bookingId,
    clientPhone: input.clientPhone,
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  } satisfies ClientTokenPayload));
  return `${payload}.${sign(payload)}`;
}

export function verifyClientBookingToken(token: string): ClientTokenPayload | null {
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
    const parsed = JSON.parse(decode(payload)) as ClientTokenPayload;
    if (!parsed.bookingId || !parsed.clientPhone) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildClientBookingUrl(input: {
  bookingId: string;
  clientPhone: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = createClientBookingToken(input);
  return `${baseUrl.replace(/\/$/, "")}/client/${token}`;
}
