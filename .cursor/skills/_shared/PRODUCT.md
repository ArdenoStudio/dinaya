# Dinaya Product Reference

## Pillars

| Pillar | What |
|--------|------|
| Booking | `/book/[slug]`, `{slug}.dinaya.lk` subdomains |
| Payments | PayHere checkout + subscription billing |
| Operations | Dashboard: calendar, clients, staff, locations, automations |
| Growth | Reviews, referrals, directory, Deals, AI Hub |
| Integrations | Google Calendar, webhooks, API keys, WhatsApp/SMS |

## Dashboard nav (`src/lib/dashboard-route-map.ts`)

- **Workspace:** Overview, Calendar, Bookings, Clients
- **Catalog:** Services, Staff, Locations, Availability
- **Growth:** Reviews, Payments, Marketing, Deals, Broadcasts, AI Hub, Reports
- **Configure:** Integrations, Automations, Billing, Settings

## Plan tiers (internal → customer)

| Internal | Customer | Monthly LKR | Annual LKR |
|----------|----------|-------------|------------|
| trial | Free trial | 14 days | — |
| starter | Starter | 1,990 | 19,900 |
| pro | Pro | 3,990 | 39,900 |
| max | Growth | 6,900 | 69,000 |
| expired | Expired | locked | — |

Managed Max: contact sales (custom).

## Feature labels (exact — from `plan.ts`)

- AI Booking Autopilot, 30-Day AI Content Machine, Smart deal suggestions
- AI upsell assistant, AI Voice Receptionist (disabled until rollout)
- Automations, Broadcasts, **Dinaya Deals**
- Client Reactivation Campaign, Google Calendar sync
- Intake & routing forms, PayHere payments
- Public booking page, Booking page customization
- Reports, Review engine, Reviews, Review replies
- Smart reminder system, VIP Loyalty Sequence
- Webhooks and API, WhatsApp and SMS reminders

## Plan gating (minimum tier)

| Feature class | Minimum plan |
|---------------|--------------|
| Public booking, PayHere | Starter |
| Automations, deals, webhooks, WhatsApp, reports | Pro |
| AI features, customization, review replies | Growth |

API: `requirePro(businessId, feature)` → HTTP 402 on `PlanRequiredError`  
UI: `<ProGate feature="…">`

## Limits (defaults)

| Plan | Staff | Services | Locations | WhatsApp/mo |
|------|-------|----------|-----------|-------------|
| Starter | 2 | 10 | 1 | 0 |
| Pro | 5 | ∞ | 1 | 500 |
| Growth | 15 | ∞ | 3 | 2000 |

## Booking-specific terms (preserve in UI)

- Slot holds, server-backed reservations, idempotency keys
- Deals / flash discounts for quiet slots
- PayHere, PayPal, bank transfer / manual payment
- Client self-service reschedule/cancel (token URLs)
- Embed mode `/embed/book/[slug]`
- Custom domain (Growth)
- Directory `/discover`
- **Powered by Dinaya** growth loop

## Product AI vs dev tooling

| Layer | Location | Notes |
|-------|----------|-------|
| Tenant AI | `src/lib/ai/` | Groq/OpenAI HTTP — ships in production |
| Dev skills | `.cursor/skills/` | Never ship `@cursor/sdk` in app |

## Target market

**Beachhead:** salons, barbers, nails, spas, bridal MUA, aesthetics, fitness/wellness — Colombo cluster first.

**North-star event:** signup → **first real booking** (not signup alone).
