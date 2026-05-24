export type VercelVerificationChallenge = {
  type?: string;
  domain?: string;
  value?: string;
  reason?: string;
};

export type VercelRecommendedCname = {
  rank?: number;
  value: string;
};

export type VercelRecommendedIpv4 = {
  rank?: number;
  value: string[];
};

export type VercelDomainConfig = {
  configuredBy: "CNAME" | "A" | "http" | "dns-01" | null;
  acceptedChallenges?: string[];
  recommendedCNAME?: VercelRecommendedCname[];
  recommendedIPv4?: VercelRecommendedIpv4[];
  misconfigured: boolean;
};

export type VercelProjectDomain = {
  name: string;
  verified: boolean;
  verification?: VercelVerificationChallenge[];
};

export type CustomDomainDnsInstruction = {
  type: "CNAME" | "A";
  host: string;
  value: string;
};

export type CustomDomainSyncResult = {
  configured: boolean;
  active: boolean;
  status: "pending_vercel" | "active" | "error";
  projectDomain: VercelProjectDomain | null;
  config: VercelDomainConfig | null;
  dnsInstructions: CustomDomainDnsInstruction[];
  verification: VercelVerificationChallenge[];
  error: string | null;
};

type VercelRequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

const VERCEL_API_BASE = "https://api.vercel.com";

function vercelToken(): string | null {
  return process.env.VERCEL_TOKEN?.trim() || null;
}

function vercelProjectIdOrName(): string | null {
  return process.env.VERCEL_PROJECT_ID_OR_NAME?.trim() || process.env.VERCEL_PROJECT_ID?.trim() || null;
}

function vercelQuery(): string {
  const params = new URLSearchParams();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const slug = process.env.VERCEL_TEAM_SLUG?.trim();
  if (teamId) params.set("teamId", teamId);
  if (slug) params.set("slug", slug);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function vercelDomainIntegrationConfigured(): boolean {
  return Boolean(vercelToken() && vercelProjectIdOrName());
}

async function vercelRequest<T>(
  path: string,
  options: VercelRequestOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string; data: unknown }> {
  const token = vercelToken();
  if (!token) {
    return { ok: false, status: 0, message: "VERCEL_TOKEN is not configured.", data: null };
  }

  try {
    const res = await fetch(`${VERCEL_API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        typeof data === "object" &&
        data &&
        "error" in data &&
        typeof data.error === "object" &&
        data.error &&
        "message" in data.error
          ? String(data.error.message)
          : `Vercel API returned ${res.status}.`;
      return { ok: false, status: res.status, message, data };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Vercel API request failed.",
      data: null,
    };
  }
}

function projectPath(domain?: string): string | null {
  const idOrName = vercelProjectIdOrName();
  if (!idOrName) return null;
  const base = `/v9/projects/${encodeURIComponent(idOrName)}/domains`;
  return domain ? `${base}/${encodeURIComponent(domain)}` : base;
}

async function addProjectDomain(domain: string): Promise<{ ok: true; data: VercelProjectDomain } | { ok: false; message: string }> {
  const idOrName = vercelProjectIdOrName();
  if (!idOrName) return { ok: false, message: "VERCEL_PROJECT_ID_OR_NAME is not configured." };

  const added = await vercelRequest<VercelProjectDomain>(
    `/v10/projects/${encodeURIComponent(idOrName)}/domains${vercelQuery()}`,
    { method: "POST", body: { name: domain } },
  );
  if (added.ok) return { ok: true, data: added.data };

  const existing = await getProjectDomain(domain);
  if (existing.ok) return existing;

  return { ok: false, message: added.message };
}

async function getProjectDomain(domain: string): Promise<{ ok: true; data: VercelProjectDomain } | { ok: false; message: string }> {
  const path = projectPath(domain);
  if (!path) return { ok: false, message: "VERCEL_PROJECT_ID_OR_NAME is not configured." };
  const result = await vercelRequest<VercelProjectDomain>(`${path}${vercelQuery()}`);
  return result.ok ? { ok: true, data: result.data } : { ok: false, message: result.message };
}

async function verifyProjectDomain(domain: string): Promise<VercelProjectDomain | null> {
  const path = projectPath(domain);
  if (!path) return null;
  const result = await vercelRequest<VercelProjectDomain>(`${path}/verify${vercelQuery()}`, { method: "POST" });
  return result.ok ? result.data : null;
}

async function getDomainConfig(domain: string): Promise<VercelDomainConfig | null> {
  const params = new URLSearchParams();
  const project = vercelProjectIdOrName();
  if (project) params.set("projectIdOrName", project);
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const slug = process.env.VERCEL_TEAM_SLUG?.trim();
  if (teamId) params.set("teamId", teamId);
  if (slug) params.set("slug", slug);

  const result = await vercelRequest<VercelDomainConfig>(
    `/v6/domains/${encodeURIComponent(domain)}/config?${params.toString()}`,
  );
  return result.ok ? result.data : null;
}

export function getDnsInstructions(domain: string, config: VercelDomainConfig | null): CustomDomainDnsInstruction[] {
  if (!config) return [];

  const cname = [...(config.recommendedCNAME ?? [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0];
  if (cname?.value) {
    return [{ type: "CNAME", host: domain, value: cname.value }];
  }

  const ipv4 = [...(config.recommendedIPv4 ?? [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0];
  return (ipv4?.value ?? []).map((value) => ({ type: "A", host: domain, value }));
}

export async function syncVercelDomain(domain: string): Promise<CustomDomainSyncResult> {
  if (!vercelDomainIntegrationConfigured()) {
    return {
      configured: false,
      active: false,
      status: "pending_vercel",
      projectDomain: null,
      config: null,
      dnsInstructions: [],
      verification: [],
      error: "Vercel domain automation is not configured.",
    };
  }

  const added = await addProjectDomain(domain);
  if (!added.ok) {
    return {
      configured: true,
      active: false,
      status: "error",
      projectDomain: null,
      config: null,
      dnsInstructions: [],
      verification: [],
      error: added.message,
    };
  }

  const verified = added.data.verified ? added.data : await verifyProjectDomain(domain);
  const projectDomain = verified ?? added.data;
  const config = await getDomainConfig(domain);
  const active = Boolean(projectDomain.verified && config && !config.misconfigured);

  return {
    configured: true,
    active,
    status: active ? "active" : "pending_vercel",
    projectDomain,
    config,
    dnsInstructions: getDnsInstructions(domain, config),
    verification: projectDomain.verification ?? [],
    error: active ? null : "Domain ownership or DNS is still pending in Vercel.",
  };
}

export async function removeVercelProjectDomain(domain: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!vercelDomainIntegrationConfigured()) return { ok: true };

  const path = projectPath(domain);
  if (!path) return { ok: false, message: "VERCEL_PROJECT_ID_OR_NAME is not configured." };

  const removed = await vercelRequest<unknown>(`${path}${vercelQuery()}`, { method: "DELETE" });
  if (removed.ok || removed.status === 404) return { ok: true };
  return { ok: false, message: removed.message };
}
