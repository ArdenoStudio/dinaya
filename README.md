<p align="center">
  <a href="https://dinaya.lk">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/dinaya-brand-dark.svg" />
      <img src="public/dinaya-brand-light.svg" alt="Dinaya" width="280" />
    </picture>
  </a>
</p>

<p align="center">
  Sri Lanka booking platform for local businesses — built by <strong>Ardeno Studio</strong><br />
  Public booking pages, PayHere payments, automated reminders, CRM, and AI growth workflows.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-live-F97316?style=flat-square" alt="Status live" />
  <a href="https://dinaya.lk">
    <img src="https://img.shields.io/badge/website-dinaya.lk-0EA5E9?style=flat-square" alt="Website dinaya.lk" />
  </a>
  <img src="https://img.shields.io/badge/stack-Next.js%2016%20%2B%20Neon-111111?style=flat-square&logo=next.js&logoColor=white" alt="Stack Next.js and Neon" />
  <img src="https://img.shields.io/badge/deployed-Vercel-111111?style=flat-square&logo=vercel&logoColor=white" alt="Deployed on Vercel" />
  <img src="https://img.shields.io/badge/market-Sri%20Lanka-111111?style=flat-square" alt="Market Sri Lanka" />
</p>

<p align="center">
  <a href="https://github.com/ArdenoStudio/dinaya/actions/workflows/ci.yml">
    <img src="https://github.com/ArdenoStudio/dinaya/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 22" />
  <img src="https://img.shields.io/badge/PayHere-payments-111111?style=flat-square" alt="PayHere payments" />
  <img src="https://img.shields.io/badge/Neon-Postgres-00E599?style=flat-square&logo=neon&logoColor=black" alt="Neon Postgres" />
</p>

<p align="center">
  <a href="https://dinaya.lk"><strong>dinaya.lk</strong></a>
  ·
  <a href="docs/deployment-checklist.md">Deployment checklist</a>
  ·
  <a href="https://github.com/ArdenoStudio/dinaya/actions">GitHub Actions</a>
</p>

---

## Features

| Area | What you get |
|------|----------------|
| **Booking** | Branded public pages at `/book/[slug]` and `{slug}.dinaya.lk` subdomains |
| **Payments** | PayHere checkout and subscription billing for Pro / Max plans |
| **Operations** | Business dashboard — calendar, clients, locations, staff, automations |
| **Growth** | Reviews, referrals, directory discovery, AI workflow hub |
| **Integrations** | Google Calendar sync, webhooks, API keys, WhatsApp / SMS messaging |
| **Platform** | Internal admin for plans, support, health, and webhooks |

## Stack

- **Framework** — Next.js 16 (App Router), React 19, TypeScript
- **Data** — Neon Postgres, Drizzle ORM
- **Auth** — NextAuth (credentials)
- **Payments & comms** — PayHere, Resend; optional OpenAI for AI workflows

## Local setup

### Prerequisites

- Node.js **22** (matches CI)
- A [Neon](https://neon.tech) database

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Minimum for local development:

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

See [`.env.example`](.env.example) for PayHere, cron, Google Calendar, Redis, and optional integrations.

### 3. Database migrations

```bash
npm run db:migrate
```

### 4. Start the dev server

```bash
npm run dev
```

- Sign in: [`/auth/signin`](http://localhost:3000/auth/signin)
- Register a business: [`/register`](http://localhost:3000/register)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run lint` | ESLint |
| `npm run verify` | Lint + test + build (same as CI `verify` job) |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run docs:screenshots` | Regenerate docs UI screenshots |

## Architecture

```text
Public booking (/book/[slug])     → API routes → Neon Postgres
Business dashboard (/dashboard)   → authenticated CRUD APIs
Platform admin (/admin)           → internal operations
Cron (/api/cron/*)                → reminders, automations, AI workflows
```

Subdomain routing rewrites `{slug}.dinaya.lk` to `/book/[slug]` via middleware.

## CI & scheduled jobs

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [**CI**](.github/workflows/ci.yml) | Push to `master` / `main`, all PRs | `npm run verify`; Playwright e2e on PRs when secrets are set |
| [Automations cron](.github/workflows/automations-cron.yml) | Every 15 min | Run tenant automations |
| [Booking reminders](.github/workflows/booking-reminders-cron.yml) | Scheduled | Send booking reminders |
| [Google Calendar](.github/workflows/google-calendar-cron.yml) | Scheduled | Sync calendars |
| [AI workflows](.github/workflows/ai-workflows-cron.yml) | Scheduled | Process AI hub jobs |
| [Webhook retries](.github/workflows/webhook-retries-cron.yml) | Scheduled | Retry failed outbound webhooks |

PR e2e requires repository secrets `DATABASE_URL` and `AUTH_SECRET` — see [docs/deployment-checklist.md](docs/deployment-checklist.md#ci-e2e-pull-requests).

## Deployment

Production checklist, environment variables, cron secrets, and smoke tests:

**[docs/deployment-checklist.md](docs/deployment-checklist.md)**

## Security

- Set `AUTH_SECRET` and `SECRET_ENCRYPTION_KEY` in production.
- Protect health endpoints with `HEALTH_CHECK_SECRET` or `CRON_SECRET`.
- Cron routes require `Authorization: Bearer $CRON_SECRET`.

## Project structure

```text
src/app/          Next.js routes (booking, dashboard, admin, API, docs)
src/components/   UI for booking flow, dashboard, and docs
src/lib/          Domain logic, integrations, schemas
drizzle/          SQL migrations
.github/workflows CI and production cron invokers
public/           Static assets (including dinaya-logo.svg)
```

---

<p align="center">
  Built by <a href="https://github.com/ArdenoStudio">Ardeno Studio</a>
</p>
