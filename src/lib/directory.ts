export const DIRECTORY_CITIES = [
  "Colombo",
  "Dehiwala",
  "Nugegoda",
  "Maharagama",
  "Kandy",
  "Galle",
  "Negombo",
  "Jaffna",
  "Battaramulla",
  "Moratuwa",
] as const;

export const DIRECTORY_CATEGORIES = [
  { value: "salon", label: "Salon & beauty" },
  { value: "clinic", label: "Clinic & healthcare" },
  { value: "tutoring", label: "Tuition & classes" },
  { value: "fitness", label: "Fitness & wellness" },
  { value: "consulting", label: "Freelancers & consulting" },
  { value: "other", label: "Other services" },
] as const;

export type DirectoryCategory = (typeof DIRECTORY_CATEGORIES)[number]["value"];

export function cityToSlug(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

export function slugToCity(slug: string): string | null {
  const match = DIRECTORY_CITIES.find((city) => cityToSlug(city) === slug.toLowerCase());
  return match ?? null;
}

export function categoryLabel(value: string | null | undefined): string {
  return DIRECTORY_CATEGORIES.find((item) => item.value === value)?.label ?? "Services";
}

export function inferDirectoryCategory(businessType: string | null | undefined): DirectoryCategory {
  if (!businessType) return "other";
  if (["salon", "spa", "beauty", "salon_barber"].includes(businessType)) return "salon";
  if (["clinic", "healthcare", "dental"].includes(businessType)) return "clinic";
  if (["tutoring", "education", "tuition"].includes(businessType)) return "tutoring";
  if (["fitness", "gym", "sports", "spa_wellness"].includes(businessType)) return "fitness";
  if (["consulting", "freelance", "photography", "vehicle_service"].includes(businessType)) return "consulting";
  return "other";
}

export function isValidDirectoryCategory(value: string | null | undefined): value is DirectoryCategory {
  return DIRECTORY_CATEGORIES.some((item) => item.value === value);
}

export type DirectoryListing = {
  name: string;
  slug: string;
  description: string | null;
  directoryCity: string | null;
  directoryCategory: string | null;
  logoUrl: string | null;
};

export async function listDirectoryBusinesses(filters?: {
  city?: string;
  category?: DirectoryCategory;
}): Promise<DirectoryListing[]> {
  const { db } = await import("@/db");
  const { businesses } = await import("@/db/schema");
  const { and, eq, isNull } = await import("drizzle-orm");

  return db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      directoryCity: businesses.directoryCity,
      directoryCategory: businesses.directoryCategory,
      logoUrl: businesses.logoUrl,
    })
    .from(businesses)
    .where(and(
      eq(businesses.directoryListed, true),
      eq(businesses.isSuspended, false),
      isNull(businesses.deletedAt),
      ...(filters?.city ? [eq(businesses.directoryCity, filters.city)] : []),
      ...(filters?.category ? [eq(businesses.directoryCategory, filters.category)] : []),
    ))
    .orderBy(businesses.name);
}

export function buildDirectoryBookingUrl(slug: string): string {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const base = appDomain === "dinaya.lk"
    ? `https://${slug}.dinaya.lk`
    : `${appUrl}/book/${slug}`;
  const params = new URLSearchParams({
    channel: "directory",
    utm_source: "discover",
    utm_medium: "directory",
  });
  return `${base}?${params.toString()}`;
}

export function discoverFilterHref(opts: { city?: string; category?: DirectoryCategory | null }): string {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.city) {
    return params.size > 0
      ? `/discover/${cityToSlug(opts.city)}?${params.toString()}`
      : `/discover/${cityToSlug(opts.city)}`;
  }
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}
