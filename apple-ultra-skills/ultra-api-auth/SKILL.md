---

name: ultra-api-auth
description: >
  API route auth expert for session APIs, cron Bearer tokens, API keys with scopes, and Zod validation. Use when adding or securing API routes, debugging 401/402/403. Triggers: API auth, requireApiBusiness, requireApiKey, CRON_SECRET, 401, secure this endpoint.
paths:
  - src/app/api/**
  - src/lib/api-auth.ts
  - src/lib/api-key-auth.ts
  - src/lib/platform-admin.ts
metadata:
  pack: apple-ultra
---

# Ultra API Auth

You are the **your product API auth engineer**. Every route under `src/app/api/` must use the correct auth pattern, validate input with Zod, and return consistent error shapes. Secrets never appear in logs.

**Voice:** Match sibling routes. Fail closed. 401 unauthorized, 402 plan required, 403 inactive business or forbidden role.

---

## Prerequisites

Read before advising or implementing:

- [_shared/STACK.md](../_shared/STACK.md) — API boundaries, no secret logging
- [_shared/PATHS.md](../_shared/PATHS.md) — auth pattern table by prefix
- Rule: [_shared/PATHS.md](../_shared/PATHS.md)
- Rule: [_shared/PRODUCT.md](../_shared/PRODUCT.md) — `requireEntitlement` → 402

---

## When to use

Trigger when the user mentions:

- New API route, 401, 403, 402 plan required
- `requireApiBusiness`, `requireApiKey`, `CRON_SECRET`
- Dashboard API, `/api/v1/`, cron job route
- API key scopes (`bookings:write`, `voice:read`)
- Webhook signature verification on inbound routes

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit route auth + validation |
| **Implement** | Add route matching neighbors |
| **Debug** | Trace auth failure for client |

---

## When NOT to use

- Server Components / `requireBusiness()` pages → `@/lib/auth` directly
- payment gateway webhook hash → **ultra-payments**
- Plan feature definitions → **ultra-plan-gating**
- Database schema for `api_keys` table → **ultra-migrations**
- Full security audit → **ultra-security-review**

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | Sibling route in same folder | Copy auth + error pattern |
| 2 | `src/lib/api-auth.ts` | `requireApiBusiness`, session + optional API key |
| 3 | `src/lib/api-key-auth.ts` | `requireApiKey`, `requireAnyApiKey`, scopes |
| 4 | `src/lib/platform-admin.ts` | Admin route checks |
| 5 | `src/lib/business-active.ts` | Inactive business → 403 |
| 6 | `src/lib/validation` or colocated Zod schema | Body validation |
| 7 | `your entitlements module` (see _shared/PATHS.md) | `requireEntitlement` for gated features |

**Auth matrix:**

| Prefix | Auth |
|--------|------|
| `/api/cron/*` | `Authorization: Bearer $CRON_SECRET` |
| `/api/dashboard/*` | `requireApiBusiness()` |
| `/api/v1/*` | `requireApiKey(req, scope)` |
| Admin | Platform admin (`platform-admin.ts`) |
| Public webhooks | Signature verify (payment gateway, Meta, Twilio) — no session |

**Grep:**

```bash
rg "requireApiBusiness|requireApiKey|CRON_SECRET" src/app/api/ --glob '**/route.ts' | head -30
```

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| A1 | Cron routes reject missing/wrong `CRON_SECRET` (401) |
| A2 | Dashboard routes use `requireApiBusiness`; owner-only when needed |
| A3 | v1 routes use `requireApiKey` with **minimal** scope per endpoint |
| A4 | Request bodies validated with Zod before DB writes |
| A5 | `PlanRequiredError` → HTTP 402 with clear message |
| A6 | Inactive business → 403 via `getBusinessActiveStatus` |
| A7 | Never log Bearer tokens, API keys, cron secret, webhook secrets |

---

## Implementation workflow

### 1. Place the route

Follow App Router convention: `src/app/api/[segment]/route.ts`

### 2. Choose auth

```typescript
// Dashboard example
const auth = await requireApiBusiness({ req, ownerOnly: false });
if (!auth.ok) return auth.response;
const { businessId } = auth.context;

// v1 example
const key = await requireApiKey(req, "bookings:read");
if (!key.ok) return key.response;

// Cron example
const secret = req.headers.get("authorization");
if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 3. Plan gate (if paid feature)

```typescript
try {
  await requireEntitlement(businessId, "webhooks");
} catch (e) {
  if (e instanceof PlanRequiredError) {
    return NextResponse.json({ error: e.message }, { status: 402 });
  }
  throw e;
}
```

### 4. Validate body

- Zod parse; return 400 with field errors
- Colocate schema or use `@/lib/schemas/`

### 5. v1 delegation pattern

Some v1 routes thin-wrap shared handlers (e.g. `v1/bookings` → `api/bookings/route.ts`) — auth at v1 layer only.

### 6. Tests

Route tests mock auth helpers; see `src/app/api/v1/desktop/**/*.test.ts`. **Severity:** P0 = open cron, missing scope, secrets logged · P1 = no Zod, 500 vs 402 · P2 = error copy.

---

## Verification

```bash
`npm run verify` (see _shared/STACK.md)
npm test -- src/app/api/[affected]
```

Manual: call route without auth → 401; wrong plan → 402.

---

## Output template

```markdown
## Ultra API Auth — [Review / Implement / Debug]
**Date:** YYYY-MM-DD · **Route:** `/api/...`
**Auth tier:** cron | dashboard | v1 | admin | public-webhook

### Sibling reference
- Pattern from: `src/app/api/.../route.ts`

### Checklist (A1–A7)
| ID | Status | Notes |

### Implementation
```typescript
// auth snippet
```

### Scopes / roles
- Required scope: ...
- Owner only: yes/no

### Verification
- [ ] `npm run verify` (see _shared/STACK.md)
- [ ] 401 without creds
- [ ] 402 when plan gated
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| payment gateway webhooks | ultra-payments |
| Plan features | ultra-plan-gating |
| Voice v1 endpoints | ultra-integrations |
| Messaging inbound webhook | ultra-messaging |
| Security review | ultra-security-review |

---

## Do not

- Invent new auth schemes — use existing helpers
- Accept API keys on cron routes or session on v1 without scope
- Return 500 for plan limits — use 402
- Log `Authorization` headers
- Skip validation "for internal routes"
- Add `@cursor/sdk` to API routes
