# AI Voice Receptionist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing Dinaya AI Voice Receptionist foundation so Max businesses can request a managed phone-agent setup, generate voice-scoped API credentials, expose voice-safe business data, and track voice-created bookings.

**Architecture:** Dinaya remains the booking source of truth. External voice providers call Dinaya API endpoints with scoped API keys; Dinaya enforces plan, tenant, availability, double-booking, payment, notification, and audit rules. The dashboard captures setup requirements while platform admins manage provider status.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle/Postgres migrations, existing Dinaya API key auth, existing dashboard/admin patterns, Vitest.

---

### Task 1: Persist Voice Receptionist Setup

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0016_voice_receptionist.sql`
- Create: `src/lib/voice-receptionist.ts`

- [ ] Add a `voice_integrations` table keyed by `business_id`.
- [ ] Store provider/status, customer-facing phone numbers, language choices, prompt/rule notes, setup notes, timestamps, and optional API key reference.
- [ ] Add reusable status/language constants and labels.

### Task 2: Add Max-Only Entitlement

**Files:**
- Modify: `src/lib/plan.tsx`
- Modify: `src/app/admin/plans/actions.ts`
- Modify: `src/app/admin/plans/page.tsx`
- Modify: `src/lib/plan-features.ts`
- Modify: `src/lib/plan.test.ts`

- [ ] Add `aiVoiceReceptionist` as a plan feature.
- [ ] Default it to Max-only.
- [ ] Make `minimumPlanForFeature("aiVoiceReceptionist")` return `max`.
- [ ] Add plan tests proving Free/Pro are blocked and Max is allowed.

### Task 3: Add Dashboard Setup Flow

**Files:**
- Create: `src/app/dashboard/settings/voice-receptionist/page.tsx`
- Create: `src/components/dashboard/VoiceReceptionistClient.tsx`
- Modify: `src/app/dashboard/settings/integrations/page.tsx`

- [ ] Add the Integrations card for AI Voice Receptionist.
- [ ] Build a Max-gated setup page for owner users.
- [ ] Let owners submit business phone, handoff phone, languages, opening rules, service rules, booking rules, FAQ notes, welcome message, and fallback message.
- [ ] Let owners generate a voice-scoped API key through the existing API key endpoint.

### Task 4: Add Voice Setup API

**Files:**
- Create: `src/app/api/dashboard/voice-receptionist/route.ts`
- Modify: `src/app/api/dashboard/api-keys/route.ts`
- Modify: `src/lib/api-keys.ts`

- [ ] Add dashboard GET/POST for voice setup.
- [ ] Require owner auth and Max plan for setup mutations.
- [ ] Add allowed API scopes including `voice:read` and `voice:write`.
- [ ] Keep raw API keys one-time visible.

### Task 5: Add Provider Read API

**Files:**
- Create: `src/app/api/v1/voice/profile/route.ts`

- [ ] Require `voice:read` API key auth.
- [ ] Return only the authenticated business profile, active branches, active services, active staff, staff-service assignments, and endpoint templates.
- [ ] Do not expose PayHere secrets, webhook secrets, client records, or unrelated tenant data.

### Task 6: Track Voice-Created Bookings

**Files:**
- Modify: `src/app/api/bookings/route.ts`
- Modify: `src/lib/booking-attribution.ts`

- [ ] Accept `voice_agent` as a booking source.
- [ ] Only allow API callers to set `voice_agent` when their API key has `voice:write`.
- [ ] Keep normal API bookings as `api`.
- [ ] Preserve existing conflict, tenant, payment, notification, webhook, and automation behavior.

### Task 7: Add Admin Operations

**Files:**
- Create: `src/app/admin/voice/page.tsx`
- Create: `src/app/admin/voice/actions.ts`
- Modify: `src/components/admin/AdminSidebarNav.tsx`

- [ ] Show all voice setup requests with business, status, language, phone, and notes.
- [ ] Let admins update status, provider name, AI phone number, setup notes, activated/tested timestamps.
- [ ] Log admin audit events and revalidate the admin page.

### Task 8: Document Provider Setup

**Files:**
- Create: `docs/ai-voice-receptionist-setup.md`

- [ ] Explain the normal phone-number flow.
- [ ] Document Peak Agents, Twilio/Vapi/Retell-style setup.
- [ ] Include required API scopes, profile endpoint, booking endpoint, handoff behavior, and test checklist.

### Task 9: Verify

**Commands:**
- `npm test -- src/lib/plan.test.ts`
- `npm run lint`
- `npm run build`
- `npm run audit:high`

- [ ] Fix any TypeScript, lint, or test failures.
- [ ] Confirm `git status --short --branch` shows only intended files.
