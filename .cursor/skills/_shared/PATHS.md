# Dinaya Route Map

## Public booking

| Path | Purpose |
|------|---------|
| `/book/[slug]` | Booking hub (multi-service) |
| `/book/[slug]/[serviceSlug]` | Single-service booking flow |
| `/book/[slug]/pay` | PayHere redirect |
| `/book/[slug]/confirmed` | Booking confirmation |
| `/embed/book/[slug]` | Embeddable widget |
| `{slug}.dinaya.lk` | Subdomain rewrite → `/book/[slug]` |

## Dashboard (authenticated)

| Path | Purpose |
|------|---------|
| `/dashboard` | Overview |
| `/dashboard/calendar` | Calendar |
| `/dashboard/bookings` | Bookings list |
| `/dashboard/clients` | CRM |
| `/dashboard/services` | Service catalog |
| `/dashboard/staff` | Staff |
| `/dashboard/locations` | Locations |
| `/dashboard/deals` | Dinaya Deals |
| `/dashboard/ai` | AI Hub |
| `/dashboard/billing` | Subscription |
| `/dashboard/settings` | Business settings |

## API auth patterns

| Prefix | Auth |
|--------|------|
| `/api/cron/*` | `Authorization: Bearer $CRON_SECRET` |
| `/api/dashboard/*` | `requireApiBusiness()` from `@/lib/api-auth` |
| `/api/v1/*` | `requireApiKey(req, scope)` from `@/lib/api-key-auth` |
| Server pages | `requireBusiness()` / `requireOwner()` from `@/lib/auth` |

## Key lib paths

| Path | Domain |
|------|--------|
| `src/lib/availability.ts` | Slots, timezone |
| `src/lib/payhere.ts` | PayHere hash + form |
| `src/lib/plan.ts` | Plans, entitlements, `requirePro` |
| `src/lib/messaging/` | WhatsApp, SMS, email |
| `src/lib/webhooks.ts` | Outbound tenant webhooks |
| `src/db/schema.ts` | Drizzle schema |
| `middleware.ts` | Subdomain + custom domain |

## Admin & platform

| Path | Purpose |
|------|---------|
| `/admin` | Platform admin |
| `/admin/plans` | Plan config |
| `/api/cron/reminders` | Booking reminders |

## Docs (dev)

| Path | Purpose |
|------|---------|
| `docs/launch-research-2026/` | GTM research |
| `docs/superpowers/plans/` | Master plans |
| `drizzle/` | SQL migrations |

## Planned (events — see master plan)

| Path | Purpose |
|------|---------|
| `/book/[slug]/events` | Host event list |
| `/book/[slug]/events/[eventSlug]` | Event detail + tickets |
| `/dashboard/events` | Organizer events |
