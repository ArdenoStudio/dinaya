import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isPlatformAdmin as isPlatformAdminAsync } from "@/lib/platform-admin-members";

export type PlatformAdminContext = {
  email: string;
  userId: string;
  name?: string | null;
};

/** @deprecated Use async isPlatformAdmin from platform-admin-members */
export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false;
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function getPlatformAdminContext(): Promise<PlatformAdminContext | null> {
  const session = await auth();
  const email = session?.user?.email;
  const userId = session?.user?.id;
  if (!email || !userId) return null;
  if (!(await isPlatformAdminAsync(email))) return null;
  return { email, userId, name: session.user.name };
}

export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const ctx = await getPlatformAdminContext();
  if (!ctx) {
    redirect("/auth/signin?callbackUrl=/admin");
  }
  return ctx;
}
