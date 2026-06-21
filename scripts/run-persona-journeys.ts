/**
 * Run API-level Dinaya journeys for all seeded personas.
 *
 * Usage:
 *   E2E_DISABLE_RATE_LIMIT=true npx tsx scripts/run-persona-journeys.ts
 *   BASE_URL=http://127.0.0.1:3001 npx tsx scripts/run-persona-journeys.ts --sample 50
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { addDays, format } from "date-fns";
import type { PersonaRecord } from "./lib/persona-seed-core";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const FIXTURE_PATH = path.join(process.cwd(), "e2e/fixtures/personas.json");
const DEFAULT_BASE = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const CONCURRENCY = 8;

type JourneyResult = {
  index: number;
  slug: string;
  plan: string;
  ok: boolean;
  steps: Record<string, { ok: boolean; detail?: string }>;
};

function parseArgs() {
  const args = process.argv.slice(2);
  let sample: number | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sample" && args[i + 1]) sample = Number(args[++i]);
  }
  return { sample };
}

function nextBookableDate(): string {
  const candidate = addDays(new Date(), 1);
  while (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return format(candidate, "yyyy-MM-dd");
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

function personaHeaders(persona: PersonaRecord): HeadersInit {
  return {
    "X-Forwarded-For": `10.200.${Math.floor(persona.index / 256)}.${persona.index % 256}`,
  };
}

async function runPersonaJourney(baseUrl: string, persona: PersonaRecord): Promise<JourneyResult> {
  const steps: JourneyResult["steps"] = {};
  const date = nextBookableDate();
  const headers = personaHeaders(persona);

  try {
    const bookRes = await fetch(`${baseUrl}/book/${persona.slug}`, { headers });
    const bookHtml = await bookRes.text();
    steps.publicPage = {
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
    steps.availability = {
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
        const bookingId = bookingJson.bookingId ?? bookingJson.id;
        return { bookingRes, bookingJson, bookingId };
      };

      let booked = await tryBook(slot);
      if (!booked.bookingId && slots.length > 1) {
        for (const fallback of slots) {
          if (fallback.startUtc === slot.startUtc) continue;
          booked = await tryBook(fallback);
          if (booked.bookingId) break;
        }
      }

      steps.booking = {
        ok: booked.bookingRes.ok && Boolean(booked.bookingId),
        detail: booked.bookingRes.ok
          ? booked.bookingId
          : booked.bookingJson.error ?? `HTTP ${booked.bookingRes.status}`,
      };
    } else {
      steps.booking = { ok: false, detail: "no slot" };
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
      steps.dashboard = {
        ok: dashRes.status === 200 || dashRes.status === 307 || dashRes.status === 302,
        detail: `HTTP ${dashRes.status}`,
      };
    } else {
      steps.dashboard = { ok: false, detail: "sign-in failed" };
    }
  } catch (error) {
    steps.error = { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }

  const ok =
    steps.publicPage?.ok &&
    steps.availability?.ok &&
    steps.booking?.ok &&
    steps.dashboard?.ok;
  return { index: persona.index, slug: persona.slug, plan: persona.plan, ok, steps };
}

async function main() {
  if (!fs.existsSync(FIXTURE_PATH)) {
    console.error(`Missing ${FIXTURE_PATH} — run: npx tsx scripts/seed-e2e-personas.ts`);
    process.exit(1);
  }

  const { personas } = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")) as { personas: PersonaRecord[] };
  const { sample } = parseArgs();
  const list =
    sample && sample < personas.length
      ? personas.filter((_, i) => i % Math.ceil(personas.length / sample) === 0).slice(0, sample)
      : personas;

  const baseUrl = DEFAULT_BASE.replace(/\/$/, "");
  console.log(`Running ${list.length} persona journeys against ${baseUrl}\n`);

  const results: JourneyResult[] = [];
  for (let offset = 0; offset < list.length; offset += CONCURRENCY) {
    const chunk = list.slice(offset, offset + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map((persona) => runPersonaJourney(baseUrl, persona)));
    results.push(...chunkResults);
    const done = Math.min(offset + CONCURRENCY, list.length);
    const passed = results.filter((r) => r.ok).length;
    console.log(`Progress ${done}/${list.length} — ${passed} passed`);
  }

  const failed = results.filter((r) => !r.ok);
  const reportPath = path.join(process.cwd(), "e2e/fixtures/persona-journey-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        baseUrl,
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        failures: failed.slice(0, 50),
      },
      null,
      2,
    ),
  );

  console.log(`\nResults: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Report: ${reportPath}`);

  if (failed.length > 0) {
    console.log("\nFirst failures:");
    for (const row of failed.slice(0, 10)) {
      console.log(`- ${row.slug} (${row.plan}):`, row.steps);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
