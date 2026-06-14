# Dinaya Messaging & Monetization — Master Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Dinaya's already-built messaging system live (WhatsApp via Meta Cloud API + email + SMS fallback), then protect unit economics with usage metering and a soft-cap/overage structure, then add an inbound WhatsApp bot that also reduces messaging cost via free 24h service windows.

**Current state (verified 2026-06-14):**
- ✅ Outbound multi-channel messaging is **code-complete** and wired into every booking flow (confirmation, 24h reminder cron, cancellation, reschedule, owner-notify). See [messaging/index.ts](../../../src/lib/messaging/index.ts), [booking-messages.ts](../../../src/lib/messaging/booking-messages.ts).
- ✅ Channels exist: email/Resend, WhatsApp/Meta + Twilio fallback, SMS/generic-HTTP. Idempotency, dedup, and `communications` logging all present.
- 🔴 **Blocker 1 — WhatsApp templates:** [channels/whatsapp.ts](../../../src/lib/messaging/channels/whatsapp.ts) sends `type:"text"`, which Meta rejects for business-initiated messages. Confirmations/reminders need approved **utility templates** (`type:"template"`).
- 🔴 **Blocker 2 — config:** locally only `RESEND_API_KEY` is set. `META_WHATSAPP_*`, `CRON_SECRET`, `SMS_HTTP_*` are unset (reminder cron 500s without `CRON_SECRET`).
- ⚠️ **Economic risk:** all paid plans have `bookingsPerMonth: null` (unlimited) and flat pricing, so busy WhatsApp users (Pro+) can be unprofitable. WhatsApp is the dominant variable cost.
- ❌ No inbound webhook → no two-way bot yet.

**Provider decision:** Meta Cloud API direct for WhatsApp (Twilio kept only as fallback).

**Tech stack:** Next.js App Router, TypeScript, Drizzle/Postgres, existing Dinaya messaging + plan + dashboard patterns, Vitest.

---

## Strategy & sequencing

Three tracks, run in this order:

1. **Track A — Go live (outbound).** Highest leverage; unblocks the core product promise.
2. **Track B — Instrument & protect margin.** Ship the meter and allowances in **observe mode** (generous, no enforcement). Overage billing is a later, *data-gated* sub-phase — do **not** enable it until real usage justifies it.
3. **Track C — Inbound bot.** Two-way replies AND a margin fix (in-window utility messages are free).

**Owners:** 👤 = founder / external account work · 🛠️ = dev (code).

**Decision gates:**
- **G1 — Meta SL rate** (Meta publishes by ~Sep 2026): finalizes allowance sizes (Task B2) and overage price (Task B5).
- **G2 — Post-launch usage data:** decides *if/when* to switch on overage enforcement (activates Task B5). Until then, soft-cap → email fallback only.

---

## Phase 0 — Prerequisites & decisions

- [ ] 👤 Confirm plan-tier strategy: WhatsApp stays **Pro+ only** (Starter = email, the cash cow). Already true in [plan.ts](../../../src/lib/plan.ts) (`whatsappSms`).
- [ ] 👤 Decide launch framing: **generous + "included" allowances**, no overage enforcement at launch (per strategy above).
- [ ] 🛠️ Confirm production env baseline in Vercel (which vars already set vs missing).

---

## Track A — Outbound messaging live

### Task A1 — Meta WhatsApp account + templates 👤
**Files:** none (external) — record results for Task A3.
- [ ] Create/verify a Meta Business account; add the WhatsApp product.
- [ ] Attach a **dedicated phone number** (not active on the regular WhatsApp app).
- [ ] Generate a **permanent access token** + capture the **Phone Number ID**.
- [ ] Submit **utility** templates for approval (EN + SI/TA variants): `booking_confirmation`, `booking_reminder`, `booking_cancellation`, `booking_reschedule`, `owner_new_booking`. (Dev supplies exact text + variable order.)
- [ ] Record approved template names, languages, and variable order.

