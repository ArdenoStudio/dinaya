import { createHmac, timingSafeEqual } from "node:crypto";

type ReviewTokenPayload = {
  bookingId: string;
  businessSlug: string;
  clientName: string;
  exp: number;
};

function secret(): string {
  return process.env.AUTH_SECRET || process.env.SECRET_ENCRYPTION_KEY || "dinaya-dev-review-secret";
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

export function createReviewToken(input: {
  bookingId: string;
  businessSlug: string;
  clientName: string;
  expiresInDays?: number;
}): string {
  const expiresInDays = input.expiresInDays ?? 30;
  const payload = encode(JSON.stringify({
    bookingId: input.bookingId,
    businessSlug: input.businessSlug,
    clientName: input.clientName,
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  } satisfies ReviewTokenPayload));
  return `${payload}.${sign(payload)}`;
}

export function verifyReviewToken(token: string): ReviewTokenPayload | null {
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
    const parsed = JSON.parse(decode(payload)) as ReviewTokenPayload;
    if (!parsed.bookingId || !parsed.businessSlug || !parsed.clientName) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildReviewUrl(input: {
  bookingId: string;
  businessSlug: string;
  clientName: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = createReviewToken(input);
  return `${baseUrl.replace(/\/$/, "")}/reviews/${token}`;
}
