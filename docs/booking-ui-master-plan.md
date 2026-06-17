# Dinaya Booking UI Master Plan

This document is the implementation handoff for upgrading Dinaya's public booking system. It is written for a coding agent or engineer who will execute the work inside this repository.

Use this plan to improve the booking experience without regressing Dinaya's existing strengths: Sri Lanka-first payments, server-backed slot holds, embeds, deals, CRM links, WhatsApp sharing, client self-service, and multi-location support.

## Cursor Cloud Agent Handoff Prompt

Paste this into Cursor Cloud Agent along with this file path:

```text
You are implementing the Dinaya booking system upgrade.

Read these files first:
- AGENTS.md
- docs/booking-ui-master-plan.md

Then inspect the current booking flow before editing:
- src/components/booking/BookingWizard.tsx
- src/components/booking/StepService.tsx
- src/components/booking/StepDateTime.tsx
- src/components/booking/StepConfirm.tsx
- src/components/booking/StaffPicker.tsx
- src/components/booking/BookingPageContent.tsx
- src/components/booking/useBookingUrlState.ts
- src/components/booking/useSlotHold.ts
- src/app/book/[slug]/confirmed/page.tsx
- src/app/book/[slug]/confirmed/PaymentStatusPoller.tsx
- src/app/client/[token]/page.tsx
- src/app/client/[token]/ClientReschedulePanel.tsx
- src/app/api/bookings/route.ts
- src/lib/intake.ts
- src/lib/booking/load-page-data.ts

Execution rules:
- Implement Phase 1 fully before Phase 2.
- Phase 3 is optional unless Phases 1 and 2 are complete and stable.
- Do not rebuild features that already exist in basic form.
- Preserve existing routes, token-based reschedule/cancel flows, slot holds, plan gating, and payment logic.
- Keep diffs minimal and follow existing project patterns.
- If schema changes are required, add a new numbered drizzle migration and update src/db/schema.ts.
- Run verification after each major phase.

Required output before finishing:
- Summary of what changed
- Any deferred items
- Exact test commands run and results
- Risks or edge cases to recheck manually
```

## Product Goal

Make Dinaya's booking flow feel faster, clearer, and more trustworthy than Cal.com for Sri Lankan businesses, while preserving Dinaya-specific product advantages.

The target experience should:

- Reduce drop-off between service selection and confirmation
- Make pricing, deposits, and payment expectations obvious
- Make staff and slot selection feel smarter
- Improve mobile usability first
- Turn the success page into a real post-booking hub
- Improve self-service reschedule and cancel flows
- Prepare the booking flow for richer intake and future advanced features

## Ground Truth: What Already Exists

Do not waste time rebuilding these from scratch.

### Already implemented

- Public booking routes:
  - `src/app/book/[slug]/page.tsx`
  - `src/app/book/[slug]/[serviceSlug]/page.tsx`
  - `src/app/book/[slug]/confirmed/page.tsx`
  - `src/app/book/[slug]/pay/page.tsx`
  - `src/app/embed/book/[slug]/page.tsx`
- URL state persistence for date, slot, staff, and deal:
  - `src/components/booking/useBookingUrlState.ts`
- Client-side step value persistence inside wizard state:
  - `src/components/booking/BookingWizard.tsx`
- Server-backed slot holds:
  - `src/components/booking/useSlotHold.ts`
  - `src/app/api/slot-reservations/route.ts`
  - `src/lib/slot-reservations.ts`
- Intake question schema and validation:
  - `src/lib/intake.ts`
- Basic intake question rendering in the confirmation step:
  - `src/components/booking/StepConfirm.tsx`
- Booking router:
  - `src/lib/booking-router.ts`
  - `src/components/booking/StepService.tsx`
- Success page, add-to-calendar, review prompt, WhatsApp share:
  - `src/app/book/[slug]/confirmed/page.tsx`
- Token-based client reschedule and cancellation:
  - `src/app/client/[token]/page.tsx`
  - `src/app/api/client/bookings/[token]/reschedule/route.ts`
  - `src/app/api/client/bookings/[token]/cancel/route.ts`