### Task A2 — WhatsApp template sending 🛠️ *(the core code fix)*
**Files:**
- Modify: `src/lib/messaging/channels/whatsapp.ts`
- Create: `src/lib/messaging/whatsapp-templates.ts`
- Modify: `src/lib/messaging/index.ts`, `src/lib/messaging/booking-messages.ts`, `src/lib/messaging/types.ts`
- Modify: `.env.example`
- [ ] Add a `notificationType → { templateName, languageCode, params[] }` map in `whatsapp-templates.ts`.
- [ ] Extend `sendWhatsApp` to send `type:"template"` (with `components`/body params) for business-initiated sends; keep the `type:"text"` path for in-session replies (Track C).
- [ ] Thread structured template params (clientName, serviceName, when, manageUrl…) through `booking-messages.ts` instead of only a flattened `body` string.
- [ ] Map `BookingLanguage` → Meta template `language.code`.
- [ ] Preserve the Twilio fallback contract; map template failures (e.g. 131047, paused template) to `status:"failed"` with a clear error.
- [ ] Document new env in `.env.example` (`META_WHATSAPP_VERIFY_TOKEN`, `META_WHATSAPP_APP_SECRET` for Track C).
- [ ] Add unit tests for template payload shape + language mapping.

### Task A3 — Configure env, secrets, cron 👤🛠️
**Files:** Modify `.env.example`, `docs/deployment-checklist.md`; Vercel env (external).
- [ ] Set in Vercel: `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `CRON_SECRET`, confirm `RESEND_API_KEY`/`RESEND_FROM`, `NEXT_PUBLIC_APP_URL`.
- [ ] Confirm the reminder cron ([api/cron/reminders](../../../src/app/api/cron/reminders/route.ts)) is scheduled (GitHub Actions / Vercel cron) with matching `CRON_SECRET`.
- [ ] Confirm the test business is on Pro/Growth so `whatsappSms` is enabled.

### Task A4 — Verify outbound end-to-end 🛠️
**Files:** Create `src/app/api/admin/messaging/test/route.ts` (admin-only diagnostic) *(optional)*.
- [ ] Create a sandbox booking → confirm WhatsApp confirmation delivered + `communications` row written.
- [ ] Trigger the reminder cron → confirm reminder delivered and `reminderSentAt` set.
- [ ] Confirm the Integrations dashboard ([integrations.ts](../../../src/lib/dashboard/integrations.ts)) flips WhatsApp to "Configured".
- [ ] Confirm email + SMS fallback paths still behave when WhatsApp is unavailable.

---

## Track B — Usage metering & monetization

### Task B1 — WhatsApp usage metering 🛠️
**Files:** Create `src/lib/messaging/usage.ts`.
- [ ] `getWhatsAppUsageThisMonth(businessId)`: count `communications` where `channel='whatsapp'`, `status='sent'`, `sentAt >= startOfMonth` (no new table needed — reuse the log).
- [ ] Helper `whatsappAllowanceState(businessId, plan)` → `{ used, included, remaining, overBy }`.

### Task B2 — Plan allowances in config 🛠️ *(numbers gated by G1)*
**Files:** Modify `src/lib/plan.ts`, `src/lib/plan.test.ts`, `src/app/admin/plans/page.tsx`, `src/app/admin/plans/actions.ts`.
- [ ] Add `whatsappMessagesPerMonth: number | null` to `Entitlements.limits`.
- [ ] Defaults (starting points — finalize after G1): Starter `0`, Pro `500`, Growth `2000`, Trial `200`.
- [ ] Make admin-editable via `/admin/plans`; add tests covering each tier.

### Task B3 — Soft-cap + graceful fallback (observe mode) 🛠️
**Files:** Modify `src/lib/messaging/index.ts`, `src/lib/messaging/booking-messages.ts`.
- [ ] In channel selection, if WhatsApp usage ≥ allowance, **fall back to email** (never hard-stop) and record the reason on the `communications` row.
- [ ] Behind a feature flag `MESSAGING_ENFORCE_ALLOWANCE` (default **off** at launch = generous/observe-only).
- [ ] Emit an "approaching/over limit" signal for the dashboard (Task B4).

### Task B4 — Dashboard usage meter 🛠️
**Files:** Modify `src/lib/dashboard/billing.ts` + its billing UI client.
- [ ] Add a `usageItem("whatsappMessagesPerMonth", "WhatsApp messages", used, included)` to the existing usage array (same pattern as bookings/staff).
- [ ] Frame positively ("X of N included used"); warn at 80%.

### Task B5 — Overage + add-on packs 🛠️ *(DATA-GATED by G2 — build last, enable later)*
**Files:** Create migration + `message_credits`/`addon_purchases` schema in `src/db/schema.ts`; Create `src/lib/messaging/credits.ts`; Create PayHere purchase route + dashboard "buy pack" UI.
- [ ] Credit-balance model; overage consumes credits before falling back to email.
- [ ] One-time PayHere purchase of message packs (e.g. +1,000 msgs); overage price set **above cost** (per G1) so heavy users are profitable.
- [ ] ⚠️ Do **not** enable enforcement until G2 (usage data) justifies it. Ship A + B1–B4 first.

---

## Track C — Inbound WhatsApp bot

### Task C1 — Inbound webhook 🛠️
**Files:** Create `src/app/api/webhooks/whatsapp/route.ts`.
- [ ] `GET`: verify handshake (`hub.mode`/`hub.verify_token` vs `META_WHATSAPP_VERIFY_TOKEN`).
- [ ] `POST`: verify `X-Hub-Signature-256` (using `META_WHATSAPP_APP_SECRET`), parse messages, log inbound to `communications` (`direction:'inbound'`).

### Task C2 — Service-window tracking 🛠️
**Files:** Create `src/lib/messaging/session-window.ts`.
- [ ] `isWithinServiceWindow(clientPhone)` = most recent inbound `< 24h` (from `communications`).
- [ ] Used to (a) allow free-form text replies and (b) treat in-window utility sends as free (skip allowance draw-down).

### Task C3 — Reply routing / bot logic 🛠️
**Files:** Create `src/lib/messaging/inbound-router.ts`; integrate `src/lib/ai/*`.
- [ ] Classify intent (booking status, reschedule, cancel, FAQ, human handoff).
- [ ] Resolve via booking lookup / availability or AI copy layer; reply via free-form text (in-window = free).
- [ ] Owner/human handoff path; respect per-business config + hours.

### Task C4 — Bot config + verify 👤🛠️
**Files:** dashboard bot settings (reuse voice-receptionist patterns); Create `docs/whatsapp-bot-setup.md`.
- [ ] Per-business enable + FAQ/rules notes.
- [ ] Test inbound→reply; confirm in-window sends do **not** draw down the allowance.

---

## Phase V — Verify & launch

**Commands:**
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run audit:high`

- [ ] Fix any TypeScript, lint, or test failures.
- [ ] Update `docs/deployment-checklist.md` with the new env vars + cron + Meta template list.
- [ ] Confirm `git status --short --branch` shows only intended files.
- [ ] Smoke test all paths in production: confirmation, reminder (cron), cancel, reschedule, owner-notify, inbound reply.

---

## Quick reference — what unblocks what

```
A1 (Meta acct+templates, 1–2d lead) ─┐
                                      ├─► A3 (config) ─► A4 (verify) ─► LIVE
A2 (template code, do now) ──────────┘
B1 (meter) ─► B2 (allowances) ─► B3 (soft-cap) ─► B4 (dashboard)   [observe mode]
                                                         │
                                          G2 (usage data) ─► B5 (overage)  [later]
C1 (webhook) ─► C2 (window) ─► C3 (router) ─► C4 (config+verify)   [margin fix]
```

**Start now (no external dependency):** Task A2 (template code) + Task B1 (meter). Everything else waits on Meta approval (A1) or is sequenced after go-live.
