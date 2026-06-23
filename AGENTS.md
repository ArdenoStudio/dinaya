# AGENTS.md — Dinaya

Guidance for contributors and AI agents working in this repository.

## Project

**Dinaya** is a Sri Lanka booking platform for local businesses — public booking pages, PayHere payments, CRM, automations, and AI growth workflows. Built by **Ardeno Studio**. Production: [dinaya.lk](https://dinaya.lk).

## Stack

- **Runtime:** Node.js 22
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Data:** Neon Postgres, Drizzle ORM
- **Auth:** NextAuth (credentials) via `@/auth` and `@/lib/auth`
- **Deploy:** Vercel
- **Payments:** PayHere (`src/lib/payhere.ts`)
- **Product AI:** Groq/OpenAI-compatible HTTP in `src/lib/ai/copy.ts` (not Cursor SDK)

## Directory map

| Path | Purpose |
|------|---------|
| `src/app/book/[slug]/` | Public booking flow |
| `src/app/dashboard/` | Authenticated business dashboard |
| `src/app/admin/` | Platform admin (internal) |
| `src/app/api/dashboard/` | Session-authenticated tenant APIs |
| `src/app/api/v1/` | Bearer API key endpoints (voice agents, integrations) |
| `src/app/api/cron/` | Scheduled jobs (Bearer `CRON_SECRET`) |
| `src/lib/` | Domain logic — do not import from `src/components/` into lib |
| `src/components/` | UI (`booking/`, `dashboard/`, `docs/`, `ui/`) |
| `drizzle/` | Numbered SQL migrations (`0001_…` through latest) |
| `src/db/schema.ts` | Drizzle schema (update when adding migrations) |
| `e2e/` | Playwright end-to-end tests |
| `.github/workflows/` | CI and production cron invokers |
| `middleware.ts` | Subdomain + custom domain rewrites to `/book/[slug]` |

## Commands

Run before opening a PR:

```bash
npm run verify    # lint + unit tests + production build (matches CI)
npm test          # Vitest only
npm run lint      # ESLint
npm run build     # Next.js build
npm run db:migrate  # Apply Drizzle migrations locally
```

E2E (optional locally; runs on PRs when secrets are set):

```bash
npm run test:e2e  # Requires DATABASE_URL, AUTH_SECRET
```

## Conventions

### Code style

- Match existing patterns in neighboring files; keep diffs minimal.
- Use `@/` import alias.
- Prefer extending existing helpers over new abstractions.

### Database migrations

- Add a new file: `drizzle/00NN_descriptive_name.sql` (next sequence number).
- Update `src/db/schema.ts` to match.
- Do not edit migrations that may already be applied in production.
- Run `npm run db:migrate` after schema changes.

### API routes

| Route prefix | Auth pattern |
|--------------|--------------|
| `/api/cron/*` | `Authorization: Bearer $CRON_SECRET` |
| `/api/dashboard/*` | `requireApiBusiness()` from `@/lib/api-auth` |
| `/api/v1/*` | `requireApiKey(req, scope)` from `@/lib/api-key-auth` |
| Server pages | `requireBusiness()` / `requireOwner()` from `@/lib/auth` |

Validate request bodies with Zod schemas from `src/lib/schemas/` or colocated schemas.

### Plan gating (Trial / Starter / Pro / Growth)

- Check features: `canUseFeature(plan, feature)` in `src/lib/plan.ts`
- Enforce in APIs: `requirePro(businessId, feature)` — throws `PlanRequiredError`
- UI gates: `<ProGate feature="…">` in `src/components/ProGate.tsx`
- Feature metadata: `src/lib/plan-features.ts`
- Growth is represented as `max` internally; `aiVoiceReceptionist` remains disabled until rollout opens.

### Sri Lanka / product constraints

- Subdomains: `{slug}.dinaya.lk` rewrites to `/book/[slug]` (see `middleware.ts`).
- Custom domains: verified via `src/lib/vercel-domains.ts`.
- Availability and slots use the business timezone (`src/lib/availability.ts`).
- Never log or commit PayHere secrets, webhook secrets, or API keys.
- Cron routes and health checks must stay protected in production.

### Product AI vs Cursor dev tooling

- **Tenant AI** (AI Hub, review replies, voice receptionist APIs): `src/lib/ai/`, `/api/v1/`.
- **Cursor config** (this repo's `.cursor/`, `AGENTS.md`): dev-only; never ship `@cursor/sdk` in the main app bundle.

## Key docs

- [README.md](README.md) — local setup
- [docs/deployment-checklist.md](docs/deployment-checklist.md) — production env and crons
- [docs/ai-voice-receptionist-setup.md](docs/ai-voice-receptionist-setup.md) — voice agent API

## Cursor skills

Dev-only agent skills live in `.cursor/skills/`. See [`.cursor/skills/README.md`](.cursor/skills/README.md) for the full pack.

| Layer | Skills |
|-------|--------|
| **Hub** | `dinaya-hub` — route to the right specialist |
| **Brand** | `dinaya-brand-voice`, `dinaya-visual-system` |
| **Executive** | `dinaya-ceo`, `dinaya-cpo`, `dinaya-cto`, `dinaya-cfo`, `dinaya-head-of-growth`, `dinaya-head-of-sales` |
| **Engineering** | `dinaya-booking-engine`, `dinaya-payhere`, `dinaya-migrations`, `dinaya-api-auth`, `dinaya-plan-gating`, `dinaya-messaging`, `dinaya-events`, `dinaya-voice-api` |
| **Review** | `dinaya-security-review`, `dinaya-pr-ship-review`, `dinaya-content-review`, `apple-design-head` |
| **Orchestration** | `dag-task-runner` (from [cursor/cookbook](https://github.com/cursor/cookbook); requires `CURSOR_API_KEY`) |

Shared context: `.cursor/skills/_shared/` (brand, visual, product, stack, paths, competitors).

Master plan: `docs/superpowers/plans/2026-06-22-dinaya-skill-pack-master-plan.md`

Skills are not part of Dinaya production — never ship `@cursor/sdk` in the app bundle.

## Cursor Cloud specific instructions

Scope: the primary product is the root **Next.js web app** (booking platform). The sub-apps under `apps/` (`desktop` is Tauri/Windows-only, `mcp-dinaya`, `video`) are secondary and have their own `package-lock.json`; install them separately only when working on them.

Startup/run caveats (commands themselves are in `README.md` / `package.json`):

- **Dev server runs on port 3002** (`npm run dev` → `next dev -p 3002`), not 3000. Playwright's local webServer uses port 3001.
- **Secrets are injected as environment variables** (`DATABASE_URL`, `DATABASE_URL_DIRECT`, `AUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_*`, etc.); there is no committed `.env.local`. Next.js, `db:migrate`, and Playwright read `process.env` directly, so no extra setup is needed.
- **`DATABASE_URL_DIRECT` is IPv6-only here and unreachable** (the VM has no IPv6 route). The pooler `DATABASE_URL` (Supabase `...pooler.supabase.com:6543`) works over IPv4. `db:migrate` and `drizzle.config.ts` prefer `DATABASE_URL_DIRECT`, so run migrations with it overridden to the pooler: `DATABASE_URL_DIRECT="$DATABASE_URL" npm run db:migrate`. Same override for `npm run build` if you want its auto-migrate step to succeed (the build tolerates a migrate failure and continues regardless).
- The database is already provisioned — `db:migrate` baselines existing history and is normally a no-op.
- `users` exists in both `public` and Supabase's `auth` schema; always qualify with `public.users` when querying directly.
- Hello-world / smoke check: register a business at `/register` (two-step form → auto sign-in → `/dashboard/setup`), which exercises account + business creation against Postgres.