- Embed resize reporting:
  - `src/components/booking/EmbedResizeReporter.tsx`
- Payment routing across PayHere, PayPal, and manual flows:
  - `src/app/api/bookings/route.ts`
  - `src/app/api/bookings/[id]/checkout/route.ts`
  - `src/app/api/bookings/[id]/payhere-checkout/route.ts`

### Partially implemented and worth improving

- Intake renderer exists but is basic:
  - current types are only `text`, `textarea`, `select`, `boolean`
  - current rendering is visually and behaviorally minimal
- Service editor already supports intake questions:
  - `src/app/dashboard/services/new/page.tsx`
  - `src/app/dashboard/services/[id]/page.tsx`
- Payment pending success state exists:
  - `src/app/book/[slug]/confirmed/PaymentStatusPoller.tsx`
- Staff selection exists but can feel more utilitarian than helpful
- Date selection already has quick strip, month calendar, next available, and hold messaging, but can feel more polished and decisive

### Not currently present or not clearly implemented

- Custom success redirect URL
- Cancellation reason presets in client flow
- Rich intake field types and conditional logic
- Booking step state machine or reducer with named states
- Week or column booking layouts
- Advanced embed event API
- Recurring bookings
- No-show fee flow

## Non-Negotiable Guardrails

- Keep business timezone as the source of truth for availability and booking logic.
- Do not break `PayHere`, `PayPal`, manual payment fallback, or pending payment polling.
- Do not remove slot holds, idempotent booking creation, or overlap protection.
- Do not break client self-service routes or secure token behavior.
- Do not expose secrets, session tokens, payment secrets, webhook secrets, or private client data.
- Keep plan gating intact. If a feature needs gating, use existing plan patterns.
- If adding DB fields, create a new migration only. Do not edit old migrations.
- Match existing code patterns and use the `@/` alias.
- Keep the public booking experience mobile-first.

## Success Criteria

The work is successful when:

- Users can move through the booking flow with less confusion and fewer dead ends
- Pricing and payment expectations are obvious before confirmation
- Required fields and intake errors are shown inline and accessibly
- The success page acts like a useful booking destination, not just a receipt
- Reschedule and cancel flows feel like part of the same system
- Embed users get a more robust integration surface
- The codebase is easier to extend for future booking features

## Files To Read Before Changing Anything

### Core booking UI

- `src/components/booking/BookingWizard.tsx`
- `src/components/booking/StepService.tsx`
- `src/components/booking/StepLocation.tsx`
- `src/components/booking/StepDateTime.tsx`
- `src/components/booking/StepConfirm.tsx`
- `src/components/booking/StaffPicker.tsx`
- `src/components/booking/TimeSlotGrid.tsx`
- `src/components/booking/MonthCalendar.tsx`
- `src/components/booking/BookingPageContent.tsx`
- `src/components/booking/BookingServiceHub.tsx`
- `src/components/booking/useBookingUrlState.ts`
- `src/components/booking/useSlotHold.ts`

### Success and self-service

- `src/app/book/[slug]/confirmed/page.tsx`
- `src/app/book/[slug]/confirmed/PaymentStatusPoller.tsx`
- `src/app/client/[token]/page.tsx`
- `src/app/client/[token]/ClientReschedulePanel.tsx`

### Backend and shared logic

- `src/app/api/bookings/route.ts`
- `src/app/api/availability/route.ts`
- `src/app/api/availability/month/route.ts`
- `src/app/api/availability/next/route.ts`
- `src/app/api/client/bookings/[token]/reschedule/route.ts`
- `src/app/api/client/bookings/[token]/cancel/route.ts`
- `src/lib/intake.ts`
- `src/lib/booking-router.ts`
- `src/lib/booking/load-page-data.ts`
- `src/lib/booking-session.ts`
- `src/lib/slot-reservations.ts`
- `src/db/schema.ts`

## Delivery Strategy

Implement this in three phases.

Phase 1 is required.
Phase 2 is strongly recommended.
Phase 3 is optional unless time and stability allow it.

