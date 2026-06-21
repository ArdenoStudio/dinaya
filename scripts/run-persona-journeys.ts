/**
 * Run multi-phase Dinaya journeys for all seeded personas.
 *
 * Phases:
 *   core    — public book → availability → booking → sign-in → dashboard
 *   reads   — ungated + plan-gated GET /api/dashboard/*
 *   gates   — negative POST probes (402 vs allowed)
 *   pages   — authenticated dashboard HTML smoke
 *   limits  — rich personas only: staff/location caps
 *   crm     — rich personas: client create, booking list, status patch
 *   growth  — max plan: AI runs, review reply gate
 *
 * Usage:
 *   E2E_DISABLE_RATE_LIMIT=true npx tsx scripts/run-persona-journeys.ts
 *   npx tsx scripts/run-persona-journeys.ts --sample 50 --phases core,reads
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { addDays, format } from "date-fns";
import {
  DASHBOARD_PAGE_PROBES,
  GROWTH_READ_PROBES,
  isRichPersonaIndex,
  locationLimit,
  NEGATIVE_POST_PROBES,
  PRO_READ_PROBES,
  staffLimit,
  statusMatches,
  UNGATED_READ_PROBES,
  type ApiProbe,
} from "./lib/persona-journey-matrix";
import type { PersonaRecord } from "./lib/persona-seed-core";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const FIXTURE_PATH = path.join(process.cwd(), "e2e/fixtures/personas.json");
const DEFAULT_BASE = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const CONCURRENCY = 4;

const ALL_PHASES = ["core", "reads", "gates", "pages", "limits", "crm", "growth"] as const;
type Phase = (typeof ALL_PHASES)[number];

type StepResult = { ok: boolean; detail?: string };

type JourneyResult = {
  index: number;
  slug: string;
  plan: string;
  ok: boolean;
  steps: Record<string, StepResult>;
};

function parseArgs() {
  const args = process.argv.slice(2);
  let sample: number | null = null;
  let phases: Set<Phase> = new Set(ALL_PHASES);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sample" && args[i + 1]) sample = Number(args[++i]);
    else if (args[i] === "--phases" && args[i + 1]) {
      phases = new Set(
        args[++i]
          .split(",")
          .map((p) => p.trim())
          .filter((p): p is Phase => ALL_PHASES.includes(p as Phase)),
      );
    }
  }

  return { sample, phases };
}

function nextBookableDate(): string {
  const candidate = addDays(new Date(), 1);
  while (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return format(candidate, "yyyy-MM-dd");
}

function personaHeaders(persona: PersonaRecord): HeadersInit {
  return {
    "X-Forwarded-For": `10.200.${Math.floor(persona.index / 256)}.${persona.index % 256}`,
  };
}

async function signIn(baseUrl: string, persona: PersonaRecord): Promise<string | null> {
  const cookies: string[] = [];
  const headers = personaHeaders(persona);

  const collect = (res: Response) => {
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie")
          ? [res.headers.get("set-cookie")!]
          : [];
    for (const raw of setCookies) {
      const pair = raw.split(";")[0]?.trim();
      if (pair) cookies.push(pair);
    }
  };

  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, { headers });
  collect(csrfRes);
  if (!csrfRes.ok) return null;
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfToken) return null;

  const body = new URLSearchParams({
    callbackUrl: "/dashboard",
    csrfToken,
    email: persona.email,
    json: "true",
    password: persona.password,
  });

  const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies.join("; "),
      ...headers,
    },
    body,
    redirect: "manual",
  });
  collect(res);

  return cookies.length > 0 ? cookies.join("; ") : null;
}

async function apiCall(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  probe: ApiProbe,
): Promise<{ status: number; body: string }> {
  const headers: HeadersInit = {
    Cookie: session,
    ...personaHeaders(persona),
  };
  const init: RequestInit = { method: probe.method, headers };
  if (probe.body && probe.method !== "GET") {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(probe.body);
  }
  const res = await fetch(`${baseUrl}${probe.buildPath?.(persona) ?? probe.path}`, init);
  const body = await res.text();
  return { status: res.status, body };
}

async function runApiProbes(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  probes: ApiProbe[],
  prefix: string,
  steps: Record<string, StepResult>,
): Promise<boolean> {
  let allOk = true;
  for (const probe of probes) {
    const { status } = await apiCall(baseUrl, session, persona, probe);
    const expected = probe.expectedStatus(persona.plan);
    const ok = statusMatches(status, expected);
    steps[`${prefix}_${probe.id}`] = {
      ok,
      detail: ok ? undefined : `HTTP ${status}, expected ${JSON.stringify(expected)}`,
    };
    if (!ok) allOk = false;
  }
  return allOk;
}

async function runCoreFunnel(
  baseUrl: string,
  persona: PersonaRecord,
  steps: Record<string, StepResult>,
): Promise<{ session: string | null; bookingId?: string }> {
  const date = nextBookableDate();
  const headers = personaHeaders(persona);
  let bookingId: string | undefined;

  const bookRes = await fetch(`${baseUrl}/book/${persona.slug}`, { headers });
  const bookHtml = await bookRes.text();
  steps.core_publicPage = {
    ok: bookRes.ok && bookHtml.includes(persona.serviceName),
    detail: bookRes.ok ? undefined : `HTTP ${bookRes.status}`,
  };

  const availUrl = new URL(`${baseUrl}/api/availability`);
  availUrl.searchParams.set("businessId", persona.businessId);
  availUrl.searchParams.set("staffId", persona.staffId);
  availUrl.searchParams.set("serviceId", persona.serviceId);
  availUrl.searchParams.set("locationId", persona.locationId);
  availUrl.searchParams.set("date", date);

  const availRes = await fetch(availUrl, { headers });
  const availJson = (await availRes.json()) as { slots?: { startUtc: string; endUtc: string }[]; error?: string };
  const slots = availJson.slots ?? [];
  const slot = slots.length > 0 ? slots[persona.index % slots.length] : undefined;
  steps.core_availability = {
    ok: availRes.ok && Boolean(slot),
    detail: availRes.ok ? `${slots.length} slots` : availJson.error ?? `HTTP ${availRes.status}`,
  };

  if (slot) {
    const tryBook = async (target: { startUtc: string; endUtc: string }) => {
      const bookingRes = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          businessId: persona.businessId,
          serviceId: persona.serviceId,
          staffId: persona.staffId,
          locationId: persona.locationId,
          startsAt: target.startUtc,
          endsAt: target.endUtc,
          clientName: `Client ${persona.index}`,
          clientPhone: `+9477${String(persona.index).padStart(7, "0").slice(-7)}`,
          clientEmail: `client-${persona.index}@dinaya.test`,
          source: "public",
        }),
      });
      const bookingJson = (await bookingRes.json().catch(() => ({}))) as {
        id?: string;
        bookingId?: string;
        error?: string;
      };
      const id = bookingJson.bookingId ?? bookingJson.id;
      return { bookingRes, bookingJson, id };
    };

    let booked = await tryBook(slot);
    if (!booked.id && slots.length > 1) {
      for (const fallback of slots) {
        if (fallback.startUtc === slot.startUtc) continue;
        booked = await tryBook(fallback);
        if (booked.id) break;
      }
    }

    bookingId = booked.id;
    steps.core_booking = {
      ok: booked.bookingRes.ok && Boolean(booked.id),
      detail: booked.bookingRes.ok ? booked.id : booked.bookingJson.error ?? `HTTP ${booked.bookingRes.status}`,
    };
  } else {
    steps.core_booking = { ok: false, detail: "no slot" };
  }

  let session: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      session = await signIn(baseUrl, persona);
      if (session) break;
    } catch {
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  if (session) {
    const dashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: session, ...headers },
      redirect: "manual",
    });
    steps.core_dashboard = {
      ok: dashRes.status === 200 || dashRes.status === 307 || dashRes.status === 302,
      detail: `HTTP ${dashRes.status}`,
    };
  } else {
    steps.core_dashboard = { ok: false, detail: "sign-in failed" };
  }

  return { session, bookingId };
}

async function runDashboardPages(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  steps: Record<string, StepResult>,
): Promise<boolean> {
  let allOk = true;
  for (const page of DASHBOARD_PAGE_PROBES) {
    const res = await fetch(`${baseUrl}${page.path}`, {
      headers: { Cookie: session, ...personaHeaders(persona) },
      redirect: "manual",
    });
    const html = res.status === 200 ? await res.text() : "";
    const ok = res.status === 200 && page.heading.test(html);
    steps[`page_${page.id}`] = {
      ok,
      detail: ok ? undefined : `HTTP ${res.status}`,
    };
    if (!ok) allOk = false;
  }
  return allOk;
}

async function countDashboardRows(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  path: string,
): Promise<number> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Cookie: session, ...personaHeaders(persona) },
  });
  if (!res.ok) return 0;
  try {
    const data = (await res.json()) as unknown[] | { rows?: unknown[] };
    return Array.isArray(data) ? data.length : data.rows?.length ?? 0;
  } catch {
    return 0;
  }
}

async function runLimitStress(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  steps: Record<string, StepResult>,
): Promise<boolean> {
  const rich = persona.rich ?? isRichPersonaIndex(persona.index);
  if (!rich) {
    steps.limits_skipped = { ok: true, detail: "not a rich persona" };
    return true;
  }

  let allOk = true;
  const locCap = locationLimit(persona.plan);
  const staffCap = staffLimit(persona.plan);

  if (staffCap !== null) {
    const existingStaff = await countDashboardRows(
      baseUrl,
      session,
      persona,
      "/api/dashboard/staff",
    );
    const slotsLeft = Math.max(0, staffCap - existingStaff);
    let added = 0;
    for (let i = 0; i < slotsLeft; i++) {
      const { status } = await apiCall(baseUrl, session, persona, {
        id: `staff_${i}`,
        method: "POST",
        path: "/api/dashboard/staff",
        body: {
          name: `Extra Staff ${persona.index}-${Date.now()}-${i}`,
          serviceIds: [persona.serviceId],
          locationIds: [persona.locationId],
        },
        expectedStatus: () => 201,
      });
      if (status === 201) added++;
    }
    const over = await apiCall(baseUrl, session, persona, {
      id: "staff_over",
      method: "POST",
      path: "/api/dashboard/staff",
      body: { name: `Over Staff ${persona.index}-${Date.now()}` },
      expectedStatus: () => 402,
    });
    const staffOk = added === slotsLeft && over.status === 402;
    steps.limits_staff = {
      ok: staffOk,
      detail: `existing ${existingStaff}, added ${added}/${slotsLeft}, over HTTP ${over.status}`,
    };
    if (!staffOk) allOk = false;
  }

  if (locCap !== null) {
    const existingLocations = await countDashboardRows(
      baseUrl,
      session,
      persona,
      "/api/dashboard/locations",
    );
    const slotsLeft = Math.max(0, locCap - existingLocations);
    let created = 0;
    for (let i = 0; i < slotsLeft; i++) {
      const { status } = await apiCall(baseUrl, session, persona, {
        id: `loc_${i}`,
        method: "POST",
        path: "/api/dashboard/locations",
        body: { name: `Branch ${persona.index}-${Date.now()}-${i}` },
        expectedStatus: () => 201,
      });
      if (status === 201) created++;
    }
    const over = await apiCall(baseUrl, session, persona, {
      id: "loc_over",
      method: "POST",
      path: "/api/dashboard/locations",
      body: { name: `Over Branch ${persona.index}-${Date.now()}` },
      expectedStatus: () => 402,
    });
    const locOk = created === slotsLeft && over.status === 402;
    steps.limits_locations = {
      ok: locOk,
      detail: `existing ${existingLocations}, created ${created}/${slotsLeft}, over HTTP ${over.status}`,
    };
    if (!locOk) allOk = false;
  }

  return allOk;
}

async function runCrmLifecycle(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  bookingId: string | undefined,
  steps: Record<string, StepResult>,
): Promise<boolean> {
  const rich = persona.rich ?? isRichPersonaIndex(persona.index);
  if (!rich) {
    steps.crm_skipped = { ok: true, detail: "not a rich persona" };
    return true;
  }

  let allOk = true;

  const unique = Date.now() % 1_000_000;
  const clientRes = await apiCall(baseUrl, session, persona, {
    id: "client",
    method: "POST",
    path: "/api/dashboard/clients",
    body: {
      name: `CRM Client ${persona.index}-${unique}`,
      phone: `+9476${String(persona.index * 1000 + unique).padStart(7, "0").slice(-7)}`,
      email: `crm-${persona.index}-${unique}@dinaya.test`,
    },
    expectedStatus: () => 201,
  });
  steps.crm_createClient = {
    ok: clientRes.status === 201,
    detail: `HTTP ${clientRes.status}`,
  };
  if (clientRes.status !== 201) allOk = false;

  const listRes = await apiCall(baseUrl, session, persona, {
    id: "bookings",
    method: "GET",
    path: "/api/dashboard/bookings",
    expectedStatus: () => 200,
  });
  let hasBooking = false;
  if (listRes.status === 200) {
    try {
      const rows = JSON.parse(listRes.body) as { rows?: unknown[] } | unknown[];
      const count = Array.isArray(rows) ? rows.length : (rows as { rows?: unknown[] }).rows?.length ?? 0;
      hasBooking = count > 0;
    } catch {
      hasBooking = false;
    }
  }
  steps.crm_listBookings = {
    ok: listRes.status === 200 && (bookingId ? hasBooking : true),
    detail: bookingId ? (hasBooking ? "has rows" : "empty list") : `HTTP ${listRes.status}`,
  };
  if (!steps.crm_listBookings.ok) allOk = false;

  if (bookingId) {
    const patchRes = await fetch(`${baseUrl}/api/dashboard/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        Cookie: session,
        "Content-Type": "application/json",
        ...personaHeaders(persona),
      },
      body: JSON.stringify({ status: "confirmed" }),
    });
    steps.crm_confirmBooking = {
      ok: patchRes.status === 200,
      detail: `HTTP ${patchRes.status}`,
    };
    if (patchRes.status !== 200) allOk = false;
  }

  if (persona.clientId) {
    const noteRes = await fetch(`${baseUrl}/api/dashboard/clients/${persona.clientId}/notes`, {
      method: "POST",
      headers: {
        Cookie: session,
        "Content-Type": "application/json",
        ...personaHeaders(persona),
      },
      body: JSON.stringify({ body: "Persona seed note" }),
    });
    steps.crm_clientNote = {
      ok: noteRes.status === 201,
      detail: `HTTP ${noteRes.status}`,
    };
    if (noteRes.status !== 201) allOk = false;
  }

  return allOk;
}

async function runGrowthProbes(
  baseUrl: string,
  session: string,
  persona: PersonaRecord,
  steps: Record<string, StepResult>,
): Promise<boolean> {
  if (persona.plan !== "max") {
    steps.growth_skipped = { ok: true, detail: `plan ${persona.plan}` };
    return true;
  }

  let allOk = true;

  const runs = await apiCall(baseUrl, session, persona, {
    id: "runs",
    method: "GET",
    path: "/api/dashboard/ai/runs",
    expectedStatus: () => 200,
  });
  steps.growth_aiRuns = { ok: runs.status === 200, detail: `HTTP ${runs.status}` };
  if (runs.status !== 200) allOk = false;

  if (persona.reviewId) {
    const replyRes = await fetch(`${baseUrl}/api/dashboard/reviews/${persona.reviewId}/generate-reply`, {
      method: "POST",
      headers: { Cookie: session, ...personaHeaders(persona) },
    });
    steps.growth_reviewAi = {
      ok: replyRes.status === 200 || replyRes.status === 503 || replyRes.status === 429,
      detail: `HTTP ${replyRes.status}`,
    };
    if (!steps.growth_reviewAi.ok) allOk = false;
  }

  const voice = await apiCall(baseUrl, session, persona, {
    id: "voice",
    method: "GET",
    path: "/api/dashboard/voice-receptionist",
    expectedStatus: () => 200,
  });
  let voiceAvailable = false;
  try {
    voiceAvailable = (JSON.parse(voice.body) as { available?: boolean }).available === false;
  } catch {
    voiceAvailable = false;
  }
  steps.growth_voiceRollout = {
    ok: voice.status === 200 && voiceAvailable,
    detail: voiceAvailable ? "rollout closed" : voice.body.slice(0, 80),
  };
  if (!steps.growth_voiceRollout.ok) allOk = false;

  return allOk;
}

async function runPersonaJourney(
  baseUrl: string,
  persona: PersonaRecord,
  phases: Set<Phase>,
): Promise<JourneyResult> {
  const steps: Record<string, StepResult> = {};
  let session: string | null = null;
  let bookingId: string | undefined;

  try {
    if (phases.has("core")) {
      const core = await runCoreFunnel(baseUrl, persona, steps);
      session = core.session;
      bookingId = core.bookingId;
    } else {
      session = await signIn(baseUrl, persona);
      steps.core_skipped = { ok: Boolean(session), detail: session ? undefined : "sign-in failed" };
    }

    if (!session) {
      return { index: persona.index, slug: persona.slug, plan: persona.plan, ok: false, steps };
    }

    if (phases.has("reads")) {
      const ungated = await runApiProbes(baseUrl, session, persona, UNGATED_READ_PROBES, "read", steps);
      const pro = await runApiProbes(baseUrl, session, persona, PRO_READ_PROBES, "read", steps);
      const growth = await runApiProbes(baseUrl, session, persona, GROWTH_READ_PROBES, "read", steps);
      steps.phase_reads = { ok: ungated && pro && growth };
    }

    if (phases.has("gates")) {
      const gates = await runApiProbes(baseUrl, session, persona, NEGATIVE_POST_PROBES, "gate", steps);
      steps.phase_gates = { ok: gates };
    }

    if (phases.has("pages")) {
      const pages = await runDashboardPages(baseUrl, session, persona, steps);
      steps.phase_pages = { ok: pages };
    }

    if (phases.has("limits")) {
      const limits = await runLimitStress(baseUrl, session, persona, steps);
      steps.phase_limits = { ok: limits };
    }

    if (phases.has("crm")) {
      const crm = await runCrmLifecycle(baseUrl, session, persona, bookingId, steps);
      steps.phase_crm = { ok: crm };
    }

    if (phases.has("growth")) {
      const growth = await runGrowthProbes(baseUrl, session, persona, steps);
      steps.phase_growth = { ok: growth };
    }
  } catch (error) {
    steps.fatal = { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }

  const failedSteps = Object.entries(steps).filter(([, v]) => !v.ok);
  return {
    index: persona.index,
    slug: persona.slug,
    plan: persona.plan,
    ok: failedSteps.length === 0,
    steps,
  };
}

async function main() {
  if (!fs.existsSync(FIXTURE_PATH)) {
    console.error(`Missing ${FIXTURE_PATH} — run: npm run seed:personas`);
    process.exit(1);
  }

  const { personas } = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")) as { personas: PersonaRecord[] };
  const { sample, phases } = parseArgs();
  const list =
    sample && sample < personas.length
      ? personas.filter((_, i) => i % Math.ceil(personas.length / sample) === 0).slice(0, sample)
      : personas;

  const baseUrl = DEFAULT_BASE.replace(/\/$/, "");
  console.log(`Running ${list.length} persona journeys against ${baseUrl}`);
  console.log(`Phases: ${[...phases].join(", ")}\n`);

  const results: JourneyResult[] = [];
  for (let offset = 0; offset < list.length; offset += CONCURRENCY) {
    const chunk = list.slice(offset, offset + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((persona) => runPersonaJourney(baseUrl, persona, phases)),
    );
    results.push(...chunkResults);
    const done = Math.min(offset + CONCURRENCY, list.length);
    const passed = results.filter((r) => r.ok).length;
    console.log(`Progress ${done}/${list.length} — ${passed} passed`);
  }

  const failed = results.filter((r) => !r.ok);
  const reportPath = path.join(process.cwd(), "e2e/fixtures/persona-journey-report.json");
  const byPhase: Record<string, number> = {};
  for (const row of failed) {
    for (const [key, val] of Object.entries(row.steps)) {
      if (!val.ok) byPhase[key] = (byPhase[key] ?? 0) + 1;
    }
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        baseUrl,
        phases: [...phases],
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        failuresByStep: byPhase,
        failures: failed.slice(0, 50),
      },
      null,
      2,
    ),
  );

  console.log(`\nResults: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Report: ${reportPath}`);

  if (failed.length > 0) {
    console.log("\nTop failure steps:", Object.entries(byPhase).sort((a, b) => b[1] - a[1]).slice(0, 10));
    console.log("\nFirst failures:");
    for (const row of failed.slice(0, 5)) {
      const bad = Object.entries(row.steps).filter(([, v]) => !v.ok);
      console.log(`- ${row.slug} (${row.plan}):`, Object.fromEntries(bad));
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
