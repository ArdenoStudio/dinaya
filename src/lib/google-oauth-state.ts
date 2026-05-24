import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";

const STATE_TTL_MS = 15 * 60 * 1000;

export type GoogleOAuthStatePayload = {
  businessId: string;
  userId: string;
};

function signPayload(payload: string): string {
  return createHmac("sha256", getAppSecret("Google OAuth state")).update(payload).digest("base64url");
}

function verifySignature(payload: string, sig: string): boolean {
  const expected = signPayload(payload);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function createGoogleOAuthState(businessId: string, userId: string): string {
  const nonce = randomBytes(12).toString("base64url");
  const exp = String(Date.now() + STATE_TTL_MS);
  const payload = `${businessId}.${userId}.${exp}.${nonce}`;
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

export function verifyGoogleOAuthState(state: string): GoogleOAuthStatePayload | null {
  const parts = state.split(".");
  if (parts.length !== 5) return null;

  const [businessId, userId, exp, nonce, sig] = parts;
  if (!businessId || !userId || !exp || !nonce || !sig) return null;

  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return null;

  const payload = `${businessId}.${userId}.${exp}.${nonce}`;
  if (!verifySignature(payload, sig)) return null;

  return { businessId, userId };
}
