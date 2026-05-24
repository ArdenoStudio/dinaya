import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type WebhookAddress = {
  address: string;
  family: 4 | 6;
};

export type WebhookLookup = (hostname: string) => Promise<WebhookAddress[]>;

function ipv4ToNumber(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    result = (result << 8) + octet;
  }

  return result >>> 0;
}

function inRange(value: number, start: string, end: string): boolean {
  const startValue = ipv4ToNumber(start);
  const endValue = ipv4ToNumber(end);
  return startValue !== null && endValue !== null && value >= startValue && value <= endValue;
}

function isUnsafeIpv4(hostname: string): boolean {
  const value = ipv4ToNumber(hostname);
  if (value === null) return false;

  return (
    inRange(value, "0.0.0.0", "0.255.255.255") ||
    inRange(value, "10.0.0.0", "10.255.255.255") ||
    inRange(value, "100.64.0.0", "100.127.255.255") ||
    inRange(value, "127.0.0.0", "127.255.255.255") ||
    inRange(value, "169.254.0.0", "169.254.255.255") ||
    inRange(value, "172.16.0.0", "172.31.255.255") ||
    inRange(value, "192.0.0.0", "192.0.0.255") ||
    inRange(value, "192.168.0.0", "192.168.255.255") ||
    inRange(value, "198.18.0.0", "198.19.255.255") ||
    inRange(value, "224.0.0.0", "255.255.255.255")
  );
}

function isUnsafeIpv6(hostname: string): boolean {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!value.includes(":")) return false;

  if (value.startsWith("::ffff:")) {
    const embeddedIpv4 = value.slice("::ffff:".length);
    return isUnsafeIpv4(embeddedIpv4);
  }

  return (
    value === "::" ||
    value === "::1" ||
    value === "0:0:0:0:0:0:0:1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("ff")
  );
}

export function isSafeResolvedWebhookAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, "");
  const family = isIP(normalized);
  if (family === 4) return !isUnsafeIpv4(normalized);
  if (family === 6) return !isUnsafeIpv6(normalized);
  return false;
}

export function isSafeWebhookUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    return (
      parsed.protocol === "https:" &&
      hostname !== "localhost" &&
      !hostname.endsWith(".local") &&
      !isUnsafeIpv4(hostname) &&
      !isUnsafeIpv6(hostname)
    );
  } catch {
    return false;
  }
}

async function lookupWebhookHostname(hostname: string): Promise<WebhookAddress[]> {
  const rows = await lookup(hostname, { all: true, verbatim: true });
  return rows.map((row) => ({
    address: row.address,
    family: row.family as 4 | 6,
  }));
}

export async function isSafeWebhookDestination(
  value: string,
  resolver: WebhookLookup = lookupWebhookHostname,
): Promise<boolean> {
  if (!isSafeWebhookUrl(value)) return false;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (isIP(hostname)) return isSafeResolvedWebhookAddress(hostname);

    const addresses = await resolver(hostname);
    return addresses.length > 0 && addresses.every((row) => isSafeResolvedWebhookAddress(row.address));
  } catch {
    return false;
  }
}
