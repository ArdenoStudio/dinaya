import { createHmac, randomBytes } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";

export function createGoogleOAuthState(businessId: string): string {
  const nonce = randomBytes(12).toString("base64url");
  const payload = `${businessId}.${nonce}`;
  const sig = createHmac("sha256", getAppSecret("Google OAuth state")).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGoogleOAuthState(state: string): string | null {
  const [businessId, nonce, sig] = state.split(".");
  if (!businessId || !nonce || !sig) return null;
  const payload = `${businessId}.${nonce}`;
  const expected = createHmac("sha256", getAppSecret("Google OAuth state")).update(payload).digest("base64url");
  if (expected !== sig) return null;
  return businessId;
}
