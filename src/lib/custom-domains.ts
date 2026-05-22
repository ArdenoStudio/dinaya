export function normalizeCustomDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const host = withoutProtocol.split("/")[0]?.split(":")[0] ?? "";
  if (!host || !host.includes(".")) return null;
  if (host.startsWith("*.") || host.includes("*")) return null;
  if (host === "localhost" || host.endsWith(".localhost")) return null;

  const normalized = host.startsWith("www.") ? host.slice(4) : host;
  const labels = normalized.split(".");
  if (labels.length < 2) return null;
  if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return null;
  }
  if (!/^[a-z]{2,63}$/.test(labels[labels.length - 1])) return null;

  return normalized;
}

export function isReservedAppDomain(domain: string): boolean {
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000")
    .toLowerCase()
    .split(":")[0];
  return domain === appDomain || domain.endsWith(`.${appDomain}`);
}
