#!/usr/bin/env node
/**
 * Generates baseline route.test.ts files for API routes missing coverage.
 * Run: node scripts/generate-route-tests.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, "src/app/api");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
  return acc;
}

function routeUrl(routePath) {
  const rel = path.relative(path.join(ROOT, "src/app"), routePath).replace(/\\/g, "/");
  return "/" + rel.replace("/route.ts", "");
}

function hasDynamicSegments(url) {
  return /\[[^\]]+\]/.test(url);
}

function dynamicParams(url) {
  const params = {};
  for (const match of url.matchAll(/\[(\.\.\.)?([^\]]+)\]/g)) {
    const key = match[2];
    params[key] = key === "size" ? "192" : key === "slug" ? "test-slug" : key === "token" ? "test-token" : `test-${key}`;
  }
  return params;
}

function detectExports(source) {
  const methods = [];
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    if (new RegExp(`export async function ${m}\\b`).test(source)) methods.push(m);
  }
  return methods;
}

function classify(url, source) {
  if (url.startsWith("/api/cron/")) return "cron";
  if (url.startsWith("/api/webhooks/")) return "webhook";
  if (url.startsWith("/api/auth/")) return "auth";
  if (url.startsWith("/api/dashboard/")) return "dashboard";
  if (url.startsWith("/api/v1/desktop/")) return "desktop";
  if (url.startsWith("/api/v1/")) return "v1";
  if (url.startsWith("/api/health")) return "health";
  if (source.includes("requireApiBusiness")) return "dashboard";
  if (source.includes("requireApiKey")) return "v1";
  if (source.includes("withRateLimit")) return "public";
  return "public";
}

function cronLibImport(source) {
  const m = source.match(/import\s+\{([^}]+)\}\s+from\s+["'](@\/lib\/[^"']+)["']/);
  if (!m) return null;
  const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  const fn = names.find((n) => /^[a-z]/.test(n)) ?? names[0];
  return { fn, module: m[2] };
}

function desktopAuthFns(source) {
  const fns = [];
  if (source.includes("requireDesktopRead")) fns.push("requireDesktopRead");
  if (source.includes("requireDesktopWrite")) fns.push("requireDesktopWrite");
  if (source.includes("requireDesktopBookings")) fns.push("requireDesktopBookings");
  return fns.length ? fns : ["requireDesktopRead"];
}

function usesRateLimit(source) {
  return source.includes("withRateLimit");
}

function usesDb(source) {
  return source.includes('from "@/db"') || source.includes("from '@/db'");
}

function usesRequirePro(source) {
  return source.includes("requirePro");
}

function paramArg(url) {
  if (!hasDynamicSegments(url)) return "";
  const params = dynamicParams(url);
  return `, { params: Promise.resolve(${JSON.stringify(params)}) }`;
}

function methodCall(method, url) {
  return `${method}(req${paramArg(url)})`;
}

function generateCronTest(url, source, methods) {
  const lib = cronLibImport(source);
  const fn = lib?.fn ?? "handler";
  const mod = lib?.module ?? "@/lib/cron";
  const fnMock = `${fn}Mock`;

  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const ${fnMock} = vi.hoisted(() => vi.fn());

vi.mock("${mod}", () => ({
  ${fn}: ${fnMock},
}));

import { ${methods.join(", ")} } from "./route";

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    ${fnMock}.mockResolvedValue({ ok: true });
  });

  it("returns 401 without bearer token", async () => {
    const req = new NextRequest("http://localhost${url}");
    const res = await ${methodCall(methods[0], url)};
    expect(res.status).toBe(401);
    expect(${fnMock}).not.toHaveBeenCalled();
  });

  it("runs when authorized", async () => {
    const req = new NextRequest("http://localhost${url}", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await ${methodCall(methods[0], url)};
    expect(res.status).toBe(200);
    expect(${fnMock}).toHaveBeenCalled();
  });

  it("returns 500 when handler throws", async () => {
    ${fnMock}.mockRejectedValue(new Error("cron failed"));
    const req = new NextRequest("http://localhost${url}", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await ${methodCall(methods[0], url)};
    expect(res.status).toBe(500);
  });
});
`;
}

function generateDashboardTest(url, source, methods) {
  const rateLimit = usesRateLimit(source);
  const db = usesDb(source);
  const requirePro = usesRequirePro(source);

  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery, makeInsertQuery, makeUpdateQuery, makeDeleteQuery } from "@/test-utils/db-mock";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
${rateLimit ? "const withRateLimitMock = vi.hoisted(() => vi.fn());" : ""}
${db ? `const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const dbDeleteMock = vi.hoisted(() => vi.fn());` : ""}
${requirePro ? `const requireProMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});` : ""}

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));
${rateLimit ? `vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));` : ""}
${db ? `vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    insert: dbInsertMock,
    update: dbUpdateMock,
    delete: dbDeleteMock,
  },
}));` : ""}

import { ${methods.join(", ")} } from "./route";

const authOk = { ok: true, context: { businessId: "biz_1", userId: "user_1", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    ${rateLimit ? "withRateLimitMock.mockResolvedValue({ ok: true });" : ""}
    ${requirePro ? "requireProMock.mockResolvedValue(undefined);" : ""}
    ${db ? `dbSelectMock.mockReturnValue(makeSelectQuery([]));
    dbInsertMock.mockReturnValue(makeInsertQuery([{ id: "row_1" }]));
    dbUpdateMock.mockReturnValue(makeUpdateQuery([{ id: "row_1" }]));
    dbDeleteMock.mockReturnValue(makeDeleteQuery());` : ""}
  });

${methods.map((method) => `  describe("${method}", () => {
    it("returns 401 when auth fails", async () => {
      requireApiBusinessMock.mockResolvedValue(authFail);
      const req = new NextRequest("http://localhost${url}"${method !== "GET" && method !== "DELETE" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : method !== "GET" ? `, { method: "${method}" }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost${url}"${method !== "GET" && method !== "DELETE" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : method !== "GET" ? `, { method: "${method}" }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });`).join("\n\n")}
});
`;
}

function generateDesktopTest(url, source, methods) {
  const authFns = desktopAuthFns(source);
  const rateLimit = usesRateLimit(source);
  const db = usesDb(source);

  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

${authFns.map((fn) => `const ${fn}Mock = vi.hoisted(() => vi.fn());`).join("\n")}
${rateLimit ? "const withRateLimitMock = vi.hoisted(() => vi.fn());" : ""}
${db ? "const dbSelectMock = vi.hoisted(() => vi.fn());" : ""}

vi.mock("@/app/api/v1/desktop/_shared", () => ({
${authFns.map((fn) => `  ${fn}: ${fn}Mock,`).join("\n")}
}));
${rateLimit ? `vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));` : ""}
${db ? `vi.mock("@/db", () => ({ db: { select: dbSelectMock } }));` : ""}

import { ${methods.join(", ")} } from "./route";

const desktopAuthOk = { ok: true, context: { businessId: "biz_1", deviceId: "device_1", keyId: "key_1", keyType: "desktop" } };
const desktopAuthFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ${authFns.map((fn) => `${fn}Mock.mockResolvedValue(desktopAuthOk);`).join("\n    ")}
    ${rateLimit ? "withRateLimitMock.mockResolvedValue({ ok: true });" : ""}
    ${db ? `dbSelectMock.mockReturnValue(makeSelectQuery([{ id: "biz_1", name: "Test Biz", slug: "test", timezone: "Asia/Colombo", plan: "pro" }]));` : ""}
  });

${methods.map((method) => {
  const readFn = authFns.includes("requireDesktopRead") ? "requireDesktopReadMock" : authFns[0] + "Mock";
  const writeFn = authFns.includes("requireDesktopWrite") ? "requireDesktopWriteMock" : authFns.includes("requireDesktopBookings") ? "requireDesktopBookingsMock" : readFn;
  const authMock = ["POST", "PUT", "PATCH", "DELETE"].includes(method) ? writeFn : readFn;
  return `  describe("${method}", () => {
    it("returns 401 when desktop auth fails", async () => {
      ${authMock}.mockResolvedValue(desktopAuthFail);
      const req = new NextRequest("http://localhost${url}"${method !== "GET" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost${url}"${method !== "GET" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });`;
}).join("\n\n")}
});
`;
}

function generateV1Test(url, source, methods) {
  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiKeyMock = vi.hoisted(() => vi.fn());
const hasApiKeyAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-key-auth", () => ({
  requireApiKey: requireApiKeyMock,
  hasApiKeyAuth: hasApiKeyAuthMock,
}));

import { ${methods.join(", ")} } from "./route";

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasApiKeyAuthMock.mockReturnValue(true);
    requireApiKeyMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", scopes: ["bookings:read", "bookings:write", "voice:read"] },
    });
  });

${methods.map((method) => `  describe("${method}", () => {
    it("returns 401 when API key auth fails", async () => {
      requireApiKeyMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const req = new NextRequest("http://localhost${url}"${method !== "GET" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost${url}"${method !== "GET" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });`).join("\n\n")}
});
`;
}

function generateHealthTest(url, methods) {
  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/platform-health", () => ({
  checkDatabaseHealth: vi.fn().mockResolvedValue({ status: "up", latencyMs: 1 }),
  checkEmailHealth: vi.fn().mockResolvedValue({ status: "up", latencyMs: 1 }),
  checkPaymentsHealth: vi.fn().mockResolvedValue({ status: "up", latencyMs: 1 }),
}));

import { ${methods.join(", ")} } from "./route";

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HEALTH_CHECK_SECRET = "health-test-secret";
  });

  it("returns 401 without health secret", async () => {
    const req = new NextRequest("http://localhost${url}");
    const res = await ${methodCall(methods[0], url)};
    expect(res.status).toBe(401);
  });

  it("returns a response when authorized", async () => {
    const req = new NextRequest("http://localhost${url}", {
      headers: { authorization: "Bearer health-test-secret" },
    });
    const res = await ${methodCall(methods[0], url)};
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(600);
  });
});
`;
}

function generateWebhookTest(url, methods) {
  if (url.includes("whatsapp")) {
    return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/messaging/inbound-router", () => ({
  handleInboundWhatsApp: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/after-response", () => ({ runAfterResponse: vi.fn() }));

import { ${methods.join(", ")} } from "./route";

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_WHATSAPP_VERIFY_TOKEN = "verify-token";
    process.env.META_WHATSAPP_APP_SECRET = "app-secret";
  });

  it("rejects webhook verification without token", async () => {
    const req = new NextRequest("http://localhost${url}?hub.mode=subscribe&hub.verify_token=bad");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("accepts webhook verification challenge", async () => {
    const req = new NextRequest("http://localhost${url}?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=12345");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("12345");
  });

  it("rejects POST without valid signature", async () => {
    const req = new NextRequest("http://localhost${url}", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
`;
  }
  return generatePublicTest(url, "", methods);
}

function generateAuthTest(url, _source, methods) {
  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const withRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));

import { ${methods.join(", ")} } from "./route";

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
  });

  it("returns 429 when rate limited", async () => {
    withRateLimitMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Too many requests" }, { status: 429 }),
    });
    const req = new NextRequest("http://localhost${url}", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req${paramArg(url).replace(/^, /, "")});
    expect(res.status).toBe(429);
  });

  it("returns a response when not rate limited", async () => {
    const req = new NextRequest("http://localhost${url}", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req${paramArg(url).replace(/^, /, "")});
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(600);
  });
});
`;
}

function generatePublicTest(url, source, methods) {
  const rateLimit = usesRateLimit(source);
  const db = usesDb(source);

  return `import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

${rateLimit ? "const withRateLimitMock = vi.hoisted(() => vi.fn());" : ""}
${db ? "const dbSelectMock = vi.hoisted(() => vi.fn());" : ""}

${rateLimit ? `vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));` : ""}
${db ? `vi.mock("@/db", () => ({ db: { select: dbSelectMock } }));` : ""}

import { ${methods.join(", ")} } from "./route";

describe("${methods.join(", ")} ${url}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ${rateLimit ? "withRateLimitMock.mockResolvedValue({ ok: true });" : ""}
    ${db ? "dbSelectMock.mockReturnValue(makeSelectQuery([]));" : ""}
  });

${methods.map((method) => `  describe("${method}", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost${url}"${method !== "GET" ? `, { method: "${method}", body: "{}", headers: { "content-type": "application/json" } }` : ""});
      const res = await ${method}(req${paramArg(url).replace(/^, /, "")});
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });`).join("\n\n")}
});
`;
}

function generateTest(routePath, source) {
  const url = routeUrl(routePath);
  const methods = detectExports(source);
  if (!methods.length) return null;

  const kind = classify(url, source);
  switch (kind) {
    case "cron":
      return generateCronTest(url, source, methods);
    case "dashboard":
      return generateDashboardTest(url, source, methods);
    case "desktop":
      return generateDesktopTest(url, source, methods);
    case "v1":
      return generateV1Test(url, source, methods);
    case "health":
      return generateHealthTest(url, methods);
    case "webhook":
      return generateWebhookTest(url, methods);
    case "auth":
      return generateAuthTest(url, source, methods);
    default:
      return generatePublicTest(url, source, methods);
  }
}

const routes = walk(API_ROOT);
let created = 0;
let skipped = 0;

for (const routePath of routes) {
  const testPath = routePath.replace(/route\.ts$/, "route.test.ts");
  if (fs.existsSync(testPath)) {
    skipped++;
    continue;
  }

  const source = fs.readFileSync(routePath, "utf8");
  const content = generateTest(routePath, source);
  if (!content) {
    console.warn("skip (no exports):", routePath);
    continue;
  }

  fs.writeFileSync(testPath, content);
  created++;
  console.log("created:", path.relative(ROOT, testPath));
}

console.log(`\nDone. created=${created} skipped=${skipped}`);
