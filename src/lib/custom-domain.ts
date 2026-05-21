import { neon } from "@neondatabase/serverless";

const slugCache = new Map<string, { slug: string; expiresAt: number }>();

export async function lookupCustomDomainSlug(host: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;

  const normalized = host.toLowerCase().split(":")[0];
  const cached = slugCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.slug;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT slug FROM businesses
      WHERE lower(custom_domain) = ${normalized}
        AND custom_domain_verified = true
        AND deleted_at IS NULL
        AND is_suspended = false
      LIMIT 1
    `;
    const slug = rows[0]?.slug as string | undefined;
    if (slug) {
      slugCache.set(normalized, { slug, expiresAt: Date.now() + 5 * 60 * 1000 });
      return slug;
    }
  } catch (error) {
    console.error("[custom-domain] lookup failed", error);
  }

  return null;
}