## Phase 1: Core Flow Polish And Conversion Wins

This phase should ship first. It targets the biggest UX problems without adding unnecessary product surface area.

### 1. Replace magic step numbers with named booking steps

Target files:

- `src/components/booking/BookingWizard.tsx`

Implementation goals:

- Replace raw numeric step handling with named constants or a typed union such as `service`, `dateTime`, `confirm`
- Keep the current three-step structure
- Do not change public URLs or navigation behavior
- Keep current URL sync and slot-hold behavior intact

Acceptance criteria:

- No behavior regression in the wizard
- The code is easier to read and reason about
- Future phases can extend the flow safely

### 2. Upgrade confirmation form UX and validation

Target files:

- `src/components/booking/StepConfirm.tsx`
- optionally small shared helper extraction if needed

Implementation goals:

- Add inline validation for:
  - name
  - phone
  - email format when provided
  - required intake questions
- Keep the top summary error banner if helpful, but do not rely on it alone
- Add `name`, `autoComplete`, `inputMode`, `aria-invalid`, and `aria-describedby` where appropriate
- Ensure keyboard and autofill behavior are strong on mobile
- Disable booking CTA only for truly invalid blocking cases
- Show field-level helper text or error text consistently

Acceptance criteria:

- Errors appear beside the actual field
- Required intake questions are easy to correct
- Mobile autofill and telephone keypad behavior improve
- Existing booking submission payload stays compatible with the backend

### 3. Improve intake question rendering without changing schema yet

Target files:

- `src/components/booking/StepConfirm.tsx`
- `src/lib/intake.ts` only if minor validation cleanup is needed

Implementation goals:

- Keep current question types for Phase 1
- Improve presentation and clarity:
  - better section heading
  - better spacing
  - clear required markers
  - consistent optional labeling
  - better select placeholder text
- If useful, show subtle privacy copy for sensitive questions without exposing internal flags awkwardly

Acceptance criteria:

- Existing intake schema still works
- Intake feels like part of the booking flow, not an afterthought
- No regression in stored `bookings.intake_answers`

### 4. Improve service, staff, and slot selection clarity

Target files:

- `src/components/booking/StepService.tsx`
- `src/components/booking/StaffPicker.tsx`
- `src/components/booking/StepDateTime.tsx`
- `src/components/booking/TimeSlotGrid.tsx`
- `src/components/booking/BookingDesktopSummary.tsx`

Implementation goals:

- Make selected state more obvious
- Improve empty and loading states
- Make `Any available staff` feel like a deliberate smart option, not a fallback
- Surface helpful context such as:
  - service duration
  - price
  - deposit due
  - selected staff identity
  - hold timer state
- Improve the `next available` affordance so it feels like a strong shortcut
- When a slot is lost, suggest what to do next immediately

Acceptance criteria:

- The user can understand what is selected at a glance
- Slot loss recovery is clearer
- The date-time step feels more decisive and less flat

### 5. Improve URL and interrupted-session resilience

Target files:

- `src/components/booking/useBookingUrlState.ts`
- `src/components/booking/BookingWizard.tsx`

Implementation goals:

- Preserve current date, slot, staff, and deal sync
- Evaluate whether `name`, `email`, and `phone` should also sync back to the URL
- If syncing PII to the URL feels too risky, use session storage instead for partial recovery
- Do not leak sensitive intake answers into the URL

Decision rule:

- Prefer session storage for personal data if there is any privacy concern
- Do not place freeform notes or intake answers into query params

Acceptance criteria:

- Users can recover progress better after refresh or accidental back navigation
- Privacy is not weakened

### 6. Upgrade the success page into a richer post-booking hub

Target files:

- `src/app/book/[slug]/confirmed/page.tsx`
- `src/app/book/[slug]/confirmed/PaymentStatusPoller.tsx`

Implementation goals:

- Make confirmed vs pending states more distinct
- Improve hierarchy of:
  - booking status
  - date/time
  - staff
  - manage booking
  - add to calendar
  - WhatsApp share
- Add clearer payment status messaging
- Surface useful trust info if easy to access:
  - cancellation policy
  - deposit policy
  - what happens next
