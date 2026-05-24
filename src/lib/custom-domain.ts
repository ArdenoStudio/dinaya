import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const slugCache = new Map<string, { slug: string | null; expiresAt: number }>();
const POSITIVE_CACHE_MS = 5 * 60 * 1000;
const NEGATIVE_CACHE_MS = 60 * 1000;
let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSqlClient(): NeonQueryFunction<false, false> {
  sqlClient ??= neon(process.env.DATABASE_URL!);
  return sqlClient;
}

export async function lookupCustomDomainSlug(host: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;

  const normalized = host.toLowerCase().split(":")[0];
  const cached = slugCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.slug;
  }

  try {
    const sql = getSqlClient();
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
      slugCache.set(normalized, { slug, expiresAt: Date.now() + POSITIVE_CACHE_MS });
      return slug;
    }
    slugCache.set(normalized, { slug: null, expiresAt: Date.now() + NEGATIVE_CACHE_MS });
  } catch (error) {
    console.error("[custom-domain] lookup failed", error);
  }

  return null;
}
