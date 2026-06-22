export const SERVICE_SEARCH_THRESHOLD = 8;
export const HUB_STICKY_CTA_MAX_SERVICES = 5;

export type ServiceFilterable = {
  name: string;
  description?: string | null;
  categoryName?: string | null;
};

export function filterServices<T extends ServiceFilterable>(
  services: T[],
  query: string,
  category: string | null,
): T[] {
  const q = query.trim().toLowerCase();
  return services.filter((service) => {
    if (category && service.categoryName !== category) return false;
    if (!q) return true;
    const haystack = `${service.name} ${service.description ?? ""} ${service.categoryName ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function uniqueServiceCategories(services: ServiceFilterable[]): string[] {
  const categories = new Set<string>();
  for (const service of services) {
    const name = service.categoryName?.trim();
    if (name) categories.add(name);
  }
  return [...categories].sort((a, b) => a.localeCompare(b));
}

export function shouldShowServiceSearch(count: number): boolean {
  return count >= SERVICE_SEARCH_THRESHOLD;
}
