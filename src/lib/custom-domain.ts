import { getSupabaseServerClient } from "@/lib/supabase-server";

const slugCache = new Map<string, { slug: string | null; expiresAt: number }>();
const POSITIVE_CACHE_MS = 5 * 60 * 1000;
const NEGATIVE_CACHE_MS = 60 * 1000;

export async function lookupCustomDomainSlug(host: string): Promise<string | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  const normalized = host.toLowerCase().split(":")[0];
  const cached = slugCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.slug;
  }

  try {
    const { data, error } = await client
      .from("businesses")
      .select("slug")
      .ilike("custom_domain", normalized)
      .eq("custom_domain_verified", true)
      .is("deleted_at", null)
      .eq("is_suspended", false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[custom-domain] lookup failed", error);
    }

    const slug = data?.slug as string | undefined;
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
