# Route Map Template

> **Fill this in** with your routes, API prefixes, and key module paths.
> Example: **Acme Scheduling**.

---

## Public flows

| Path | Purpose |
|------|---------|
| `/book/[slug]` | [Public booking hub] |
| `/book/[slug]/[serviceSlug]` | [Single-service flow] |
| `/book/[slug]/pay` | [Payment redirect] |
| `/book/[slug]/confirmed` | [Confirmation page] |
| `/embed/book/[slug]` | [Embeddable widget] |
| `{slug}.your-domain.com` | [Subdomain rewrite if applicable] |

## Dashboard (authenticated)

| Path | Purpose |
|------|---------|
| `/dashboard` | Overview |
| `/dashboard/calendar` | Calendar |
| `/dashboard/bookings` | Bookings list |
| `/dashboard/clients` | CRM |
| [Add your routes] | |

## API auth patterns (configure for your project)

| Prefix | Auth |
|--------|------|
| `/api/cron/*` | `Authorization: Bearer $CRON_SECRET` |
| `/api/dashboard/*` | `requireApiBusiness()` or your session helper |
| `/api/v1/*` | `requireApiKey(req, scope)` |
| Server pages | `requireAuth()` / `requireOwner()` |

## Key lib paths

| Path | Domain |
|------|--------|
| `[scheduling module]` | Slots, timezone |
| `[payment module]` | Gateway hash + checkout |
| `[entitlements module]` | Plans, features |
| `[messaging module]/` | Notifications |
| `[schema file]` | Database schema |
| `[middleware]` | Routing, domains |

## Admin & platform

| Path | Purpose |
|------|---------|
| `/admin` | Platform admin |
| `/api/cron/*` | Scheduled jobs |

## Planned routes (if not yet built)

| Path | Purpose |
|------|---------|
| [Future path] | [Purpose] |
