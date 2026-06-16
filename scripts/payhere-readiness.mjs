#!/usr/bin/env node

import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
for (const file of [".env.local", ".env"]) {
  const envPath = path.join(cwd, file);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const args = new Set(process.argv.slice(2));
const skipNetwork = args.has("--skip-network");
const allowLocal = args.has("--allow-local");
const forceSandbox = args.has("--sandbox");
const forceLive = args.has("--live");

if (forceSandbox && forceLive) {
  console.error("Use only one of --sandbox or --live.");
  process.exit(1);
}

const results = [];

function add(status, title, detail) {
  results.push({ status, title, detail });
}

function hasEnv(name) {
  return Boolean(process.env[name]?.trim());
}

function envStatus(name, { required = true, minLength = 1 } = {}) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    add(required ? "fail" : "warn", `${name} is ${required ? "required" : "not set"}`, required ? "Set it in Vercel/staging env before testing PayHere." : "Only needed for the related optional flow.");
    return;
  }
  if (value.length < minLength) {
    add("warn", `${name} looks short`, "It is set, but shorter than expected. Verify it was not pasted incorrectly.");
    return;
  }
  add("pass", `${name} is set`, "Value hidden.");
}

function parseUrlEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    add("fail", `${name} is required`, "Set it to the public Dinaya app origin.");
    return null;
  }
  try {
    const url = new URL(value);
    add("pass", `${name} parses`, url.origin);
    return url;
  } catch {
    add("fail", `${name} is invalid`, "Use a full URL such as https://dinaya.lk.");
    return null;
  }
}

function isLocalHost(url) {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

async function fetchStatus(url, expected) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "Dinaya-PayHere-Readiness/1.0" },
    });
    return expected(res);
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "request_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function modeFromEnv() {
  if (forceSandbox) return "sandbox";
  if (forceLive) return "live";
  const value = process.env.PAYHERE_SANDBOX?.trim();
  if (value === "true") return "sandbox";
  if (value === "false") return "live";
  add("fail", "PAYHERE_SANDBOX must be explicit", "Set PAYHERE_SANDBOX=true for sandbox or false for production.");
  return "unknown";
}

async function main() {
  console.log("Dinaya PayHere readiness check");
  console.log("Secrets are checked by presence only and are never printed.\n");

  const mode = modeFromEnv();
  if (mode !== "unknown") {
    add("pass", "PayHere mode selected", mode);
  }

  envStatus("SECRET_ENCRYPTION_KEY", { minLength: 24 });
  envStatus("DINAYA_PAYHERE_MERCHANT_ID");
  envStatus("DINAYA_PAYHERE_MERCHANT_SECRET", { minLength: 8 });
  envStatus("DINAYA_PAYHERE_APP_ID", { required: false });
  envStatus("DINAYA_PAYHERE_APP_SECRET", { required: false });

  const appUrl = parseUrlEnv("NEXT_PUBLIC_APP_URL");
  const authUrl = parseUrlEnv("AUTH_URL");

  if (appUrl) {
    if (appUrl.protocol !== "https:" && !allowLocal) {
      add("fail", "NEXT_PUBLIC_APP_URL must be HTTPS", "Use a public HTTPS URL for PayHere notify_url and return_url testing.");
    }
    if (isLocalHost(appUrl) && !allowLocal) {
      add("fail", "NEXT_PUBLIC_APP_URL cannot be localhost for PayHere callbacks", "Deploy to staging or use a public tunnel, then update NEXT_PUBLIC_APP_URL.");
    }
  }

  if (appUrl && authUrl && appUrl.origin !== authUrl.origin) {
    add("warn", "AUTH_URL and NEXT_PUBLIC_APP_URL differ", `${authUrl.origin} vs ${appUrl.origin}. Use the same canonical origin for production.`);
  }

  if (mode === "live" && appUrl?.hostname.endsWith("vercel.app")) {
    add("warn", "Live mode is using a vercel.app host", "Confirm PayHere live domain approval matches this host, or switch to https://dinaya.lk.");
  }

  if (skipNetwork) {
    add("warn", "Network checks skipped", "Run without --skip-network before a real sandbox/live test.");
  } else {
    const payhereBase = mode === "live" ? "https://www.payhere.lk/" : "https://sandbox.payhere.lk/";
    const payhere = await fetchStatus(payhereBase, (res) => ({
      ok: res.status < 500 && res.status !== 0,
      detail: `HTTP ${res.status}`,
    }));
    add(payhere.ok ? "pass" : "fail", `PayHere ${mode === "live" ? "live" : "sandbox"} endpoint reachable`, payhere.detail);

    if (appUrl) {
      const app = await fetchStatus(appUrl.origin, (res) => ({
        ok: res.status < 500 && res.status !== 0,
        detail: `HTTP ${res.status}`,
      }));
      add(app.ok ? "pass" : "fail", "Dinaya app origin reachable", app.detail);

      const statusUrl = new URL("/api/bookings/status", appUrl.origin);
      const statusRoute = await fetchStatus(statusUrl, (res) => ({
        ok: res.status !== 404 && res.status < 500,
        detail: `HTTP ${res.status}; expected 400 without query params on current builds`,
      }));
      add(statusRoute.ok ? "pass" : "fail", "Booking payment status route reachable", statusRoute.detail);
    }
  }

  if (!hasEnv("DINAYA_PAYHERE_APP_ID") || !hasEnv("DINAYA_PAYHERE_APP_SECRET")) {
    add("warn", "Subscription Manager API not fully configured", "Checkout can still work, but dashboard cancel/retry needs PayHere Business App credentials.");
  }

  const counts = { pass: 0, warn: 0, fail: 0 };
  for (const result of results) counts[result.status] += 1;

  for (const result of results) {
    const label = result.status === "pass" ? "PASS" : result.status === "warn" ? "WARN" : "FAIL";
    console.log(`[${label}] ${result.title}${result.detail ? ` - ${result.detail}` : ""}`);
  }

  console.log(`\nSummary: ${counts.pass} pass, ${counts.warn} warn, ${counts.fail} fail`);
  console.log("\nStill manual: create a real paid sandbox booking, use a PayHere test card, and verify the webhook moves the booking to confirmed.");

  if (counts.fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
