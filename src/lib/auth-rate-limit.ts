import type { RateLimitConfig } from "@/lib/rate-limit";

export const CREDENTIALS_IP_LIMIT: RateLimitConfig = {
  scope: "auth-credentials-ip",
  limit: 30,
  windowSeconds: 300,
};

export const CREDENTIALS_EMAIL_LIMIT: RateLimitConfig = {
  scope: "auth-credentials-email",
  limit: 10,
  windowSeconds: 15 * 60,
};

export function isCredentialsCallbackPath(pathname: string): boolean {
  return pathname.endsWith("/callback/credentials");
}

export function normalizeCredentialsEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function getCredentialsEmailFromRequest(req: Request): Promise<string | null> {
  try {
    const formData = await req.clone().formData();
    return normalizeCredentialsEmail(formData.get("email"));
  } catch {
    return null;
  }
}
