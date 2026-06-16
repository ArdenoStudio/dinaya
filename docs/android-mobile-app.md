# Dinaya Android Mobile App

Dinaya can ship Android in two phases without duplicating the whole product.

## Phase 1: Public Booking App

Use the existing web booking/discovery flow as a Play Store PWA/TWA candidate.

Current foundation:

- `src/app/manifest.ts` exposes a standalone app manifest.
- `public/sw.js` registers a conservative service worker.
- `src/app/api/pwa-icon/[size]/route.ts` serves 192px and 512px PNG icons for Android install surfaces.

Before a Play Store build:

- Add `public/.well-known/assetlinks.json` after the Android package name and signing certificate fingerprint are known.
- Package with Bubblewrap or an equivalent Trusted Web Activity workflow.
- Validate installability with Lighthouse and Android Digital Asset Links.
- Smoke test booking, deal links, payment fallback, and review flows on a real Android device.

## Phase 2: Merchant Dashboard App

Build a dedicated Android app for business owners instead of porting the Windows shell directly.

Recommended shape:

- `apps/mobile` native Android project in Kotlin and Jetpack Compose.
- Reuse the existing `/api/v1/desktop/*` route contracts where they fit.
- Add mobile semantics over time: `mobile` key type, `X-Dinaya-Mobile` request marker, Android device naming, and mobile-specific rate-limit suffixes.
- Store issued device keys in Android Keystore, not web storage.
- Use FCM for booking notifications and reminders after the first authenticated dashboard slice works.

Current native app foundation:

1. Login with email/password through the existing desktop auth endpoint.
2. Store the issued bearer key with Android Keystore backed encryption.
3. Load bootstrap data, today bookings, and all major merchant dashboard modules.
4. Show the same high-level sections as the web and Windows dashboards: overview, calendar, bookings, clients, services, staff, locations, availability, reviews, payments, marketing, deals, broadcasts, AI Hub, reports, integrations, automations, billing, and settings.
5. Render typed desktop dashboard responses as native metrics and module cards, with safe booking status updates kept native.
6. Use the Dinaya web design language: blue primary actions, warm auth background, white dashboard cards, slate typography, booking status accents, and the Dinaya.lk logo mark.
7. Keep PayHere checkout, provider OAuth, billing changes, API-key management, and deeper CRUD flows as web fallbacks until native edit screens exist.

Local project entrypoint:

- `apps/mobile/README.md`
- `apps/mobile/app/src/main/java/lk/dinaya/mobile/`

Latest local debug APK:

- `deliverables/android/Dinaya-Mobile-debug.apk`
- SHA-256: `4D1D698DE2C17ABDC660EE92F3789D1FC19F9DAF38A6D0C12C34D8782E242287`

## Not Recommended As The First Path

Do not treat `apps/desktop` as a drop-in Android app. It is a Windows-focused Tauri shell with tray behavior, global shortcuts, desktop notifications, NSIS release output, and OS keyring assumptions. Tauri Android can be tested later, but it needs a mobile-specific pass and emulator/device verification.
