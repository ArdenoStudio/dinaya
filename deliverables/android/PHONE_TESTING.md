# Dinaya Android Phone Test

## APK

Install:

```text
deliverables/android/Dinaya-Mobile-debug.apk
```

This is a debug-signed APK for manual phone testing. Android may ask you to allow installs from the app you use to open the APK.

## What To Test

1. Install the APK on an Android phone.
2. Open `Dinaya`.
3. Leave the API URL as `https://dinaya-lk.vercel.app`.
4. Sign in with a Dinaya business account.
5. Confirm the app loads the business header and the Workspace, Catalog, Growth, and Configure groups.
6. Open Services, Reviews, Integrations, and Bookings to confirm native metric/cards load across the full dashboard shell.
7. Try safe booking actions only on test bookings: confirm pending, complete confirmed, or mark no-show.
8. Use Logout and reopen the app to confirm the local session clears.

## Known Limits

- This APK uses the existing `/api/v1/desktop/*` bearer-device API while the native mobile API layer is still pending.
- PayHere checkout, OAuth/provider setup, billing changes, API-key management, and deeper CRUD screens still open the web dashboard.
- The APK was installed and launched on a connected Samsung SM-S721B during this packaging pass.
- If Android says the package conflicts with an existing install, uninstall the older Dinaya test app first.
- If login fails on the phone, check that `https://dinaya-lk.vercel.app` is reachable from that phone network and that the account is an active Dinaya business account.
