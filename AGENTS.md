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

### Plan gating (Free / Pro / Max)

- Check features: `canUseFeature(plan, feature)` in `src/lib/plan.tsx`
- Enforce in APIs: `requirePro(businessId, feature)` — throws `PlanRequiredError`
- UI gates: `<ProGate feature="…">` in `src/lib/plan.tsx`
- Feature metadata: `src/lib/plan-features.ts`
- **Max-only example:** `aiVoiceReceptionist`

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

`.cursor/skills/dag-task-runner/` is copied from [cursor/cookbook](https://github.com/cursor/cookbook) for optional multi-step agent workflows. Invoking it requires a `CURSOR_API_KEY` and consumes Cursor subscription usage — it is not part of Dinaya production.
