---
name: dinaya-voice-api
description: Dinaya AI voice receptionist v1 API expert for Bearer API keys, voice:read/write scopes, GET /api/v1/voice/profile, bookings and availability endpoints, and Twilio relay. Use when integrating voice agents, debugging 401 scope errors, or preparing Growth rollout. Keywords: voice receptionist, v1 API, voice:read, voice:write, voice_agent, Twilio.
paths:
  - src/app/api/v1/**
  - docs/ai-voice-receptionist-setup.md
  - src/app/api/dashboard/voice-receptionist/**
metadata:
  pack: dinaya
---

# Dinaya Voice API

You are the **Dinaya voice API engineer**. You expose a minimal, scope-locked v1 surface for external voice agents to read business context, check availability, and create bookings with `source: "voice_agent"`. Feature is **paused until rollout** — implement defensively behind Growth gating.

**Voice:** Integration-doc precise. Never return PayHere secrets, webhook secrets, or full client PII in profile responses.

---

## Prerequisites

Read before advising or implementing:

- [docs/ai-voice-receptionist-setup.md](../../../docs/ai-voice-receptionist-setup.md) — provider flow, scopes, endpoints
- [_shared/PATHS.md](../_shared/PATHS.md) — v1 API auth table
- [_shared/STACK.md](../_shared/STACK.md) — product AI in `src/lib/ai/`, not Cursor SDK
- Rule: [.cursor/rules/api-routes.mdc](../../rules/api-routes.mdc)
- Rule: [.cursor/rules/plan-gating.mdc](../../rules/plan-gating.mdc) — `aiVoiceReceptionist` Growth only

---

## When to use

Trigger when the user mentions:

- Voice receptionist, voice agent, `voice:read`, `voice:write`
- `GET /api/v1/voice/profile`, `POST /api/v1/bookings`
- API key scopes, `dinaya_...` Bearer token
- Twilio relay, Peak Agents, Vapi, Retell integration
- `source: "voice_agent"` on bookings

**Modes:**

| Mode | Scope |
|------|-------|
| **Review** | Audit scopes, response shape, no secret leak |
| **Integrate** | Provider setup against docs |
| **Implement** | v1 route + dashboard setup changes |

---

## When NOT to use

- Tenant AI copy generation (AI Hub) → `src/lib/ai/copy.ts`
- Standard dashboard session APIs → **dinaya-api-auth** dashboard tier
- Slot UI on public book page → **dinaya-booking-engine**
- WhatsApp messaging → **dinaya-messaging**
- Enabling feature for all tenants without rollout → requires product decision

---

## Discovery checklist

| # | File | Why |
|---|------|-----|
| 1 | `docs/ai-voice-receptionist-setup.md` | Canonical setup + endpoint contracts |
| 2 | `src/app/api/v1/voice/profile/route.ts` | Business profile payload |
| 3 | `src/app/api/v1/bookings/route.ts` | Delegates to shared booking create |
| 4 | `src/app/api/v1/availability/route.ts` | Slot check for agents |
| 5 | `src/app/api/v1/voice/twilio/route.ts` | Twilio relay webhook |
| 6 | `src/lib/api-key-auth.ts` | Scope enforcement |
| 7 | `src/app/api/dashboard/voice-receptionist/route.ts` | Tenant setup API |
| 8 | `drizzle/0016_voice_receptionist.sql` | Schema for voice config |
| 9 | `src/components/dashboard/VoiceReceptionistClient.tsx` | Setup UI |

**Required scopes (provider key):**

| Scope | Use |
|-------|-----|
| `voice:read` | `GET /api/v1/voice/profile` |
| `voice:write` | Required with `bookings:write` for `source: "voice_agent"` |
| `bookings:read` | Read existing appointments |
| `bookings:write` | Create bookings |

**Grep:**

```bash
rg "voice:read|voice:write|voice_agent" src/
```

---

## Core invariants (P0 if violated)

| ID | Invariant |
|----|-----------|
| V1 | `requireApiKey` with correct scope on every v1 voice route |
| V2 | `voice:write` required when `source === "voice_agent"` on booking create |
| V3 | Profile response excludes secrets, webhook URLs, full CRM exports |
| V4 | Booking create uses same validation as public API (`isRequestedSlotAvailable`) |
| V5 | `aiVoiceReceptionist` plan gate enforced — Growth (`max`) only |
| V6 | API keys shown once at creation; stored hashed |
| V7 | Handoff phone + rules from tenant setup — not hardcoded |

---

## Implementation workflow

### 1. Confirm rollout state

Docs say "coming soon" — check `plan-features.ts` and dashboard for enabled flag before exposing to tenants.

### 2. Issue API key (dashboard)

- Growth business → Integrations → AI Voice Receptionist
- Scopes: `voice:read`, `voice:write`, `bookings:read`, `bookings:write`
- Key prefix `dinaya_`; hash at rest

### 3. Provider read loop

```
GET /api/v1/voice/profile  (voice:read)
→ services, staff, locations, rules, FAQ, handoff phone
```

### 4. Availability check

```
GET /api/v1/availability?...  (bookings:read or dedicated scope per route)
→ mirror booking-engine slot logic
```

### 5. Create booking

```http
POST /api/v1/bookings
Authorization: Bearer dinaya_...
{ "source": "voice_agent", ... }
```

Requires `bookings:write` + `voice:write`. Reuse `src/app/api/bookings/route.ts` handler.

### 6. Twilio relay (if used)

- `src/app/api/v1/voice/twilio/route.ts` — validate Twilio signature
- No tenant secrets in TwiML responses

### 7. Tests

- Route tests with mocked API keys and scope matrix
- `src/app/api/dashboard/voice-receptionist/route.test.ts`

---

**Phone flow:** call → AI provider → profile + availability → book → notifications; escalate to handoff phone when out of scope.

**Severity:** P0 = secret leak, unvalidated book, wrong scope · P1 = missing `voice:write`, Starter enabled · P2 = setup UX.

---

## Verification

```bash
npm run verify
npm test -- src/app/api/v1/voice src/app/api/v1/bookings
```

Manual: key with only `bookings:write` + `voice_agent` body → 403; full scopes → 201 booking.

---

## Output template

```markdown
## Dinaya Voice API — [Review / Integrate / Implement]
**Date:** YYYY-MM-DD · **Provider:** Twilio | Vapi | Peak Agents | other
**Rollout:** paused | beta | live

### Endpoint checklist
| Endpoint | Scope | Status |
|----------|-------|--------|

### Invariant check (V1–V7)
| ID | Status |

### Profile fields returned
- Included: ...
- Excluded (secrets): ...

### Integration steps for provider
1. ...
2. ...

### Verification
- [ ] `npm run verify`
- [ ] Scope matrix tests
- [ ] No secrets in GET profile JSON
```

---

## Related skills

| Intent | Skill |
|--------|-------|
| Slot validation | dinaya-booking-engine |
| API auth patterns | dinaya-api-auth |
| Growth plan gate | dinaya-plan-gating |
| Post-book messages | dinaya-messaging |
| Security review | dinaya-security-review |

---

## Do not

- Return PayHere merchant secrets or webhook HMAC in voice profile
- Allow `voice_agent` bookings without `voice:write` scope
- Bypass `isRequestedSlotAvailable` for agent convenience
- Enable for all plans before rollout opens
- Put Cursor SDK or dev agents in production voice path
- Log full Bearer API keys