- Keep review prompt and calendar actions

Acceptance criteria:

- Pending bookings feel understandable rather than ambiguous
- Confirmed bookings feel complete and reassuring
- Manage-booking action remains obvious

### 7. Verification required at end of Phase 1

- Run `npm run lint`
- Run `npm test`
- Run `npm run build`
- If practical, run `npm run verify`
- Manually smoke test:
  - `/book/[slug]`
  - `/book/[slug]/[serviceSlug]`
  - `/book/[slug]/confirmed`
  - `/embed/book/[slug]`
  - pending payment path if local configuration allows it

## Phase 2: Self-Service, Redirects, And Better Product Surface

This phase makes the system feel more complete and more competitive.

### 1. Make reschedule and cancel flows feel native to the booking system

Target files:

- `src/app/client/[token]/page.tsx`
- `src/app/client/[token]/ClientReschedulePanel.tsx`
- related token route handlers if needed

Implementation goals:

- Align the client management UI visually with the main booking flow
- Improve reschedule clarity:
  - current booking summary
  - new slot selection
  - hold messaging
  - success/error messaging
- Improve cancellation clarity:
  - what the user is cancelling
  - whether payment/deposit is affected
  - what happens next

Acceptance criteria:

- Reschedule and cancel no longer feel like separate utility pages
- The same design language appears across booking and post-booking flows

### 2. Add cancellation reason presets

Target files:

- `src/app/client/[token]/page.tsx`
- `src/app/api/client/bookings/[token]/cancel/route.ts`
- `src/db/schema.ts` only if a structured field is needed

Implementation goals:

- Add a small set of default reason presets in the client cancel flow
- Include optional freeform note
- Reuse the final reason string in the existing API if possible
- Only add DB structure if the current schema truly cannot support it

Suggested preset list:

- Schedule changed
- Found another time
- Booked by mistake
- No longer needed
- Other

Acceptance criteria:

- Cancellation reasons are easier to provide
- Existing cancel flow remains secure

### 3. Add custom success redirect support

Recommended product model:

- Add `successRedirectUrl` to `services`, not `businesses`

Rationale:

- Success behavior often depends on the service booked
- This aligns better with service-specific flows and campaigns

Target files:

- new drizzle migration
- `src/db/schema.ts`
- `src/lib/schemas/services.ts`
- `src/app/dashboard/services/new/page.tsx`
- `src/app/dashboard/services/[id]/page.tsx`
- `src/app/api/dashboard/services/route.ts`
- `src/app/api/dashboard/services/[id]/route.ts`
- `src/app/book/[slug]/confirmed/page.tsx`
- possibly booking data load helpers if needed

Implementation goals:

- Add an optional validated success redirect URL for services
- Validate to allow:
  - absolute `https://` URLs
  - optionally same-origin relative paths if desired
- On success page:
  - if redirect exists, show a short confirmation state then redirect
  - provide a visible fallback link in case auto-redirect fails
- Forward safe booking context in query params, for example:
  - `bookingId`
  - `service`
  - `staff`
  - `status`
  - `startsAt`
- Do not expose sensitive data in redirect query params

Acceptance criteria:

- Redirect works only when configured
- Default success page still works for all other services
- Redirect behavior is safe and debuggable

### 4. Add optional motion polish to wizard transitions

Target files:

- `src/components/booking/BookingWizard.tsx`
- potentially extract small animated containers

Implementation goals:

- Use the repo's existing `motion/react` patterns
- Animate step transitions lightly
- Respect reduced motion
- Do not make the booking flow feel slow

Acceptance criteria:

- Motion improves polish without harming clarity or speed
- Reduced motion users are respected

### 5. Improve embed integration surface

Target files:

- `src/components/booking/EmbedResizeReporter.tsx`
- `src/lib/booking/embed.ts`
- embed-related public script if one exists in the repo

Implementation goals:

- Keep current resize message
- Add additional postMessage events if practical:
  - `dinaya:ready`
  - `dinaya:booking_started`
  - `dinaya:booking_completed`
