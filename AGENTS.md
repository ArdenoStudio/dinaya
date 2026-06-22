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

The relevant service is the **root Next.js web app** (`npm run dev`, port **3002**). Commands are documented in [README.md](README.md) and `package.json` — `npm run lint`, `npm test`, `npm run build`, `npm run db:migrate`. Below are the non-obvious caveats for this environment.

### Database: use a local Postgres, never the injected `DATABASE_URL`

- The injected `DATABASE_URL` / `DATABASE_URL_DIRECT` secrets point at the **production Supabase pooler** (`*.pooler.supabase.com`). Do **not** run `npm run db:migrate`, `npm run build` (it auto-migrates when `DATABASE_URL` is set), seed scripts, or any write/test flow against it.
- A local Postgres 16 is installed in the VM with a dev database. Start it each session (it is not auto-started by the snapshot) and override the connection string:
  ```bash
  sudo pg_ctlcluster 16 main start
  export DATABASE_URL="postgresql://dinaya:dinaya@127.0.0.1:5432/dinaya"
  export DATABASE_URL_DIRECT="postgresql://dinaya:dinaya@127.0.0.1:5432/dinaya"
  ```
  If the role/db is missing on a fresh VM, recreate them: `sudo -u postgres psql -c "CREATE ROLE dinaya LOGIN PASSWORD 'dinaya' CREATEDB;" -c "CREATE DATABASE dinaya OWNER dinaya;"` then `npm run db:migrate`.
- **Gotcha:** Next.js and the dotenv-based scripts (`db-migrate.mjs`, `drizzle.config.ts`, `playwright.config.ts`) do **not** override variables already present in `process.env`. Because `DATABASE_URL` is injected as a real env var, putting a local value in `.env.local` has no effect — you must `export` the local URL in the shell that runs `npm run dev` / `npm run db:migrate`.

### Running and testing

- Dev server: `npm run dev` → `http://localhost:3002`. Playwright's local webserver uses port **3001** (`playwright.config.ts`); override the target with `PLAYWRIGHT_BASE_URL`.
- No seed data is required for the core booking flow. Register a tenant via `POST /api/auth/register` (or `/register`); `registerBusinessAccount()` seeds services, staff, locations, and Mon–Sat availability. Default seeded services have `requiresPayment: false`, so public bookings reach `confirmed` status without PayHere.
- Optional integrations (PayHere, Resend, Groq AI, Meta/Twilio messaging, Upstash, Google Calendar) are feature-gated — missing env vars degrade gracefully and do not crash the dev server.
- Secondary apps under `apps/` (`desktop` Tauri, `mobile` Android, `mcp-dinaya`, `video` Remotion) are not needed to run or test the core web product.
