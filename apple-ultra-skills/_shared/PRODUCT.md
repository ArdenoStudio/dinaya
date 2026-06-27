# Product Reference Template

> **Fill this in** with your product pillars, plan tiers, and feature labels.
> Example: **Acme Scheduling** — fictional scheduling SaaS.

---

## Pillars

| Pillar | What |
|--------|------|
| Core flow | [e.g. `/book/[slug]` public booking pages] |
| Payments | [e.g. Payment gateway checkout + subscription billing] |
| Operations | [e.g. Dashboard: calendar, clients, staff, locations] |
| Growth | [e.g. Reviews, referrals, directory, deals, AI hub] |
| Integrations | [e.g. Calendar sync, webhooks, API keys, messaging] |

## Dashboard nav

List your main authenticated routes:

- **Workspace:** [Overview, Calendar, Bookings, Clients]
- **Catalog:** [Services, Staff, Locations, Availability]
- **Growth:** [Reviews, Payments, Marketing, Reports]
- **Configure:** [Integrations, Automations, Billing, Settings]

## Plan tiers (internal → customer)

| Internal | Customer | Monthly price | Annual price |
|----------|----------|---------------|--------------|
| trial | Free trial | [N] days | — |
| starter | Starter | [price] | [annual] |
| pro | Pro | [price] | [annual] |
| growth | Growth | [price] | [annual] |
| expired | Expired | locked | — |

## Feature labels (exact — from your entitlements module)

List exact customer-facing feature names as they appear in code and UI:

- [Feature 1]
- [Feature 2]
- [Feature 3]

## Plan gating (minimum tier)

| Feature class | Minimum plan |
|---------------|--------------|
| [Core public booking] | Starter |
| [Automations, webhooks, messaging] | Pro |
| [AI features, customization] | Growth |

API: `requireEntitlement(businessId, feature)` → HTTP 402 on entitlement error  
UI: `<EntitlementGate feature="…">` (or your equivalent)

## Limits (defaults)

| Plan | [Limit 1] | [Limit 2] | [Messaging/mo] |
|------|-----------|-----------|----------------|
| Starter | | | 0 |
| Pro | | | [cap] |
| Growth | | | [cap] |

## Core product terms (preserve in UI)

- Slot holds, server-backed reservations, idempotency keys
- Timezone-aware availability
- Client self-service reschedule/cancel (token URLs)
- Embed mode if applicable
- Custom domain on top tier
- **Powered by [Your Product]** growth loop

## Product AI vs dev tooling

| Layer | Location | Notes |
|-------|----------|-------|
| Tenant AI | `[your AI module path]` | Ships in production |
| Dev skills | `.cursor/skills/` | Never ship dev agent SDK in app |

## Target market

**Beachhead:** [your target customer segment] — [geographic cluster] first.

**North-star event:** signup → **[first real conversion event]** (not signup alone).
