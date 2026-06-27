# Booking Flow Patterns — your product SC1–SC10

Companion to `SKILL.md`. Adapted from apple-design-head scheduling patterns with **your product file paths** and server invariants.

Apply when reviewing or implementing public booking UI and APIs.

---

## Scheduling & booking (your product)

| ID | Criterion | Pass | your product paths / notes |
|----|-----------|------|----------------------|
| **SC1** | Service + price visible before time selection | User sees service name, duration, price (or "Free") before slot grid | `src/app/book/[slug]/page.tsx` hub cards; `[serviceSlug]/page.tsx` header; deals show discount |
| **SC2** | Date/time on same step when possible | Calendar + slot list on one viewport; no extra "pick time" step | `src/components/booking/` slot picker; staff selection may precede on multi-staff services |
| **SC3** | Selected slot in sticky summary on mobile | Summary shows service, staff, date, time while scrolling details | Booking step summary component; embed mode keeps compact summary |
| **SC4** | Phone/email after slot selection | Client PII collected only after slot confirmed/held | Details step after hold; aligns with `slot-reservations` POST |
| **SC5** | Slot hold timer if inventory reserved | User warned before `SLOT_HOLD_MINUTES` (5) expiry | `src/lib/booking-session.ts`; UI countdown; re-hold on expiry |
| **SC6** | Slot taken → inline recovery | Offer next slot or refresh day; no dead-end error | Handle 409 from booking API; re-fetch `/api/availability`; never silent fail |
| **SC7** | Zero slots → notify / suggest next date | Suggest next available day or waitlist CTA | `getAvailableSlots` empty → scan forward days in API or UI |
| **SC8** | Implicit progress over numbered steps | Summary line ("Haircut · Mon 3pm · Details") not "Step 2 of 5" | Hub → service → slot → details → pay/confirm |
| **SC9** | Post-book: calendar + directions + manage | Confirmed page has Add to Calendar, location, manage link | `src/app/book/[slug]/confirmed/` — `AddToCalendar.tsx`, maps link |
| **SC10** | Calendar cells + chevrons ≥44px | Touch targets on date picker and month nav | Mobile slot grid in `src/components/booking/`; pair with apple-design-head |

---

## Server-side mirror (required with SC6)

| ID | Criterion | Pass | your product paths |
|----|-----------|------|--------------|
| **SV1** | Availability API matches book validation | Same inputs produce same slot set | `src/app/api/availability/route.ts` + `src/lib/booking-availability.ts` |
| **SV2** | Hold excludes slot for other sessions | Active `slot_reservations` filtered in availability | `src/lib/slot-reservations.ts` |
| **SV3** | Timezone-consistent date keys | `YYYY-MM-DD` computed in business TZ | ``your scheduling module` (see _shared/PATHS.md)` — `toZonedTime` |
| **SV4** | Buffers in generation and validation | `beforeBuffer` / `afterBuffer` on service row | `services` schema + `getAvailableSlots` |
| **SV5** | Holidays respected | Closed days return `[]` slots | `src/lib/business-holidays.ts` in `booking-availability.ts` |
| **SV6** | Minimum notice + max advance | Service `minimumNoticeHours`, `maximumAdvanceDays` | `services` columns; filter in `getAvailableSlots` |

---

## Flow map

```
/book/[slug]                    → service hub (SC1)
/book/[slug]/[serviceSlug]      → staff (optional) → slots (SC2–SC3) → hold (SC5)
                                → client details (SC4) → pay or confirm
/book/[slug]/pay                → payment gateway redirect (ultra-payments)
/book/[slug]/confirmed          → SC9 success
/embed/book/[slug]              → same SC rules; test EM* from apple-design-head
{slug}.your-domain.com                → middleware rewrite to /book/[slug]
```

---

## Anti-patterns (auto-flag)

| Pattern | Severity | Rule |
|---------|----------|------|
| Slot math only in React component | P0 | Centralize in `availability.ts` / `booking-availability.ts` |
| Book without `isRequestedSlotAvailable` | P0 | All creation paths must validate |
| UTC date string for target market business | P0 | Use business `timezone` |
| Hold without session token | P1 | `getBookingSessionToken()` required |
| Generic "Something went wrong" on slot taken | P1 | SC6 recovery copy + next action |
| Numbered steps only, no summary | P2 | SC8 summary line |

---

## Test matrix (minimum)

| Case | Expect |
|------|--------|
| Same slot, two browsers | Second gets SC6 recovery or 409 |
| Hold expires at 5 min | Slot returns to pool; user can re-select |
| Booking at DST boundary (if TZ supports) | Correct local label |
| Service with 2h minimum notice | Morning slots hidden same day |
| Full-day override blocked | Zero slots, SC7 forward scan |
| Reschedule exclude self | `excludeBookingId` in `isRequestedSlotAvailable` |

---

## Cross-skill handoffs

- **SC8–SC10 UI craft** → `apple-design-head` (touch, loading, errors)
- **Pay step** → `ultra-payments` (CH8 confirm before redirect)
- **Confirmed notifications** → `ultra-messaging` (booking-messages.ts)
- **Voice-created bookings** → `ultra-integrations` (must pass SV1–SV6)
