#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SRC_ROOT = path.join(REPO_ROOT, "src");
const APP_ROOT = path.join(SRC_ROOT, "app");
const API_ROOT = path.join(APP_ROOT, "api");
const DRIZZLE_ROOT = path.join(REPO_ROOT, "drizzle");

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);

const SEARCHABLE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".env",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".md",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const API_PREFIXES = ["/api/cron", "/api/dashboard", "/api/v1"];
const DOCUMENTED_DUPLICATE_MIGRATION_SEQUENCES = new Map([
  [
    9,
    [
      "drizzle/0009_ai_growth_workflows.sql",
      "drizzle/0009_fix_locations.sql",
    ],
  ],
  [
    26,
    [
      "drizzle/0026_starter_plan.sql",
      "drizzle/0026_subscription_payment_id.sql",
    ],
  ],
]);
const DEFAULT_SCRIPT_ALLOWLIST = new Set([
  "build",
  "db:migrate",
  "lint",
  "test",
  "test:e2e",
  "verify",
]);

function unixPath(value) {
  return value.split(path.sep).join("/");
}

function toRelative(absPath) {
  return unixPath(path.relative(REPO_ROOT, absPath));
}

function ensureInsideRepo(absPath) {
  const rel = path.relative(REPO_ROOT, absPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path resolves outside repository: ${absPath}`);
  }
}

function resolveRepoPath(repoRelativePath) {
  const absPath = path.resolve(REPO_ROOT, repoRelativePath);
  ensureInsideRepo(absPath);
  return absPath;
}

async function pathExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function readTextFile(absPath, maxBytes = 2_000_000) {
  const stat = await fs.stat(absPath);
  if (stat.size > maxBytes) {
    throw new Error(`File is too large (${stat.size} bytes): ${toRelative(absPath)}`);
  }
  return fs.readFile(absPath, "utf8");
}

async function walkFiles(rootDir, options = {}) {
  const {
    includeExtensions = null,
    includeFileName = null,
    extraIgnoreDirs = [],
  } = options;

  const ignore = new Set([...IGNORE_DIRS, ...extraIgnoreDirs]);
  const out = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignore.has(entry.name)) continue;
        stack.push(absPath);
        continue;
      }
      if (!entry.isFile()) continue;

      if (includeExtensions) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!includeExtensions.has(ext)) continue;
      }

      if (includeFileName && !includeFileName.test(entry.name)) continue;
      out.push(absPath);
    }
  }

  return out;
}

function extractQuotedStrings(block) {
  if (!block) return [];
  const out = [];
  const re = /"([^"]+)"/g;
  let match = re.exec(block);
  while (match) {
    out.push(match[1]);
    match = re.exec(block);
  }
  return [...new Set(out)];
}

function buildTextResult(text) {
  return { content: [{ type: "text", text }] };
}

function buildJsonResult(payload) {
  return buildTextResult(JSON.stringify(payload, null, 2));
}

function normalizeRouteFromFile(filePath) {
  const rel = unixPath(path.relative(APP_ROOT, filePath));
  const stripped = rel.replace(/\/route\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
  return `/${stripped}`;
}

function detectExpectedAuth(routePath) {
  if (routePath.startsWith("/api/cron/") || routePath === "/api/cron") {
    return "cron-bearer-secret";
  }
  if (routePath.startsWith("/api/dashboard/") || routePath === "/api/dashboard") {
    return "requireApiBusiness";
  }
  if (routePath.startsWith("/api/v1/") || routePath === "/api/v1") {
    return "requireApiKey";
  }
  return "custom";
}

function analyzeAuthInSource(routePath, source) {
  const expected = detectExpectedAuth(routePath);
  const hasZodValidation =
    /from\s+["']zod["']/.test(source) ||
    /\.parse\(/.test(source) ||
    /\.safeParse\(/.test(source);

  if (expected === "requireApiBusiness") {
    const hasGuard = /requireApiBusiness\s*\(/.test(source);
    return {
      expectedAuth: expected,
      passed: hasGuard,
      hasZodValidation,
      findings: hasGuard ? [] : ["Missing requireApiBusiness() call for dashboard route."],
    };
  }

  if (expected === "requireApiKey") {
    const hasGuard = /require(ApiKey|AnyApiKey)\s*\(/.test(source);
    return {
      expectedAuth: expected,
      passed: hasGuard,
      hasZodValidation,
      findings: hasGuard ? [] : ["Missing requireApiKey()/requireAnyApiKey() call for v1 route."],
    };
  }

  if (expected === "cron-bearer-secret") {
    const hasHeaderCheck = /headers\.get\(["']authorization["']\)/i.test(source);
    const hasBearerCheck = /Bearer\s+/i.test(source);
    const hasSecret = /CRON_SECRET|HEALTH_CHECK_SECRET/.test(source);
    const hasUnauthorized = /status:\s*401|Unauthorized/i.test(source);
    const passed = hasHeaderCheck && hasSecret && hasUnauthorized;

    return {
      expectedAuth: expected,
      passed,
      hasZodValidation,
      findings: [
        ...(hasHeaderCheck ? [] : ["No explicit Authorization header read detected."]),
        ...(hasBearerCheck ? [] : ["No explicit Bearer token pattern detected."]),
        ...(hasSecret ? [] : ["No CRON_SECRET/HEALTH_CHECK_SECRET usage detected."]),
        ...(hasUnauthorized ? [] : ["No explicit 401/Unauthorized response detected."]),
      ],
    };
  }

  return {
    expectedAuth: expected,
    passed: true,
    hasZodValidation,
    findings: [],
  };
}

async function getApiRouteMetadata() {
  if (!(await pathExists(API_ROOT))) {
    return [];
  }

  const files = await walkFiles(API_ROOT, {
    includeFileName: /^route\.(ts|tsx|js|jsx|mjs|cjs)$/,
  });
  files.sort();

  const out = [];
  for (const absPath of files) {
    const source = await readTextFile(absPath);
    const routePath = normalizeRouteFromFile(absPath);
    const auth = analyzeAuthInSource(routePath, source);
    out.push({
      file: toRelative(absPath),
      routePath,
      ...auth,
    });
  }
  return out;
}

async function getServerPageGuardMetadata() {
  const targets = [
    path.join(APP_ROOT, "admin"),
    path.join(APP_ROOT, "dashboard"),
  ];
  const out = [];

  for (const root of targets) {
    if (!(await pathExists(root))) continue;
    const files = await walkFiles(root, {
      includeFileName: /^(page|layout)\.(ts|tsx|js|jsx|mjs|cjs)$/,
    });
    for (const absPath of files) {
      const source = await readTextFile(absPath);
      const rel = toRelative(absPath);
      out.push({
        file: rel,
        usesRequireBusiness: /requireBusiness\s*\(/.test(source),
        usesRequireOwner: /requireOwner\s*\(/.test(source),
        usesMutableGuard: /requireMutable(Business|Owner)\s*\(/.test(source),
      });
    }
  }

  out.sort((a, b) => a.file.localeCompare(b.file));
  return out;
}

async function getPlanMetadata() {
  const abs = path.join(SRC_ROOT, "lib", "plan.ts");
  const source = await readTextFile(abs);

  const featureBlockMatch = source.match(/export type PlanFeature\s*=\s*([\s\S]*?);/);
  const enforcedBlockMatch = source.match(/export const ENFORCED_FEATURES[\s\S]*?=\s*\[([\s\S]*?)\]\s*as const;/);
  const maxOnlyBlockMatch = source.match(/const MAX_ONLY_FEATURES[\s\S]*?=\s*\[([\s\S]*?)\]\s*;/);

  return {
    file: toRelative(abs),
    allFeatures: extractQuotedStrings(featureBlockMatch?.[1]),
    enforcedFeatures: extractQuotedStrings(enforcedBlockMatch?.[1]),
    maxOnlyFeatures: extractQuotedStrings(maxOnlyBlockMatch?.[1]),
    hasRequirePro: /export async function requirePro/.test(source),
    hasCanUseFeature: /export function canUseFeature/.test(source),
    hasPlanRequiredError: /export class PlanRequiredError/.test(source),
    hasPlanLimitError: /export class PlanLimitError/.test(source),
  };
}

async function getSchemaMetadata() {
  const abs = path.join(SRC_ROOT, "db", "schema.ts");
  const source = await readTextFile(abs);
  const tableMatches = [...source.matchAll(/export const (\w+)\s*=\s*pgTable\("([^"]+)"/g)];
  const enumMatches = [...source.matchAll(/export const (\w+)\s*=\s*pgEnum\("([^"]+)"/g)];

  return {
    file: toRelative(abs),
    tableCount: tableMatches.length,
    enumCount: enumMatches.length,
    tables: tableMatches.map((match) => ({
      exportName: match[1],
      tableName: match[2],
    })),
    enums: enumMatches.map((match) => ({
      exportName: match[1],
      enumName: match[2],
    })),
  };
}

function migrationNumber(fileName) {
  const m = fileName.match(/^(\d+)_/);
  if (!m) return Number.NaN;
  return Number(m[1]);
}

function isDocumentedDuplicateMigrationSequence(number, files) {
  const expected = DOCUMENTED_DUPLICATE_MIGRATION_SEQUENCES.get(number);
  if (!expected) return false;
  return files.toSorted().join("\n") === expected.toSorted().join("\n");
}

async function getMigrationMetadata() {
  if (!(await pathExists(DRIZZLE_ROOT))) {
    return {
      directory: toRelative(DRIZZLE_ROOT),
      duplicateSequences: [],
      documentedDuplicateSequences: [],
      migrations: [],
      sequenceGaps: [],
    };
  }

  const entries = await fs.readdir(DRIZZLE_ROOT, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => migrationNumber(a) - migrationNumber(b) || a.localeCompare(b));

  const migrations = [];
  for (const fileName of files) {
    const absPath = path.join(DRIZZLE_ROOT, fileName);
    const source = await readTextFile(absPath, 4_000_000);
    migrations.push({
      file: `drizzle/${fileName}`,
      number: migrationNumber(fileName),
      bytes: source.length,
      createsTableCount: (source.match(/create\s+table/gi) ?? []).length,
      altersTableCount: (source.match(/alter\s+table/gi) ?? []).length,
    });
  }

  const sequenceGaps = [];
  const migrationsByNumber = new Map();
  for (const migration of migrations) {
    const files = migrationsByNumber.get(migration.number) ?? [];
    files.push(migration.file);
    migrationsByNumber.set(migration.number, files);
  }

  const duplicateCandidates = [...migrationsByNumber.entries()]
    .filter(([, migrationFiles]) => migrationFiles.length > 1)
    .map(([number, migrationFiles]) => ({ number, files: migrationFiles }));
  const duplicateSequences = duplicateCandidates.filter(
    ({ number, files }) => !isDocumentedDuplicateMigrationSequence(number, files),
  );
  const documentedDuplicateSequences = duplicateCandidates.filter(
    ({ number, files }) => isDocumentedDuplicateMigrationSequence(number, files),
  );

  for (let i = 1; i < migrations.length; i += 1) {
    const prev = migrations[i - 1].number;
    const next = migrations[i].number;
    if (next - prev > 1) {
      sequenceGaps.push({ from: prev, to: next });
    }
  }

  return {
    directory: "drizzle/",
    duplicateSequences,
    documentedDuplicateSequences,
    migrations,
    sequenceGaps,
  };
}

async function auditSchemaMigrations() {
  const schema = await getSchemaMetadata();
  const migrations = await getMigrationMetadata();

  const allMigrationText = [];
  for (const migration of migrations.migrations) {
    const source = await readTextFile(resolveRepoPath(migration.file), 4_000_000);
    allMigrationText.push(source.toLowerCase());
  }
  const haystack = allMigrationText.join("\n");

  const unreferencedTables = schema.tables
    .map((table) => table.tableName)
    .filter((tableName) => {
      const quoted = `"${tableName}"`;
      const plain = ` ${tableName} `;
      return !haystack.includes(quoted) && !haystack.includes(plain);
    });

  return {
    schemaFile: schema.file,
    migrationCount: migrations.migrations.length,
    tableCount: schema.tableCount,
    unreferencedTables,
    duplicateSequences: migrations.duplicateSequences,
    sequenceGaps: migrations.sequenceGaps,
  };
}

async function getWorkflowMetadata() {
  const workflowRoot = path.join(REPO_ROOT, ".github", "workflows");
  if (!(await pathExists(workflowRoot))) {
    return [];
  }

  const files = await walkFiles(workflowRoot, {
    includeExtensions: new Set([".yml", ".yaml"]),
  });
  files.sort();

  const out = [];
  for (const absPath of files) {
    const source = await readTextFile(absPath);
    const schedule = [...source.matchAll(/-\s+cron:\s+["']([^"']+)["']/g)].map((m) => m[1]);
    out.push({
      file: toRelative(absPath),
      hasWorkflowDispatch: /workflow_dispatch:/.test(source),
      hasSchedule: /schedule:/.test(source),
      schedule,
    });
  }
  return out;
}

async function getEnvReadiness() {
  const envExamplePath = path.join(REPO_ROOT, ".env.example");
  const envLocalPath = path.join(REPO_ROOT, ".env.local");

  const parseKeys = (source) => {
    const keys = new Set();
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      if (!key) continue;
      keys.add(key);
    }
    return keys;
  };

  const envExample = (await pathExists(envExamplePath)) ? await readTextFile(envExamplePath) : "";
  const envLocal = (await pathExists(envLocalPath)) ? await readTextFile(envLocalPath) : "";

  const required = parseKeys(envExample);
  const present = parseKeys(envLocal);

  const missing = [...required].filter((key) => !present.has(key));
  missing.sort();

  const securityCritical = [
    "AUTH_SECRET",
    "CRON_SECRET",
    "DATABASE_URL",
    "PAYHERE_MERCHANT_SECRET",
    "SECRET_ENCRYPTION_KEY",
  ];

  return {
    envExampleFile: ".env.example",
    envLocalFile: ".env.local",
    requiredCount: required.size,
    presentCount: present.size,
    missing,
    securityCritical,
    securityCriticalPresent: securityCritical
      .filter((key) => present.has(key))
      .sort(),
  };
}

function candidateSearchRoots() {
  return [
    path.join(REPO_ROOT, "README.md"),
    path.join(REPO_ROOT, "AGENTS.md"),
    path.join(REPO_ROOT, "middleware.ts"),
    path.join(REPO_ROOT, "docs"),
    path.join(REPO_ROOT, "drizzle"),
    path.join(REPO_ROOT, "scripts"),
    path.join(REPO_ROOT, "src"),
  ];
}

async function gatherSearchFiles() {
  const out = [];
  for (const root of candidateSearchRoots()) {
    if (!(await pathExists(root))) continue;
    const stat = await fs.stat(root);
    if (stat.isFile()) {
      out.push(root);
      continue;
    }
    const files = await walkFiles(root, {
      includeExtensions: SEARCHABLE_EXTENSIONS,
    });
    out.push(...files);
  }
  out.sort();
  return out;
}

function buildLineMatches({ source, query, isRegex, caseSensitive, maxMatches }) {
  const matches = [];
  const flags = caseSensitive ? "g" : "gi";
  const regex = isRegex ? new RegExp(query, flags) : null;

  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    let matched = false;
    if (isRegex) {
      regex.lastIndex = 0;
      matched = regex.test(line);
    } else if (caseSensitive) {
      matched = line.includes(query);
    } else {
      matched = line.toLowerCase().includes(query.toLowerCase());
    }

    if (matched) {
      matches.push({
        line: i + 1,
        text: line.trim(),
      });
    }

    if (matches.length >= maxMatches) break;
  }

  return matches;
}

async function searchCode({ query, isRegex, caseSensitive, limit, pathPrefix }) {
  const files = await gatherSearchFiles();
  const out = [];
  const prefix = pathPrefix ? unixPath(pathPrefix.replace(/\\/g, "/")).replace(/^\/+/, "") : null;

  for (const absPath of files) {
    const rel = toRelative(absPath);
    if (prefix && !rel.startsWith(prefix)) continue;

    const source = await readTextFile(absPath, 1_000_000);
    const lineMatches = buildLineMatches({
      source,
      query,
      isRegex,
      caseSensitive,
      maxMatches: 5,
    });

    if (lineMatches.length === 0) continue;
    out.push({
      file: rel,
      matches: lineMatches,
    });

    if (out.length >= limit) break;
  }

  return out;
}

function sanitizeMigrationName(rawName) {
  const normalized = rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalized) {
    throw new Error("Migration name cannot be empty after sanitization.");
  }
  return normalized;
}

async function createMigrationStub(rawName) {
  const name = sanitizeMigrationName(rawName);
  const metadata = await getMigrationMetadata();
  const nextNumber = (metadata.migrations.at(-1)?.number ?? 0) + 1;
  const fileName = `${String(nextNumber).padStart(4, "0")}_${name}.sql`;
  const absPath = path.join(DRIZZLE_ROOT, fileName);

  const content = [
    `-- ${fileName}`,
    `-- Generated by Dinaya MCP (${new Date().toISOString()})`,
    "",
    "BEGIN;",
    "",
    "-- TODO: add migration SQL",
    "",
    "COMMIT;",
    "",
  ].join("\n");

  await fs.writeFile(absPath, content, "utf8");
  return {
    file: `drizzle/${fileName}`,
    migrationNumber: nextNumber,
  };
}

function sanitizeRouteSegment(rawSegment) {
  const segment = rawSegment.trim().replace(/^\/+|\/+$/g, "");
  if (!segment) throw new Error("Route segment cannot be empty.");
  if (segment.split("/").some((part) => part === "..")) {
    throw new Error("Route segment cannot include '..'.");
  }
  return segment;
}

function renderRouteTemplate({ routeType, apiKeyScope }) {
  if (routeType === "dashboard") {
    return `import { NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireApiBusiness();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ ok: true, businessId: auth.context.businessId });
}
`;
  }

  if (routeType === "v1") {
    return `import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api-key-auth";

