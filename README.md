# Dinaya

Dinaya is a Sri Lanka–focused booking platform for local businesses. It provides public booking pages, PayHere payments, automated reminders, CRM, and AI growth workflows.

Production: [https://dinaya.lk](https://dinaya.lk)

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Neon Postgres + Drizzle ORM
- NextAuth (credentials)
- PayHere, Resend, optional OpenAI

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

Required for local development:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

3. Run migrations:

```bash
npm run db:migrate
```

4. Start the dev server:

```bash
npm run dev
```

Sign in at `/auth/signin`. Register a business at `/register`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run lint` | ESLint |
| `npm run verify` | Lint + test + build |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Architecture

```text
Public booking (/book/[slug]) → API routes → Neon Postgres
Business dashboard (/dashboard) → authenticated CRUD APIs
Platform admin (/admin) → internal operations
Cron (/api/cron/*) → AI workflows + reminders
```

Subdomain routing rewrites `{slug}.dinaya.lk` to `/book/[slug]` via middleware.

## Deployment

See [docs/deployment-checklist.md](docs/deployment-checklist.md) for environment variables, cron setup, and smoke tests.

## Security notes

- Set `AUTH_SECRET` and `SECRET_ENCRYPTION_KEY` in production.
- Protect health endpoints with `HEALTH_CHECK_SECRET` or `CRON_SECRET`.
- Cron routes require `Authorization: Bearer $CRON_SECRET`.
