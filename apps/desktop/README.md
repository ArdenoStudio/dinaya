# Dinaya Desktop (Native-First v1)

Windows-focused Tauri app for daily Dinaya booking management.

## What v1 includes

- Local React desktop UI as the main app window
- Email/password business sign-in through `/api/v1/desktop/auth/login`
- Desktop API key stored in the OS keyring, not browser storage
- Native Today view and Bookings Inbox
- Booking detail panel with confirm, cancel, complete, and no-show actions
- Settings screen with logout and explicit `Open Web Dashboard` fallback
- Minimize-to-tray on close
- System tray menu, live today count, and latest-booking recovery
- Native Windows notifications for new bookings and 15-minute reminders
- Single-instance and window-state persistence plugins

Unsupported flows such as new booking creation, reports, clients, services, staff editing, billing, and advanced settings still open the web dashboard intentionally.

## Setup

1. Install Rust toolchain (`rustup`, `cargo`, `rustc`).
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

Or from repo root:

```bash
npm run desktop:dev
```

By default the app talks to `https://dinaya-lk.vercel.app`. For local API testing, run the Next.js app on port `3000`, then start desktop with:

```bash
npm run desktop:dev:local-api
```

## Manual QA Checklist

- Launch app with no stored key and confirm the native login screen appears.
- Sign in with a valid business account and confirm the native shell loads.
- Close window with `X`, confirm app hides to tray instead of quitting.
- Left-click tray icon, confirm main native window restores/focuses.
- Confirm Today and Bookings load through `/api/v1/desktop/*`.
- Confirm filters, detail panel, and status actions work.
- Confirm failed status actions rollback and show an inline error.
- Trigger a new booking and verify a native notification appears after sync.
- Confirm 15-minute reminder notifications dedupe per booking id.
- Confirm `Open Latest Booking` opens native booking detail.
- Confirm `Open Web Dashboard` opens the remote dashboard only when clicked.
- Confirm logout revokes the desktop key and returns to native login.
