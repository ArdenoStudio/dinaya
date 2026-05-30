# Dinaya Desktop

Windows-focused Tauri 2 app for running a Dinaya booking business natively. The desktop
app is now a full native dashboard: every sidebar route renders a native workspace backed
by the `/api/v1/desktop/*` API, with the web dashboard kept only as an intentional fallback
for provider and cookie-auth flows.

## Authentication

- Email/password business sign-in through `/api/v1/desktop/auth/login`.
- The desktop API key is stored in the OS secure keyring, not browser storage.
- Desktop requests use bearer-key auth, which is deliberately separate from the web
  dashboard's browser-cookie session. That separation is why provider flows fall back to
  the default browser (see below).

## Native workspaces

Driven by the shared route map in `src/lib/dashboard-route-map.ts`, all routes render
natively:

- **Workspace** — Overview (today stats, upcoming, pending actions, activity, share),
  Calendar (day/week with staff filters and status colors), Bookings (today/upcoming/past,
  search, filters, detail panel, status actions).
- **Catalog** — Services, Staff, Locations, and Availability. Includes native editing of
  weekly availability windows plus blocked/custom date overrides.
- **Growth** — Reviews (native replies and visibility), Payments, Marketing, Deals,
  Broadcasts, AI Hub (workflow history, per-branch AI toggles, content generation,
  reactivation launcher), and Reports (metrics, date filters, CSV export).
- **Configure** — Integrations (connection status with native detail), Automations
  (enable/disable, run history), Plan & billing (current plan, usage, entitlements), and
  Settings (business profile editing, desktop device list, revoke-current-device).

Each workspace has loading, empty, and inline error states, search/filter controls, and an
"Open in browser" escape hatch.

## Productivity and system integration

- Command palette for routes and actions (`Ctrl+Shift+K`) and a global search box.
- Native print and CSV export for the bookings list and the day sheet.
- Offline read cache so recently loaded data stays visible during connectivity blips.
- Minimize-to-tray on window close; single-instance enforcement.
- System tray menu with a live today count and latest-booking recovery.
- Native Windows notifications for new bookings and 15-minute reminders (deduped per
  booking id).

## Intentional web-dashboard fallbacks

Some flows still open the web dashboard in the **default browser** on purpose, because they
depend on the browser-cookie session or on external provider UIs:

- Billing/PayHere checkout, plan upgrades, and "manage billing".
- Advanced integration/provider setup (social connect, voice receptionist).
- API key management (`/dashboard/settings/api-keys`) and full settings.
- Opening a specific booking in the web dashboard.
- Auth flows reached from the native login screen (register, forgot password).

These fallbacks are validated against a path allowlist in the Rust commands, so they cannot
be redirected to arbitrary URLs.

## Setup

1. Install the Rust toolchain (`rustup`, `cargo`, `rustc`).
2. Install Visual Studio Build Tools with the C++ workload.
3. Install desktop dependencies:

```bash
cd apps/desktop
npm install
```

4. Run in development:

```bash
npm run dev
```

Or from the repo root:

```bash
npm run desktop:dev
```

By default the app talks to `https://dinaya-lk.vercel.app`. For local API testing, run the
Next.js app on port `3000`, then start desktop against it:

```bash
npm run desktop:dev:local-api
```

## Build and release

- Build a local installer (NSIS Windows setup): `npm run build` here, or
  `npm run desktop:build` from the repo root.
- Production-readiness audit: `npm run desktop:audit` from the repo root.
- Smoke test: `npm run desktop:smoke` from the repo root.

Publishing a signed-off installer is automated by `.github/workflows/desktop-release.yml`,
which triggers on tags matching `desktop-v*`. Pushing such a tag builds on `windows-latest`
via `tauri-action` and publishes a public GitHub Release with the Windows installer. The tag
must point at a commit that already contains the desktop changes you want shipped.

```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```

## Manual QA checklist

- Launch with no stored key and confirm the native login screen appears.
- Sign in with a valid business account and confirm the native dashboard shell loads.
- Close the window with `X` and confirm the app hides to tray instead of quitting.
- Left-click the tray icon and confirm the main window restores/focuses.
- Open each sidebar route and confirm native data loads through `/api/v1/desktop/*`.
- Confirm filters/search, detail panels, and edit/save actions work where provided.
- Confirm failed actions roll back and show a readable inline error.
- Trigger a new booking and verify a native notification appears after sync.
- Confirm 15-minute reminder notifications dedupe per booking id.
- Confirm `Open Latest Booking` opens the native booking detail.
- Confirm provider fallbacks (billing checkout, integration setup, API keys) open the web
  dashboard in the default browser only when clicked.
- Confirm logout revokes the desktop key and returns to the native login screen.
