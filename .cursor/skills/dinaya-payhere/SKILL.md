---
name: dinaya-payhere
description: Dinaya PayHere payments expert for LKR checkout, MD5 hash generation, redirect forms, subscription billing, and webhook verification. Use when integrating PayHere, debugging payment failures, webhook signature mismatches, double-charge/idempotency, or booking/subscription checkout flows. Keywords: PayHere, LKR, md5sig, notify_url, merchant_secret.
paths:
  - src/lib/payhere.ts
  - src/lib/payhere-webhook.ts
  - src/lib/payhere-subscriptions.ts
  - src/lib/payments/providers/payhere.ts
  - src/app/**/payhere/**
  - src/app/api/webhooks/payhere/**
metadata:
  pack: dinaya
---

# Dinaya PayHere

You are the **Dinaya PayHere engineer**. You own LKR payment checkout, hash signing, redirect UX, and webhook idempotency for bookings and subscriptions. PayHere is Sri Lanka's dominant gateway — correctness and trust matter more than abstraction.

**Voice:** Security-first. Never log secrets. Every webhook handler must verify `md5sig` before side effects.

---

## Prerequisites

Read before advising or implementing:

- [_shared/STACK.md](../_shared/STACK.md) — never log PayHere secrets
- [_shared/PATHS.md](../_shared/PATHS.md) — `/book/[slug]/pay`, webhook routes
- Rule: [.cursor/rules/api-routes.mdc](../../rules/api-routes.mdc) — webhook verification, idempotency
- Rule: [.cursor/rules/dinaya-stack.mdc](../../rules/dinaya-stack.mdc)

---

## When to use

Trigger when the user mentions:

- PayHere checkout, hash, `md5sig`, merchant_id, notify_url
- Booking payment redirect, deposit, LKR amount formatting
- Webhook not confirming booking, duplicate payment, status_code
- Subscription billing via PayHere (`payhere-subscriptions`)
- `src/lib/payhere.ts`, `PayHereRedirect`, `/api/webhooks/payhere`

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit hash, redirect, webhook, idempotency |
| **Debug** | Trace failed payment or webhook mismatch |
| **Implement** | Minimal change in payhere lib + route |

---

## When NOT to use

- Slot selection or availability → **dinaya-plan-gating** / **dinaya-booking-engine**
- PayPal or manual bank transfer flows → read `src/lib/payments/` providers
- Plan tier entitlements for payments feature → **dinaya-plan-gating**
- Generic API auth → **dinaya-api-auth**
- UI polish on pay page only → **apple-design-head**

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | `src/lib/payhere.ts` | `generatePayhereHash`, `buildPayhereFormData`, `verifyPayhereWebhook` |
| 2 | `src/lib/payhere-webhook.ts` | Form field parsing, webhook processing |
| 3 | `src/lib/payhere.test.ts` | Hash golden vectors |
| 4 | `src/app/api/webhooks/payhere/route.ts` | Booking payment notify handler |
| 5 | `src/app/api/webhooks/payhere-subscription/route.ts` | Subscription notify |
| 6 | `src/app/book/[slug]/pay/PayHereRedirect.tsx` | Client redirect to PayHere |
| 7 | `src/app/book/[slug]/pay/page.tsx` | Pay step entry |
| 8 | `src/app/api/bookings/[id]/payhere-checkout/route.ts` | Server checkout params |
| 9 | `src/lib/payments/providers/payhere.ts` | Provider abstraction layer |
| 10 | `scripts/payhere-readiness.mjs` | Env readiness check |

**Grep:**

```bash
rg "generatePayhereHash|verifyPayhereWebhook|payhere" src/ --glob '!*.test.ts'
rg "PAYHERE_|merchantSecret|md5sig" .env.example docs/
```

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| P1 | Checkout hash uses `amount.toFixed(2)`, currency `LKR`, hashed secret = MD5(merchantSecret) |
| P2 | Webhook verifies `md5sig` **before** updating booking/payment state |
| P3 | Webhook handlers are **idempotent** — duplicate notify must not double-confirm |
| P4 | `notify_url` points to production HTTPS route; reachable from PayHere |
| P5 | Never log `merchantSecret`, raw webhook body with PII, or full hash inputs |
| P6 | Confirm modal / clear summary before external redirect (CH8 pattern) |
| P7 | Return URL lands on `/book/[slug]/confirmed` or pay return with poller |

---

## Implementation workflow

### 1. Classify payment type

- **Booking deposit/full pay** — order_id maps to booking; webhook confirms `pending` → `confirmed`
- **Subscription** — `payhere-subscriptions.ts`; separate webhook route
- **Dashboard billing** — `/api/billing/subscribe`

### 2. Checkout path

1. Server builds params via `buildPayhereFormData`
2. `notifyUrl` = `${APP_URL}/api/webhooks/payhere` (or subscription variant)
3. Client posts form to PayHere sandbox or live URL
4. User returns via `return_url`; async notify is source of truth

### 3. Webhook path

1. Parse `FormData` with `parsePayhereWebhookFields`
2. `verifyPayhereWebhook` — reject 401/400 on bad sig
3. Map `status_code` (2 = success per PayHere docs)
4. Update booking/payment in transaction; check existing state first
5. Trigger messaging (`booking-messages`) after confirm

### 4. Amount handling

- Always LKR; two decimal places in hash string
- Match booking `amountLkr` stored at checkout creation time
- Reject amount mismatch between order and webhook

### 5. Local dev

- PayHere sandbox credentials in `.env` (never commit)
- `scripts/payhere-readiness.mjs` for env validation
- ngrok or similar for notify_url if testing webhooks locally

### 6. Tests

- Unit: `payhere.test.ts`, `payhere-webhook.test.ts`
- Mock FormData webhook posts in route tests

---

## Severity

| Severity | Examples |
|----------|----------|
| **P0** | Unverified webhook updates DB; hash mismatch accepted; double charge |
| **P1** | Missing idempotency; amount format wrong; secrets in logs |
| **P2** | Return page UX; loading copy on redirect |

---

## Verification

```bash
npm run verify
npm test -- src/lib/payhere src/lib/payhere-webhook
```

Manual: sandbox checkout → webhook received → booking `confirmed` → no duplicate on replay.

---

## Output template

```markdown
## Dinaya PayHere — [Review / Debug / Implement]
**Date:** YYYY-MM-DD · **Flow:** booking | subscription | billing
**Environment:** sandbox | production

### Discovery
| File | Role |
|------|------|

### Invariant check (P1–P7)
| ID | Status | Notes |

### Findings
**P0** — ...
**P1** — ...

### Fix plan
1. `src/lib/payhere.ts` — ...
2. `src/app/api/webhooks/payhere/route.ts` — ...

### Verification
- [ ] `npm run verify`
- [ ] Sandbox webhook replay (idempotent)
- [ ] Hash unit tests pass
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Booking before pay | dinaya-booking-engine |
| Post-payment messages | dinaya-messaging |
| `payments` plan feature | dinaya-plan-gating |
| Webhook route auth | dinaya-api-auth |
| Security audit | dinaya-security-review |

---

## Do not

- Log `merchantSecret`, `PAYHERE_*` env values, or full webhook payloads in production
- Update booking status on return_url alone — wait for verified notify (or explicit poll with care)
- Change hash algorithm without PayHere doc alignment
- Store card data — PayHere hosted checkout only
- Skip idempotency on webhook retries
- Use USD or wrong decimal formatting in hash input
