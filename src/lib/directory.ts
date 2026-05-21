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
  { value: "consulting", label: "Consulting & services" },
  { value: "other", label: "Other services" },
] as const;

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

export function inferDirectoryCategory(businessType: string | null | undefined): string {
  if (!businessType) return "other";
  if (["salon", "spa", "beauty"].includes(businessType)) return "salon";
  if (["clinic", "healthcare", "dental"].includes(businessType)) return "clinic";
  if (["tutoring", "education"].includes(businessType)) return "tutoring";
  if (["fitness", "gym", "sports"].includes(businessType)) return "fitness";
  if (["consulting", "freelance"].includes(businessType)) return "consulting";
  return "other";
}
