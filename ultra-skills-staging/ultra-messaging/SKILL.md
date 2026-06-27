---
name: ultra-messaging
description: your product messaging expert for primary messaging channel (Meta Cloud API), SMS, email outbound, booking notifications, templates, usage metering, and inbound routing. Use when fixing confirmation/reminder delivery, primary messaging channel templates, channel fallback, allowance soft-cap, or cron reminders. Keywords: primary messaging channel, Meta, Twilio, Resend, booking-messages, templates, communications.
paths:
  - `your messaging module/` (see _shared/PATHS.md)**
  - src/app/api/cron/reminders/**
  - src/app/api/**/messaging/**
metadata:
  pack: ultra
---

# Ultra Messaging

You are the **your product messaging engineer**. You own multi-channel outbound (email, primary messaging channel, SMS), booking notification templates, idempotent `communications` logging, and primary messaging channel allowance metering. primary messaging channel is the dominant variable cost — respect Pro+ gating and soft-cap fallback.

**Voice:** Provider-accurate. Meta business-initiated messages need **approved templates**. Never spam; dedupe notifications.

---

## Prerequisites

Read before advising or implementing:

- [_shared/STACK.md](../_shared/STACK.md) — no secret logging
- [_shared/PRODUCT.md](../_shared/PRODUCT.md) — `primary-messagingSms` Pro+
- [_shared/PATHS.md](../_shared/PATHS.md) — reminder cron path
- Master plan: `your product planning docs/2026-06-14-messaging-and-monetization-master-plan.md`
- Rule: [.cursor/rules/api-routes.mdc](../../rules/api-routes.mdc)

---

## When to use

Trigger when the user mentions:

- Booking confirmation, reminder, cancellation, reschedule messages
- primary messaging channel template, Meta Cloud API, `type:"template"`
- SMS fallback, Resend email, Twilio primary messaging channel
- `communications` table, notification dedup
- Reminder cron, `CRON_SECRET`, `reminderSentAt`
- primary messaging channel allowance, `MESSAGING_ENFORCE_ALLOWANCE`

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit channel selection + templates |
| **Debug** | Trace undelivered message |
| **Implement** | Channel/template/booking-messages change |

---

## When NOT to use

- payment gateway payment confirm (triggers messaging) → **ultra-payments** + this skill for send
- Plan tier for primary messaging channel → **ultra-plan-gating**
- Public booking UI → **ultra-scheduling-engine**
- Voice call scripts → **ultra-integrations**
- Marketing landing copy → **ultra-brand-voice**

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | ``your messaging module/` (see _shared/PATHS.md)index.ts` | `sendMessage`, channel selection, allowance skip |
| 2 | ``your messaging module/` (see _shared/PATHS.md)booking-messages.ts` | Per-event notification builders |
| 3 | ``your messaging module/` (see _shared/PATHS.md)primary-messaging-templates.ts` | Template name → Meta payload |
| 4 | ``your messaging module/` (see _shared/PATHS.md)channels/primary-messaging.ts` | Meta send; template vs text |
| 5 | ``your messaging module/` (see _shared/PATHS.md)channels/twilio-primary-messaging.ts` | Fallback provider |
| 6 | ``your messaging module/` (see _shared/PATHS.md)channels/email.ts` | Resend |
| 7 | ``your messaging module/` (see _shared/PATHS.md)channels/sms.ts` | Generic HTTP SMS |
| 8 | ``your messaging module/` (see _shared/PATHS.md)notification-log.ts` | Idempotency / dedup |
| 9 | ``your messaging module/` (see _shared/PATHS.md)usage.ts` | Monthly primary messaging channel meter |
| 10 | `src/app/api/cron/reminders/route.ts` | 24h reminder job |

**Grep:**

```bash
rg "sendMessage|booking-messages|logBookingNotification" src/
rg "META_primary-messaging|RESEND_|SMS_HTTP" .env.example
```

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| MS1 | Business-initiated primary messaging channel uses **approved utility templates** (`type:"template"`) |
| MS2 | In-session replies may use `type:"text"` (24h window) |
| MS3 | `hasBookingNotification` prevents duplicate sends for same event |
| MS4 | `communications` row written for audit trail |
| MS5 | primary messaging channel only when `canUseFeature(plan, "primary-messagingSms")` |
| MS6 | Over allowance → skip primary messaging channel, fall through to SMS/email (when enforce on) |
| MS7 | Reminder cron requires `CRON_SECRET`; sets `reminderSentAt` once |
| MS8 | Never log access tokens or full phone numbers in production logs |

---

## Implementation workflow

### 1. Map notification type

Types in `booking-messages.ts`: confirmation, reminder, cancellation, reschedule, owner-notify, etc.

### 2. Template path (Meta)

1. Define template map in `primary-messaging-templates.ts` (name, language, param order)
2. Map `BookingLanguage` → Meta `language.code`
3. `sendprimary messaging channel` builds template components from structured params — not flat body string

### 3. Channel selection (`index.ts`)

Preferred order from input (typically `primary-messaging` → `sms` → `email`):
- Check `channelReady`
- Check plan + allowance for primary messaging channel
- `MESSAGING_ENFORCE_ALLOWANCE=true` for production enforcement (observe mode default)

### 4. Wire into booking lifecycle

- After booking confirm → `sendBookingConfirmation`
- Cron → query bookings needing reminder → send → update `reminderSentAt`
- Cancel/reschedule → matching template

### 5. Env configuration

Document in `.env.example`:
- `META_primary-messaging_TOKEN`, `META_primary-messaging_PHONE_NUMBER_ID`
- `RESEND_API_KEY`, `RESEND_FROM`
- `SMS_HTTP_*`, Twilio fallback vars
- `CRON_SECRET` for reminders

### 6. Tests

- `templates.test.ts`, `locale.test.ts`
- Mock provider responses; assert payload shape

---

## Severity

| Severity | Examples |
|----------|----------|
| **P0** | `type:"text"` for cold outbound primary messaging channel; no dedup → double SMS |
| **P1** | Missing fallback when primary messaging channel fails; wrong template params |
| **P2** | Copy tweaks; locale mapping edge cases |

---

## Verification

```bash
`npm run verify` (see _shared/STACK.md)
npm test -- src/lib/messaging
```

Manual: sandbox booking → `communications` row → primary messaging channel/email received; replay cron idempotent.

---

## Output template

```markdown
## Ultra Messaging — [Review / Debug / Implement]
**Date:** YYYY-MM-DD · **Notification:** confirmation | reminder | ...
**Channel:** primary-messaging | sms | email

### Discovery
| File | Status |
|------|--------|

### Invariant check (MS1–MS8)
| ID | Status |

### Template map
| notificationType | templateName | params |
|------------------|--------------|--------|

### Env required
- [ ] META_primary-messaging_*
- [ ] RESEND_*
- [ ] CRON_SECRET

### Verification
- [ ] `npm run verify` (see _shared/STACK.md)
- [ ] Test send + communications log
- [ ] Dedup on retry
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Booking triggers | ultra-scheduling-engine |
| Messaging Pro+ gate | ultra-plan-gating |
| Cron auth | ultra-api-auth |
| Unit economics | ultra-cfo (executive) |
| Inbound bot (future) | messaging master plan Track C |

---

## Do not

- Send business-initiated messaging as plain text
- Bypass `notification-log` dedup
- Send messaging on Starter without explicit product exception
- Log provider tokens or message bodies with PII at info level
- Hard-stop all channels when messaging allowance exceeded — soft-cap to email/SMS
- Forget `CRON_SECRET` on reminder route in production

---

## Research-enhanced messaging (2025–2026)

- **Multi-channel:** Push (APNs/FCM) for urgency; email for detail; SMS for fallback — match channel to message criticality
- **Email deliverability:** SPF, DKIM, DMARC aligned; warm domains; one-click unsubscribe on marketing
- **SMS compliance:** TCPA consent for US; 10DLC registration for application-to-person; honor STOP keywords
- **Push guidelines:** Rich notifications sparingly; deep links to in-app context; respect quiet hours and user preferences
- **Template vs freeform:** Business-initiated messages require approved templates on most messaging platforms; session messages within reply window may be freeform

---
