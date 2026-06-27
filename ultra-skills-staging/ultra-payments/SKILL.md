---
name: ultra-payments
description: Ultra Payments payments expert for local currency checkout, MD5 hash generation, redirect forms, subscription billing, and webhook verification. Use when integrating payment gateway, debugging payment failures, webhook signature mismatches, double-charge/idempotency, or booking/subscription checkout flows. Keywords: payment gateway, local currency, md5sig, notify_url, merchant_secret.
paths:
  - src/lib/payment-gateway.ts
  - src/lib/payment-gateway-webhook.ts
  - src/lib/payment-gateway-subscriptions.ts
  - src/lib/payments/providers/payment-gateway.ts
  - src/app/**/payment-gateway/**
  - src/app/api/webhooks/payment-gateway/**
metadata:
  pack: ultra
---

# Ultra Payments

You are the **Ultra Payments engineer**. You own local currency payment checkout, hash signing, redirect UX, and webhook idempotency for bookings and subscriptions. payment gateway is your market's dominant gateway — correctness and trust matter more than abstraction.

**Voice:** Security-first. Never log secrets. Every webhook handler must verify `md5sig` before side effects.

---

## Prerequisites

Read before advising or implementing:

- [_shared/STACK.md](../_shared/STACK.md) — never log PAYMENT_GATEWAY secrets
- [_shared/PATHS.md](../_shared/PATHS.md) — `/book/[slug]/pay`, webhook routes
- Rule: [.cursor/rules/api-routes.mdc](../../rules/api-routes.mdc) — webhook verification, idempotency
- Rule: [_shared/STACK.md](../../rules/stack-rules.mdc)

---

## When to use

Trigger when the user mentions:

- payment gateway checkout, hash, `md5sig`, merchant_id, notify_url
- Booking payment redirect, deposit, local currency amount formatting
- Webhook not confirming booking, duplicate payment, status_code
- Subscription billing via payment gateway (`payment-gateway-subscriptions`)
- `src/lib/payment-gateway.ts`, `payment gatewayRedirect`, `/api/webhooks/payment-gateway`

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit hash, redirect, webhook, idempotency |
| **Debug** | Trace failed payment or webhook mismatch |
| **Implement** | Minimal change in payment-gateway lib + route |

---

## When NOT to use

- Slot selection or availability → **ultra-plan-gating** / **ultra-scheduling-engine**
- PayPal or manual bank transfer flows → read `src/lib/payments/` providers
- Plan tier entitlements for payments feature → **ultra-plan-gating**
- Generic API auth → **ultra-api-auth**
- UI polish on pay page only → **apple-design-head**

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | `src/lib/payment-gateway.ts` | `generatepayment-gatewayHash`, `buildpayment-gatewayFormData`, `verifypayment-gatewayWebhook` |
| 2 | `src/lib/payment-gateway-webhook.ts` | Form field parsing, webhook processing |
| 3 | `src/lib/payment-gateway.test.ts` | Hash golden vectors |
| 4 | `src/app/api/webhooks/payment-gateway/route.ts` | Booking payment notify handler |
| 5 | `src/app/api/webhooks/payment-gateway-subscription/route.ts` | Subscription notify |
| 6 | `src/app/book/[slug]/pay/payment gatewayRedirect.tsx` | Client redirect to payment gateway |
| 7 | `src/app/book/[slug]/pay/page.tsx` | Pay step entry |
| 8 | `src/app/api/bookings/[id]/payment-gateway-checkout/route.ts` | Server checkout params |
| 9 | `src/lib/payments/providers/payment-gateway.ts` | Provider abstraction layer |
| 10 | `scripts/payment-gateway-readiness.mjs` | Env readiness check |

**Grep:**

```bash
rg "generatepayment-gatewayHash|verifypayment-gatewayWebhook|payment-gateway" src/ --glob '!*.test.ts'
rg "payment-gateway_|merchantSecret|md5sig" .env.example docs/
```

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| P1 | Checkout hash uses `amount.toFixed(2)`, currency `local currency`, hashed secret = MD5(merchantSecret) |
| P2 | Webhook verifies `md5sig` **before** updating booking/payment state |
| P3 | Webhook handlers are **idempotent** — duplicate notify must not double-confirm |
| P4 | `notify_url` points to production HTTPS route; reachable from payment gateway |
| P5 | Never log `merchantSecret`, raw webhook body with PII, or full hash inputs |
| P6 | Confirm modal / clear summary before external redirect (CH8 pattern) |
| P7 | Return URL lands on `/book/[slug]/confirmed` or pay return with poller |

---

## Implementation workflow

### 1. Classify payment type

- **Booking deposit/full pay** — order_id maps to booking; webhook confirms `pending` → `confirmed`
- **Subscription** — `payment-gateway-subscriptions.ts`; separate webhook route
- **Dashboard billing** — `/api/billing/subscribe`

### 2. Checkout path

1. Server builds params via `buildpayment-gatewayFormData`
2. `notifyUrl` = `${APP_URL}/api/webhooks/payment-gateway` (or subscription variant)
3. Client posts form to payment gateway sandbox or live URL
4. User returns via `return_url`; async notify is source of truth

### 3. Webhook path

1. Parse `FormData` with `parsepayment-gatewayWebhookFields`
2. `verifypayment-gatewayWebhook` — reject 401/400 on bad sig
3. Map `status_code` (2 = success per payment gateway docs)
4. Update booking/payment in transaction; check existing state first
5. Trigger messaging (`booking-messages`) after confirm

### 4. Amount handling

- Always local currency; two decimal places in hash string
- Match booking `amountLkr` stored at checkout creation time
- Reject amount mismatch between order and webhook

### 5. Local dev

- payment gateway sandbox credentials in `.env` (never commit)
- `scripts/payment-gateway-readiness.mjs` for env validation
- ngrok or similar for notify_url if testing webhooks locally

### 6. Tests

- Unit: `payment-gateway.test.ts`, `payment-gateway-webhook.test.ts`
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
`npm run verify` (see _shared/STACK.md)
npm test -- src/lib/payment-gateway src/lib/payment-gateway-webhook
```

Manual: sandbox checkout → webhook received → booking `confirmed` → no duplicate on replay.

---

## Output template

```markdown
## Ultra Payments — [Review / Debug / Implement]
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
1. `src/lib/payment-gateway.ts` — ...
2. `src/app/api/webhooks/payment-gateway/route.ts` — ...

### Verification
- [ ] `npm run verify` (see _shared/STACK.md)
- [ ] Sandbox webhook replay (idempotent)
- [ ] Hash unit tests pass
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Booking before pay | ultra-scheduling-engine |
| Post-payment messages | ultra-messaging |
| `payments` plan feature | ultra-plan-gating |
| Webhook route auth | ultra-api-auth |
| Security audit | ultra-security-review |

---

## Research-enhanced payments (2025–2026)

- **PCI-DSS (SaaS):** Never store full PAN, CVV, or magnetic-stripe data — use hosted checkout or tokenization (Stripe Elements, Adyen Drop-in, etc.)
- **3D Secure 2.0:** Issuer decides frictionless vs challenge; send rich device data; successful auth shifts fraud liability to issuer in most networks
- **Webhook idempotency:** Verify signature on raw body first; dedupe on provider event ID (not body hash); atomic claim-then-process; retain keys for retry window + margin
- **Reconciliation:** Match internal ledger ↔ PSP settlement on transaction ID; PSP batch ↔ bank deposit on payout ID; reconcile daily, not monthly

---

## Do not

- Log `merchantSecret`, `payment-gateway_*` env values, or full webhook payloads in production
- Update booking status on return_url alone — wait for verified notify (or explicit poll with care)
- Change hash algorithm without payment gateway doc alignment
- Store card data — payment gateway hosted checkout only
- Skip idempotency on webhook retries
- Use USD or wrong decimal formatting in hash input
