# Dinaya Deployment Checklist

Use this checklist before pushing production changes that touch schema, auth, payments, booking flow, or dashboard routes.

## Required environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `SECRET_ENCRYPTION_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_DOMAIN`
- `PAYHERE_SANDBOX`
- `RESEND_API_KEY`
- `RESEND_FROM`

`SECRET_ENCRYPTION_KEY` must stay stable. Rotating it without re-encrypting stored secrets will make PayHere merchant secrets unreadable.

## Local verification

```bash
npm run verify
npm run audit:high
```

The high-severity audit gate must pass before deployment. Moderate findings from dev tooling should be reviewed, but do not block a hotfix unless they affect production runtime.

## Database migration order

1. Confirm `DATABASE_URL` points at the intended database.
2. Run migrations before shipping code that depends on new columns or constraints:

```bash
npm run db:migrate
```

3. Confirm the latest migration appears in the Drizzle migrations table.
4. Deploy the app.
5. Smoke test:
   - `GET /api/health`
   - `/auth/signin`
   - `/dashboard`
   - one public booking page at `/book/[slug]`
   - a test booking conflict attempt for the same staff/time

## Production safety notes

- Public booking writes must rely on the database overlap constraint, not only client-side checks.
- PayHere secrets are write-only from the dashboard and encrypted before storage.
- Webhook secrets are shown only once on creation.
- New Sri Lanka-local fields are backward-compatible and default to English / Asia-Colombo.
