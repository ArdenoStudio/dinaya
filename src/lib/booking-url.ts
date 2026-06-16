export type PublicBookingUrlInput = {
  slug: string;
  customDomain?: string | null;
  customDomainVerified?: boolean | null;
};

export function getAppDomain(): string {
  return process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildPublicBookingUrl(input: PublicBookingUrlInput): string {
  const domain = input.customDomain?.trim().toLowerCase();
  if (domain && input.customDomainVerified) {
    return `https://${domain}`;
  }

  const appDomain = getAppDomain();
  const appUrl = getAppBaseUrl().replace(/\/$/, "");

  if (appDomain === "dinaya.lk") {
    return `https://${input.slug}.dinaya.lk`;
  }

  return `${appUrl}/book/${input.slug}`;
}

export function buildServiceBookingPath(slug: string, serviceSlug: string): string {
  return `/book/${slug}/${serviceSlug}`;
}

export function buildServiceBookingUrl(
  input: PublicBookingUrlInput,
  serviceSlug: string,
): string {
  const base = buildPublicBookingUrl(input).replace(/\/$/, "");
  const path = buildServiceBookingPath(input.slug, serviceSlug);

  if (base.includes("/book/")) {
    return `${base.split("/book/")[0]}${path}`;
  }

  // Subdomain/custom domain: append path only
  return `${base}${path}`;
}

export function buildPublicBookingUrlLabel(input: PublicBookingUrlInput): string {
  const url = buildPublicBookingUrl(input);
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function expectedCustomDomainTarget(slug: string): string {
  const appDomain = getAppDomain().split(":")[0];
  return `${slug}.${appDomain}`;
}