const REQUIRED_SCOPE = "${apiKeyScope}";

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req, REQUIRED_SCOPE);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ ok: true, businessId: auth.context.businessId });
}
`;
  }

  if (routeType === "cron") {
    return `import { NextRequest, NextResponse } from "next/server";

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && token === expected);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
`;
  }

  return `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
`;
}

async function scaffoldApiRoute({ routeType, routeSegment, overwrite, apiKeyScope }) {
  const segment = sanitizeRouteSegment(routeSegment);
  const routeRoot =
    routeType === "public"
      ? path.join(API_ROOT, segment)
      : path.join(API_ROOT, routeType, segment);
  const absFile = path.join(routeRoot, "route.ts");

  if (!overwrite && (await pathExists(absFile))) {
    throw new Error(`Route file already exists: ${toRelative(absFile)}`);
  }

  await fs.mkdir(routeRoot, { recursive: true });
  await fs.writeFile(
    absFile,
    renderRouteTemplate({ routeType, apiKeyScope }),
    "utf8",
  );

  return {
    file: toRelative(absFile),
    routePath: normalizeRouteFromFile(absFile),
    routeType,
  };
}

async function runNpmScript(scriptName, timeoutMs) {
  if (!DEFAULT_SCRIPT_ALLOWLIST.has(scriptName)) {
    throw new Error(
      `Script "${scriptName}" is not allowed. Allowed scripts: ${[...DEFAULT_SCRIPT_ALLOWLIST].join(", ")}`,
    );
  }
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const startedAt = Date.now();
  const result = await execFileAsync(npmCmd, ["run", scriptName], {
    cwd: REPO_ROOT,
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    script: scriptName,
    durationMs: Date.now() - startedAt,
    stdout: result.stdout.trim().slice(-20_000),
    stderr: result.stderr.trim().slice(-20_000),
  };
}

function buildRepoOverviewPayload({ routes, schema, migrations, workflows }) {
  const routeBreakdown = {
    cron: routes.filter((r) => r.routePath.startsWith("/api/cron")).length,
    dashboard: routes.filter((r) => r.routePath.startsWith("/api/dashboard")).length,
    v1: routes.filter((r) => r.routePath.startsWith("/api/v1")).length,
    custom: routes.filter((r) => !API_PREFIXES.some((prefix) => r.routePath.startsWith(prefix))).length,
  };

  return {
    repoRoot: REPO_ROOT,
    generatedAt: new Date().toISOString(),
    apiRoutes: {
      total: routes.length,
      byType: routeBreakdown,
      authFailures: routes.filter((r) => !r.passed).length,
    },
    schema: {
      tableCount: schema.tableCount,
      enumCount: schema.enumCount,
    },
    migrations: {
      total: migrations.migrations.length,
      latest: migrations.migrations.at(-1)?.file ?? null,
      duplicateSequences: migrations.duplicateSequences,
      documentedDuplicateSequences: migrations.documentedDuplicateSequences,
      sequenceGaps: migrations.sequenceGaps,
    },
    workflows: {
      total: workflows.length,
      scheduled: workflows.filter((w) => w.hasSchedule).length,
    },
  };
}

function wrapTool(name, handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: "text", text: `${name} failed: ${message}` }],
      };
    }
  };
}

function registerResources(server) {
  server.registerResource(
    "dinaya-overview",
    "dinaya://overview",
    {
      title: "Dinaya Overview",
      description: "High-level Dinaya architecture and conventions.",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const text = [
        "# Dinaya",
        "",
        "- Stack: Next.js 16 App Router, React 19, TypeScript, Neon Postgres, Drizzle",
        "- Auth: NextAuth + `requireBusiness`/`requireOwner` and API guards",
        "- APIs:",
        "  - `/api/cron/*` -> Bearer `CRON_SECRET`",
        "  - `/api/dashboard/*` -> `requireApiBusiness()`",
        "  - `/api/v1/*` -> `requireApiKey(req, scope)`",
        "- Payments: PayHere in `src/lib/payhere.ts`",
        "- Plan gating: `src/lib/plan.ts` (`canUseFeature`, `requirePro`)",
      ].join("\n");
      return {
        contents: [{ uri: uri.toString(), mimeType: "text/markdown", text }],
      };
    },
  );

  server.registerResource(
    "dinaya-auth-conventions",
    "dinaya://auth-conventions",
    {
      title: "Dinaya Auth Conventions",
      description: "Auth and route guard conventions from AGENTS.md.",
      mimeType: "text/plain",
    },
    async (uri) => {
      const text = [
        "/api/cron/* => Authorization: Bearer $CRON_SECRET",
        "/api/dashboard/* => requireApiBusiness() from @/lib/api-auth",
        "/api/v1/* => requireApiKey(req, scope) from @/lib/api-key-auth",
        "Server pages => requireBusiness()/requireOwner() from @/lib/auth",
        "Mutation pages should also enforce mutable session when impersonation is read-only.",
      ].join("\n");
      return {
        contents: [{ uri: uri.toString(), mimeType: "text/plain", text }],
      };
    },
  );

  server.registerResource(
    "dinaya-repo-file",
    new ResourceTemplate("dinaya://file/{path}", { list: undefined }),
    {
      title: "Dinaya Repo File",
      description: "Read a repository file as text via URI template.",
      mimeType: "text/plain",
    },
    async (uri, variables) => {
      const rawPath = decodeURIComponent(String(variables.path ?? ""));
      const absPath = resolveRepoPath(rawPath);
      const text = await readTextFile(absPath);
      return {
        contents: [{ uri: uri.toString(), mimeType: "text/plain", text }],
      };
    },
  );
}

function registerPrompts(server) {
  server.registerPrompt(
    "dinaya-api-route-review",
    {
      title: "Dinaya API Route Review",
      description: "Generate a focused API route review prompt with Dinaya conventions.",
      argsSchema: {
        routePath: z.string().describe("Route path like /api/dashboard/bookings"),
      },
    },
    async ({ routePath }) => {
      const message = [
        `Review ${routePath} against Dinaya standards.`,
        "Checklist:",
        "1. Correct auth guard by route family.",
        "2. Zod body/query validation.",
        "3. Plan gating where needed (`requirePro` / `canUseFeature`).",
        "4. No secret leakage in logs or responses.",
        "5. Business timezone-safe logic for slot/date behavior.",
      ].join("\n");
      return {
        description: "Dinaya API route review checklist prompt.",
        messages: [{ role: "user", content: { type: "text", text: message } }],
      };
    },
  );

  server.registerPrompt(
    "dinaya-migration-checklist",
    {
      title: "Dinaya Migration Checklist",
      description: "Generate migration implementation checklist for Dinaya.",
      argsSchema: {
        migrationName: z.string().describe("Descriptive migration name"),
      },
    },
    async ({ migrationName }) => {
      const message = [
        `Plan migration "${migrationName}" for Dinaya.`,
        "Requirements:",
        "- Create next numbered SQL file under drizzle/",
        "- Keep existing applied migrations immutable",
        "- Update src/db/schema.ts to match",
        "- Run npm run db:migrate locally",
        "- Note rollback and data safety considerations",
      ].join("\n");
      return {
        description: "Dinaya migration planning prompt.",
        messages: [{ role: "user", content: { type: "text", text: message } }],
      };
    },
  );

  server.registerPrompt(
    "dinaya-feature-gate-check",
    {
      title: "Dinaya Feature Gate Check",
      description: "Prompt for end-to-end plan gate verification of one feature.",
      argsSchema: {
        feature: z.string().describe("Plan feature key, e.g. aiVoiceReceptionist"),
      },
    },
    async ({ feature }) => {
      const message = [
        `Audit feature gate coverage for "${feature}" in Dinaya.`,
        "Verify:",
        "- Feature appears in src/lib/plan.ts feature model",
        "- API-level enforcement uses requirePro where required",
        "- UI-level gate is present and non-bypassable",
        "- Messaging and fallback behavior for Free/Pro/Max are coherent",
      ].join("\n");
      return {
        description: "Dinaya feature gate audit prompt.",
        messages: [{ role: "user", content: { type: "text", text: message } }],
      };
    },
  );
}

function registerTools(server) {
  server.registerTool(
    "workspace_summary",
    {
      description: "Summarize Dinaya repository structure, route counts, schema, and workflows.",
      inputSchema: z.object({}),
    },
    wrapTool("workspace_summary", async () => {
      const [routes, schema, migrations, workflows] = await Promise.all([
        getApiRouteMetadata(),
        getSchemaMetadata(),
        getMigrationMetadata(),
        getWorkflowMetadata(),
      ]);
      return buildJsonResult(buildRepoOverviewPayload({ routes, schema, migrations, workflows }));
    }),
  );

  server.registerTool(
    "list_api_routes",
    {
      description: "List API routes and auth convention pass/fail status.",
      inputSchema: z.object({
        prefix: z.enum(["all", "/api/cron", "/api/dashboard", "/api/v1"]).default("all"),
        onlyFailures: z.boolean().default(false),
      }),
    },
    wrapTool("list_api_routes", async ({ prefix, onlyFailures }) => {
      let routes = await getApiRouteMetadata();
      if (prefix !== "all") {
        routes = routes.filter((route) => route.routePath.startsWith(prefix));
      }
      if (onlyFailures) {
        routes = routes.filter((route) => !route.passed);
      }
      return buildJsonResult({
        count: routes.length,
        routes,
      });
    }),
  );

  server.registerTool(
    "audit_api_auth",
    {
      description: "Audit API routes for Dinaya auth convention violations.",
      inputSchema: z.object({
        failOnCustom: z.boolean().default(false),
      }),
    },
    wrapTool("audit_api_auth", async ({ failOnCustom }) => {
      const routes = await getApiRouteMetadata();
      const violations = routes.filter((route) => {
        if (route.expectedAuth === "custom") return failOnCustom;
        return !route.passed;
      });

      return buildJsonResult({
        totalRoutes: routes.length,
        conventionScopedRoutes: routes.filter((r) => r.expectedAuth !== "custom").length,
        violations,
      });
    }),
  );

  server.registerTool(
    "audit_cron_security",
    {
      description: "Audit cron routes for bearer secret protection patterns.",
      inputSchema: z.object({
        routePath: z.string().optional(),
      }),
    },
    wrapTool("audit_cron_security", async ({ routePath }) => {
      const routes = (await getApiRouteMetadata()).filter(
        (route) => route.routePath.startsWith("/api/cron"),
      );
      const filtered = routePath
        ? routes.filter((route) => route.routePath === routePath)
        : routes;

      return buildJsonResult({
        checked: filtered.length,
        failed: filtered.filter((route) => !route.passed),
        passed: filtered.filter((route) => route.passed).map((route) => route.routePath),
      });
    }),
  );

  server.registerTool(
    "list_server_page_guards",
    {
      description: "List dashboard/admin page and layout files with requireBusiness/requireOwner usage.",
      inputSchema: z.object({}),
    },
    wrapTool("list_server_page_guards", async () => {
      const pages = await getServerPageGuardMetadata();
      return buildJsonResult({
        count: pages.length,
        files: pages,
      });
    }),
  );

  server.registerTool(
    "plan_feature_matrix",
    {
      description: "Read plan feature metadata from src/lib/plan.ts.",
      inputSchema: z.object({}),
    },
    wrapTool("plan_feature_matrix", async () => {
      return buildJsonResult(await getPlanMetadata());
    }),
  );

  server.registerTool(
    "find_feature_usage",
    {
      description: "Search repository usage of a plan feature key.",
      inputSchema: z.object({
        feature: z.string().min(1),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    },
    wrapTool("find_feature_usage", async ({ feature, limit }) => {
      const results = await searchCode({
        query: feature,
        isRegex: false,
        caseSensitive: false,
        limit,
        pathPrefix: "src/",
      });
      return buildJsonResult({
        feature,
        matchFiles: results.length,
        results,
      });
    }),
  );

  server.registerTool(
    "db_schema_overview",
    {
      description: "List Drizzle schema tables and enums.",
      inputSchema: z.object({}),
    },
    wrapTool("db_schema_overview", async () => buildJsonResult(await getSchemaMetadata())),
  );

  server.registerTool(
    "list_migrations",
    {
      description: "List Drizzle migration files and sequence gaps.",
      inputSchema: z.object({}),
    },
    wrapTool("list_migrations", async () => buildJsonResult(await getMigrationMetadata())),
  );

  server.registerTool(
    "audit_schema_migrations",
    {
      description: "Cross-check schema table names against migration text references.",
      inputSchema: z.object({}),
    },
    wrapTool("audit_schema_migrations", async () => buildJsonResult(await auditSchemaMigrations())),
  );

  server.registerTool(
    "list_workflows",
    {
      description: "List GitHub workflows and cron schedules.",
      inputSchema: z.object({}),
    },
    wrapTool("list_workflows", async () => {
      return buildJsonResult({
        workflows: await getWorkflowMetadata(),
      });
    }),
  );

  server.registerTool(
    "check_env_readiness",
    {
      description: "Compare .env.local keys against .env.example (keys only; never returns values).",
      inputSchema: z.object({}),
    },
    wrapTool("check_env_readiness", async () => buildJsonResult(await getEnvReadiness())),
  );

  server.registerTool(
    "search_code",
    {
      description: "Search code/text files in Dinaya repository.",
      inputSchema: z.object({
        query: z.string().min(1),
        isRegex: z.boolean().default(false),
        caseSensitive: z.boolean().default(false),
        limit: z.number().int().min(1).max(200).default(40),
        pathPrefix: z.string().optional(),
      }),
    },
    wrapTool("search_code", async ({ query, isRegex, caseSensitive, limit, pathPrefix }) => {
      const results = await searchCode({
        query,
        isRegex,
        caseSensitive,
        limit,
        pathPrefix,
      });
      return buildJsonResult({
        query,
        filesMatched: results.length,
        results,
      });
    }),
  );

  server.registerTool(
    "read_file",
    {
      description: "Read a UTF-8 text file from repository by relative path.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Repository-relative path"),
      }),
    },
    wrapTool("read_file", async ({ path: relativePath }) => {
      const absPath = resolveRepoPath(relativePath);
      const source = await readTextFile(absPath);
      return buildJsonResult({
        path: toRelative(absPath),
        bytes: source.length,
        content: source,
      });
    }),
  );

  server.registerTool(
    "run_project_script",
    {
      description: "Run an allowlisted npm script in repo root.",
      inputSchema: z.object({
        script: z.enum([...DEFAULT_SCRIPT_ALLOWLIST]),
        timeoutMs: z.number().int().min(5_000).max(1_800_000).default(600_000),
      }),
    },
    wrapTool("run_project_script", async ({ script, timeoutMs }) => {
      return buildJsonResult(await runNpmScript(script, timeoutMs));
    }),
  );

  server.registerTool(
    "create_migration_stub",
    {
      description: "Create next numbered drizzle migration stub.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Descriptive migration name"),
      }),
    },
    wrapTool("create_migration_stub", async ({ name }) => {
      return buildJsonResult(await createMigrationStub(name));
    }),
  );

  server.registerTool(
    "scaffold_api_route",
    {
      description: "Scaffold a new API route with Dinaya auth conventions.",
      inputSchema: z.object({
        routeType: z.enum(["cron", "dashboard", "public", "v1"]),
        routeSegment: z.string().min(1).describe("Path segment under the route type"),
        overwrite: z.boolean().default(false),
        apiKeyScope: z.string().default("voice:inbound"),
      }),
    },
    wrapTool("scaffold_api_route", async ({ routeType, routeSegment, overwrite, apiKeyScope }) => {
      return buildJsonResult(await scaffoldApiRoute({
        routeType,
        routeSegment,
        overwrite,
        apiKeyScope,
      }));
    }),
  );
}

function createServer() {
  const server = new McpServer({
    name: "dinaya-mcp",
    version: "0.1.0",
  });
  registerResources(server);
  registerPrompts(server);
  registerTools(server);
  return server;
}

async function runSelfTest() {
  const [routes, schema, migrations, workflows, env] = await Promise.all([
    getApiRouteMetadata(),
    getSchemaMetadata(),
    getMigrationMetadata(),
    getWorkflowMetadata(),
    getEnvReadiness(),
  ]);

  const payload = buildRepoOverviewPayload({ routes, schema, migrations, workflows });
  payload.env = {
    requiredCount: env.requiredCount,
    missingCount: env.missing.length,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  if (process.argv.includes("--self-test")) {
    await runSelfTest();
    return;
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? `${error.stack ?? error.message}` : String(error);
  process.stderr.write(`dinaya-mcp startup failed: ${message}\n`);
  process.exit(1);
});
