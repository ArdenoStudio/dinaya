import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { expectedCustomDomainTarget } from "@/lib/booking-url";

export function normalizeCustomDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const host = withoutProtocol.split("/")[0]?.split(":")[0] ?? "";
  if (!host || !host.includes(".")) return null;

  return host.startsWith("www.") ? host.slice(4) : host;
}

type DnsAnswer = {
  data?: string;
};

type DnsResponse = {
  Answer?: DnsAnswer[];
};

async function resolveDns(name: string, type: "CNAME" | "TXT"): Promise<string[]> {
  const response = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    { next: { revalidate: 0 } },
  );

  if (!response.ok) return [];

  const data = await response.json() as DnsResponse;
  return (data.Answer ?? [])
    .map((entry) => entry.data?.replace(/\.$/, "").trim().toLowerCase())
    .filter(Boolean) as string[];
}

export async function verifyCustomDomainDns(domain: string, slug: string): Promise<{
  ok: boolean;
  expectedTarget: string;
  records: string[];
}> {
  const normalized = normalizeCustomDomain(domain);
  if (!normalized) {
    return { ok: false, expectedTarget: expectedCustomDomainTarget(slug), records: [] };
  }

  const expectedTarget = expectedCustomDomainTarget(slug).toLowerCase();
  const cnameRecords = await resolveDns(normalized, "CNAME");
  const txtRecords = await resolveDns(normalized, "TXT");
  const verificationToken = `dinaya-verify=${slug}`;

  const cnameMatch = cnameRecords.some(
    (record) => record === expectedTarget || record.endsWith(`.${expectedTarget}`),
  );
  const txtMatch = txtRecords.some((record) => record.includes(verificationToken));

  return {
    ok: cnameMatch || txtMatch,
    expectedTarget,
    records: [...cnameRecords, ...txtRecords],
  };
}

export async function resolveSlugFromCustomDomain(hostname: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;

  const domain = normalizeCustomDomain(hostname);
  if (!domain) return null;

  try {
    const [business] = await db
      .select({ slug: businesses.slug })
      .from(businesses)
      .where(and(
        eq(businesses.customDomain, domain),
        isNotNull(businesses.customDomainVerifiedAt),
        eq(businesses.isSuspended, false),
        isNull(businesses.deletedAt),
      ))
      .limit(1);

    return business?.slug ?? null;
  } catch {
    return null;
  }
}
