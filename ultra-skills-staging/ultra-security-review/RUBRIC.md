# Ultra Security Review — Rubric Reference

Companion to `SKILL.md`. Scored ledger for deep security audits.

**Scoring:** 0 = fail · 1 = partial · 2 = pass

**Target:** **≥41/48 (85%)** on full ledger for ship candidate.

---

## Authentication ledger (12 items · 24 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| S1 | Cron protection | No auth | Weak/shared secret in code | Bearer `CRON_SECRET`; 401 on mismatch |
| S2 | Cron secret unset | Accepts all if empty | Warns only | 503 when unset in production paths |
| S3 | Dashboard session | Missing on route | Some routes open | `requireApiBusiness()` everywhere |
| S4 | v1 API keys | No key required | Key but no scope | `requireApiKey(req, scope)` per operation |
| S5 | Scope enforcement | Any key works | Partial scopes | Write vs read scopes enforced |
| S6 | IDOR — businessId | User A accesses B | Partial checks | All queries scoped to session business |
| S7 | Owner-only actions | Staff can billing/delete | Inconsistent | `requireOwner()` where required |
| S8 | Admin separation | Tenant APIs callable as admin conflation | Partial | `/admin` isolated auth |
| S9 | Public booking | Leaks admin data | Over-exposes PII | Minimal public DTO |
| S10 | Embed mode | Parent page can steal session | Partial sandbox | No credentials in embed |
| S11 | Server components | Data fetch without auth | Mixed | `requireBusiness()` on sensitive pages |
| S12 | Plan gate bypass | Pro API without `requireEntitlement` | UI only gated | API returns 402 on `PlanRequiredError` |

---

## Secrets & logging ledger (12 items · 24 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| K1 | payment gateway merchant secret | In source | Env var but logged | `process.env` only; never logged |
| K2 | payment gateway app secret | In source | Partial | Env only |
| K3 | CRON_SECRET | Hardcoded | Env without validation | Env + constant-time compare pattern |
| K4 | Webhook verify tokens | Committed | Env | Env + rotation documented |
| K5 | API key storage | Plaintext in DB | Hashed partial | Hashed; prefix display only |
| K6 | console.log hygiene | Logs secrets/PII | Redacted partial | Structured logs; no sensitive fields |
| K7 | Error messages | Stack to client | Verbose internal | Generic client; detail server-only |
| K8 | .env gitignore | Committed secrets | Example only in repo | `.env*` ignored |
| K9 | Test fixtures | Real prod keys | Obvious fakes | `cron-test-secret` style only in tests |
| K10 | Client bundle | Secrets in `NEXT_PUBLIC_*` | Accidental expose | No secrets in public env |
| K11 | Cursor SDK boundary | In `src/app` | In lib | Dev-only `.cursor/` |
| K12 | Dependency audit | Known critical CVE ignored | Partial pin | Lockfile maintained |

---

## Webhook & payment ledger (fast path — 12 items)

| ID | 2 = Pass |
|----|----------|
| W1 | payment gateway hash verified before DB write |
| W2 | Invalid hash → 400; no partial state |
| W3 | Subscription webhook validates amount |
| W4 | Idempotent processing (duplicate event safe) |
| W5 | Outbound URL passes `isSafeWebhookDestination` |
| W6 | No SSRF to `localhost`, `169.254`, metadata IPs |
| W7 | messaging GET verify returns challenge only when token matches |
| W8 | Twilio/voice webhooks validate signature when configured |
| W9 | Webhook handlers don't trust client-supplied `businessId` without proof |
| W10 | Payment state transitions are forward-only (no downgrade to paid without proof) |
| W11 | Refund/cancel paths require same auth tier as create |
| W12 | Raw webhook bodies not stored in logs |

---

## data protection regulations & data ledger

| ID | Criterion | 2 = Pass |
|----|-----------|----------|
| P1 | Booking form fields | Required fields only |
| P2 | Marketing SMS/email | Explicit opt-in recorded |
| P3 | Consent copy | Clear purpose at collection |
| P4 | URL tokens | Opaque; scoped to one booking action |
| P5 | Token expiry | Reschedule/cancel links expire |
| P6 | Cross-border | Data stays in configured Neon region (documented) |
| P7 | Export/delete | Owner can access client data per product rules |
| P8 | Influencer/compliance | Marketing skill flags — not security code |

---

## Grep command reference

```bash
# Unauthenticated route handlers (manual triage)
rg 'export async function (GET|POST|PUT|PATCH|DELETE)' --glob 'src/app/api/**/*.ts' -A3 \
  | rg -v 'requireApi|CRON_SECRET|requireBusiness|requireOwner|requireApiKey'

# Missing cron check
for f in src/app/api/cron/*/route.ts; do
  rg -q 'CRON_SECRET' "$f" || echo "MISSING: $f"
done

# payment gateway without hash
rg 'payment-gateway' -i --glob 'src/app/api/**/*.ts' -l | xargs rg -L 'hash|verify|WEBHOOK'

# SSRF webhook destinations
rg 'isSafeWebhookDestination' --glob 'src/**/*.ts'

# PII in search params
rg 'searchParams\.get\(.(email|phone)' --glob 'src/**'
```

---

## Project-specific P0 catalog

| Scenario | Location pattern | Fix |
|----------|------------------|-----|
| Open cron | `src/app/api/cron/**` | Add Bearer check |
| Forged payment gateway | `webhooks/payment-gateway/**` | Verify hash via `payment-gateway-webhook` |
| Secret in diff | Any `.ts` | Move to env |
| IDOR booking | `businessId` from query | From session only |
| Pro feature free | dashboard API | `requireEntitlement(businessId, feature)` |
| PII in share URL | `book/**` links | Token path only |

---

## Pre-merge security checklist (copy into PR review)

- [ ] All new `/api/dashboard/*` call `requireApiBusiness()`
- [ ] All new `/api/v1/*` call `requireApiKey` with correct scope
- [ ] All new `/api/cron/*` validate `Bearer ${CRON_SECRET}`
- [ ] payment gateway changes verify hash before mutation
- [ ] No `console.log` of request bodies with PII
- [ ] Zod schema on POST/PATCH bodies
- [ ] DB queries include `businessId` from trusted session
- [ ] No secrets in PR diff
- [ ] Plan-gated features use `requireEntitlement` in API

---

## Handoff

| Result | Next |
|--------|------|
| SHIP | `ultra-pr-ship-review` — full merge |
| Payment P0 | `ultra-payments` — implement fix |
| New route pattern | `ultra-api-auth` — scaffold correctly |