- Document the payload shape in code comments or docs
- If simple and safe, support CSS variable injection via query params or postMessage for host-page theming

Acceptance criteria:

- Existing embed consumers do not break
- Hosts can react to important booking milestones

### 6. Verification required at end of Phase 2

- Re-run `npm run lint`
- Re-run `npm test`
- Re-run `npm run build`
- Run `npm run verify` if practical
- Manually test:
  - client reschedule
  - client cancel
  - service with custom redirect
  - embed behavior after resize and completion

## Phase 3: Advanced Capability Layer

This phase is valuable, but should only start after Phases 1 and 2 are stable.

## 1. Expand intake to a richer form system

Target files:

- `src/lib/intake.ts`
- dashboard service editor pages
- booking confirmation renderer
- any APIs that validate service payloads

Potential improvements:

- Add richer types such as:
  - radio
  - checkbox
  - phone
  - number
  - date
- Add optional metadata:
  - placeholder
  - helpText
  - conditional visibility
- Keep backward compatibility with existing JSON data

Important:

- Avoid a schema redesign unless it is really needed
- Keep historical answers stable
- Respect `sensitive` handling

## 2. Move booking flow to a reducer or explicit state machine

Target files:

- `src/components/booking/BookingWizard.tsx`
- possibly new reducer/state files under `src/components/booking/`

Implementation goals:

- Replace the growing web of `useState` resets with explicit actions
- Make transitions deterministic
- Keep current URL sync and slot-hold integration

Suggested actions:

- `selectLocation`
- `selectService`
- `selectStaff`
- `selectAnyStaff`
- `selectDate`
- `selectSlot`
- `applyDeal`
- `updateContact`
- `updateIntake`
- `goBack`
- `goConfirm`
- `resetSelection`

## 3. Add richer layout modes if justified

Potential features:

- week view
- multi-day columns
- denser desktop layout

Only do this if:

- the current calendar experience is already solid
- the new layout clearly helps real users

Do not add layout complexity just to mirror Cal.com.

## 4. Evaluate recurring bookings

This is a real product feature, not just a UI tweak.

Before implementation:

- inspect whether schema already has enough support
- define payment and reschedule behavior for a series
- define cancellation behavior for single occurrence vs all remaining

Defer unless product requirements are clear.

## 5. Evaluate no-show fee support

This is also a product and payments feature, not only UI.

Do not implement unless:

- product rules are clear
- payment provider behavior is defined
- legal and communication implications are understood

## What Not To Rebuild

- Do not replace server-backed slot holds with cookie-only behavior
- Do not remove Dinaya's deals flow
- Do not remove booking router
- Do not remove WhatsApp share
- Do not remove pending payment handling
- Do not replace plan gating or auth patterns

## Testing Expectations

At minimum, the implementing agent should run:

```bash
npm run lint
npm test
npm run build
```

Preferred final verification:

```bash
npm run verify
```

Manual test checklist:

- Hub booking page
- Service-specific booking page
- Deal-selected booking flow
- Staff-specific and any-staff booking
- Slot hold expiration and lost-slot recovery
- Intake questions
- PayHere path
- PayPal path
- Manual bank transfer path
- Success page pending state
- Success page confirmed state
- Manage booking flow
- Reschedule flow
- Cancel flow
- Embed flow
- Mobile viewport behavior

## Final Deliverables Expected From The Implementing Agent

- Code changes for completed phases
- Any required migrations
- Any updated docs if configuration changed
- Short summary of completed work
- Explicit list of deferred items
- Exact verification commands run and results
- Any manual QA notes worth double-checking later

## Recommended Stopping Point If Time Runs Short

Stop after Phase 1 if needed.

If there is enough time for only one Phase 2 feature, prioritize this order:

1. Custom success redirect
2. Better client reschedule and cancel UX
3. Cancellation reason presets
4. Embed event improvements
5. Motion polish

## Final Note

Dinaya does not need to become a Cal.com clone.

The best version of this work keeps Dinaya's local strengths and makes the booking flow feel sharper, smarter, and more premium for Sri Lankan businesses and their customers.
