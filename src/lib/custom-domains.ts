export function normalizeCustomDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const host = withoutProtocol.split("/")[0]?.split(":")[0] ?? "";
  if (!host || !host.includes(".")) return null;

  return host.startsWith("www.") ? host.slice(4) : host;
}
