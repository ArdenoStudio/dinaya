# Dinaya Booking UI V2 — Master Plan

This document supersedes `booking-ui-master-plan.md` for the visual rebuild.
The goal is to replace Dinaya's step-based wizard with a Cal.com-style **state-machine layout** — additive columns that slide in, a sticky service panel, and framer-motion animations throughout. Every Dinaya-specific feature (slot holds, deals, PayHere/PayPal/bank, WhatsApp, LKR pricing) is preserved.

---

## What We Are Copying from Cal.com (Concepts, Not Code)

| Cal.com pattern | Dinaya equivalent to build |
|---|---|
| CSS Grid `gridTemplateAreas` state machine | Same — 3 named grid areas: `meta`, `main`, `timeslots` |
| `BookerSection` animated panel component | `BookingPanel` component |
| `EventMeta` sticky left panel | `ServiceMetaPanel` |
| `DatePicker` center panel | Refactored `DatePanel` (keep our existing calendar/strip) |
| `AvailableTimeSlots` full-width vertical list | `SlotListPanel` (replaces `TimeSlotGrid` grid) |
| `BookEventForm` slides in replacing timeslots | `FormPanel` (wraps refactored `StepConfirm`) |
| `fadeInLeft` / `fadeInUp` framer-motion config | Copy exact values — see Animation Spec below |
| `LazyMotion` + `AnimatePresence` wrapper | Same |
| `useBookerResizeAnimation` grid width animation | `useBookingLayoutAnimation` hook |
| Mobile bottom sheet for timeslots | `SlotPickerSheet` dialog |
| State machine: `selecting_date → selecting_time → booking` | `selecting_service → selecting_date → selecting_time → booking` |

---

## Booking State Machine

```ts
type BookingUIState =
  | "selecting_service"   // hub pages with multiple services (skip for single-service pages)
  | "selecting_date"      // service locked, picking a date
  | "selecting_time"      // date picked, timeslots column slides in
  | "booking";            // slot held, form panel slides in replacing timeslots
```

### State Transitions

```
[Hub page]
  selecting_service ──(tap service)──► selecting_date

[Single-service page]
  (auto-advance)         ──────────► selecting_date

selecting_date ──(tap date)──► selecting_time
selecting_time ──(tap slot + hold succeeds)──► booking
booking ──(tap back)──► selecting_time
selecting_time ──(tap date)──► selecting_time (slots reload)
selecting_date ──(tap different service — hub only)──► selecting_service
```

---

## Grid Layout Specification

### CSS Custom Properties

```css
/* Set on the root grid container */
--booker-meta-width: 280px;        /* slightly wider than Cal.com 240px — need room for staff chips */
--booker-main-width: 480px;
--booker-timeslots-width: 260px;   /* slightly wider than Cal.com 240px — LKR labels need space */

/* In "booking" state, meta gets wider so form fits better */
--booker-meta-width-booking: 340px;
--booker-main-width-booking: 420px;
```

### Grid Template Areas per State

```
selecting_service (mobile): full-width service list, no grid
selecting_service (desktop): full-width service cards, no grid

selecting_date:
  gridTemplateAreas: '"meta main" "meta main"'
  gridTemplateColumns: 'var(--booker-meta-width) var(--booker-main-width)'
  width: calc(var(--booker-meta-width) + var(--booker-main-width))

selecting_time:
  gridTemplateAreas: '"meta main timeslots" "meta main timeslots"'
  gridTemplateColumns: 'var(--booker-meta-width) 1fr var(--booker-timeslots-width)'
  width: calc(var(--booker-meta-width) + var(--booker-main-width) + var(--booker-timeslots-width))
  /* the grid expands rightward — this is the Cal.com "magic" */

booking:
  gridTemplateAreas: '"meta main" "meta main"'
  gridTemplateColumns: 'var(--booker-meta-width-booking) var(--booker-main-width-booking)'
  width: calc(var(--booker-meta-width-booking) + var(--booker-main-width-booking))
  /* timeslots column disappears, meta widens slightly */
```

### Width Transition

Apply `sm:transition-[width] sm:duration-300 sm:motion-reduce:transition-none` on the grid container.
The grid width itself is NOT animated by framer-motion (CSS is better at calc() values).
Only `height` is animated by framer-motion when needed.

### Mobile Layout (< md breakpoint)

No grid on mobile — full-screen stacked layout:

```
selecting_service:  full-screen service list
selecting_date:     full-screen date picker (meta panel hidden, shown inline above)
selecting_time:     Bottom sheet dialog slides up with slot list
booking:            Full-screen form (Dialog or direct panel)
```

---

## Animation Specification (exact Cal.com values)

Create `src/lib/booking/booking-animations.ts`:

```ts
import type { Variants } from "motion/react";

// Panel slides in from right (used when new column appears)
export const fadeInLeft = {
  variants: {
    visible: { opacity: 1, x: 0 },
    hidden:  { opacity: 0, x: 20 },
  } satisfies Variants,
  initial:   "hidden",
  exit:      "hidden",
  animate:   "visible",
  transition: { ease: "easeInOut", delay: 0.1 },
};

// Content within a panel fades up (used inside ServiceMetaPanel)
export const fadeInUp = {
  variants: {
    visible: { opacity: 1, y: 0 },
    hidden:  { opacity: 0, y: 20 },
  } satisfies Variants,
  initial:   "hidden",
  exit:      "hidden",
  animate:   "visible",
  transition: { ease: "easeInOut", delay: 0.1 },
};

// Content slides in from right (used for form panel replacing slots)
export const fadeInRight = {
  variants: {
    visible: { opacity: 1, x: 0 },
    hidden:  { opacity: 0, x: -20 },
  } satisfies Variants,
  initial:   "hidden",
  exit:      "hidden",
  animate:   "visible",
  transition: { ease: "easeInOut", delay: 0.1 },
};

// Grid resize animation (applied to container height only)
export const RESIZE_DURATION   = 0.5;
export const RESIZE_EASE       = [0.4, 0, 0.2, 1] as const; // cubicBezier
```

### How to Apply LazyMotion

Wrap the entire wizard once at the top level:

```tsx
import { LazyMotion, AnimatePresence } from "motion/react";

// Separate file — keeps motion features tree-shakeable
// src/lib/booking/booking-motion-features.ts
export { default } from "motion/react/features/dom";

// In BookingWizard.tsx
<LazyMotion strict features={loadMotionFeatures}>
  <BookingWizardInner ... />
</LazyMotion>
```

### Reduced Motion

```ts
import { useReducedMotion } from "motion/react";

// In useBookingLayoutAnimation hook:
const prefersReducedMotion = useReducedMotion();
// If true, set styles directly (no framer animate call)
```

---

## Component Architecture

### New files to create

```
src/components/booking/
├── BookingPanel.tsx              ← NEW: grid-area motion div (BookerSection equivalent)
├── ServiceMetaPanel.tsx          ← NEW: sticky left panel (EventMeta equivalent)
├── DatePanel.tsx                 ← NEW: date-only panel (extracted from StepDateTime)
├── SlotListPanel.tsx             ← NEW: full-width vertical slot list (replaces TimeSlotGrid)
├── FormPanel.tsx                 ← NEW: form panel wrapper (wraps StepConfirm)
├── SlotPickerSheet.tsx           ← NEW: mobile bottom sheet for timeslots
└── booking-animations.ts → move to src/lib/booking/booking-animations.ts
```

### Files to significantly refactor

```
src/components/booking/BookingWizard.tsx    ← MAJOR: replace step state with state machine + grid
src/components/booking/StepDateTime.tsx     ← SPLIT: date part → DatePanel, time part → SlotListPanel
src/components/booking/StepConfirm.tsx      ← WRAP: becomes content inside FormPanel
src/components/booking/TimeSlotGrid.tsx     ← REPLACE: SlotListPanel replaces this
```

### Files to keep unchanged

```
MonthCalendar.tsx       DateQuickStrip.tsx     StaffPicker.tsx
StepService.tsx         StepLocation.tsx       StepStaff.tsx
BookingTheme.tsx        BookingThemeToggle.tsx BookingBranding.tsx
BookingDealsSection.tsx BookingAttributionCapture.tsx
BookingMobileTrustStrip.tsx BookingServiceHub.tsx
EmbedResizeReporter.tsx ReviewsWidget.tsx      StarRating.tsx
useBookingUrlState.ts   useSlotHold.ts         BookingPwa.tsx
```

---

## Component Specs

### 1. `BookingPanel.tsx`

The Cal.com `BookerSection` equivalent. A `motion.div` that sits in a named CSS grid area.

```tsx
"use client";
import { m } from "motion/react";
import type { MotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type GridArea = "meta" | "main" | "timeslots";

interface BookingPanelProps extends MotionProps {
  area: GridArea;
  visible?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Grid area class map (must be static strings so Tailwind includes them)
const AREA_CLASS: Record<GridArea, string> = {
  meta:      "[grid-area:meta]",
  main:      "[grid-area:main]",
  timeslots: "[grid-area:timeslots]",
};

export function BookingPanel({ area, visible, className, children, ...motionProps }: BookingPanelProps) {
  if (visible === false) return null;
  return (
    <m.div className={cn(AREA_CLASS[area], className)} layout {...motionProps}>
      {children}
    </m.div>
  );
}
```

### 2. `ServiceMetaPanel.tsx`

The sticky left panel. Shows business identity, selected service info, staff, and (once a slot is held) the confirmed slot + hold timer.

Content sections (in order):

```
┌─────────────────────────────┐
│  [Logo]  Business name      │  ← always
│          dinaya.lk/slug     │
├─────────────────────────────┤
│  [Deals strip if active]    │  ← BookingDealsSection here
├─────────────────────────────┤
│  SERVICE (once selected)    │  ← fadeInUp when service picked
│  Name · Duration · Price    │
│  Deposit note if any        │
│  Description (2 lines max)  │
├─────────────────────────────┤
│  STAFF (if multi-staff)     │  ← StaffPicker compact mode
├─────────────────────────────┤
│  SELECTED TIME (once held)  │  ← fadeInUp when slot confirmed
│  ✓ Tue 14 Jan · 9:00 AM    │  (green)
│  ⏱ 8:47 remaining          │  ← hold countdown
├─────────────────────────────┤
│  [Branding footer]          │  ← BookingBranding
└─────────────────────────────┘
```

Props interface:
```ts
interface ServiceMetaPanelProps {
  business: BookingBusiness;
  bookingUrlLabel: string;
  businessIcon?: string | null;
  service: BookingService | null;
  staff: Staff | null;
  anyStaff: boolean;
  allStaff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  staffLocationMap: { staffId: string; locationId: string }[];
  locationId?: string | null;
  needsStaffPicker: boolean;
  selectedDate: string;
  timeLabel: string;
  holdLabel: string | null;
  selectedDeal: DealListItem | null;
  activeDeals: DealListItem[];
  copy: BookingCopy;
  showBranding: boolean;
  onSelectDeal: (deal: DealListItem | null) => void;
  onSelectStaff: (staff: Staff) => void;
  onSelectAnyStaff: () => void;
  slotUnavailable: boolean;
}
```

Animation: wrap the service block and the selected-time block each in `<m.div {...fadeInUp}>` so they fade up when they appear.

On desktop: `sticky top-0 self-start` so it stays visible while scrolling.

### 3. `DatePanel.tsx`

Extracted from `StepDateTime`. Contains only the date-selection UI.

```
┌─────────────────────────────────┐
│  [← Prev]  June 2026  [Next →] │  ← MonthCalendar navigation
│  Quick strip: Today +6 days     │  ← DateQuickStrip
│  Full month calendar (toggle)   │  ← MonthCalendar
│  "Next available: Thu 19 Jun"   │  ← nextAvailable button
└─────────────────────────────────┘
```

Props: everything currently in `StepDateTime` that relates to date selection.
Selecting a date fires `onDateChange(date)` which advances state to `selecting_time`.

Remove: "Continue" button (no longer needed — selecting a slot advances state automatically).
Remove: Back button (no longer needed — state machine handles navigation).

### 4. `SlotListPanel.tsx`

Replaces `TimeSlotGrid`. Full-width vertical list — the biggest visual change.

```
┌────────────────────────────────────────────┐
│  Tuesday, 14 June                          │  ← date header
├────────────────────────────────────────────┤
│  Morning                                   │  ← period group label
│  ┌──────────────────────────────────────┐  │
│  │  9:00 AM                           → │  │  ← slot button (full width)
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  10:30 AM                          → │  │
│  └──────────────────────────────────────┘  │
│  Afternoon                                 │
│  ┌──────────────────────────────────────┐  │
│  │  2:00 PM                           → │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

Slot button design:
- Full width, `h-12` height
- `rounded-xl border` default, `booking-bg-accent text-white` when selected
- Time label left-aligned, chevron right-aligned
- On selected: show end time faintly below time (e.g. "ends 10:00 AM")
- `aria-pressed`, `aria-label` with time for accessibility
- Keep morning/afternoon/evening grouping (this is better than Cal.com)

Loading state: 8 full-width skeleton bars.

```tsx
// Skeleton
{Array.from({ length: 8 }).map((_, i) => (
  <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800" />
))}
```

Empty states: same copy as today (dayClosed, capacityReached, noSlots) but rendered as a centered empty panel.

### 5. `FormPanel.tsx`

Thin wrapper that slides in with `fadeInLeft` and contains the existing `StepConfirm` content.

```tsx
import { m } from "motion/react";
import { fadeInLeft } from "@/lib/booking/booking-animations";

export function FormPanel({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      className="flex h-full flex-col px-6 py-5"
      {...fadeInLeft}
    >
      {children}
    </m.div>
  );
}
```

StepConfirm itself needs one addition: a back button at top that calls `onBack()` which transitions state back to `selecting_time`.

### 6. `SlotPickerSheet.tsx` (mobile only)

Mobile bottom sheet that shows `SlotListPanel` when a date is selected.
Uses the existing `@radix-ui/react-dialog` already in the project.

```tsx
// Triggered when: isMobile && state === "selecting_time"
// Dialog with bottom-slide-in animation
// Full screen height, shows date header + SlotListPanel
// Tap slot → hold → close sheet → advance to "booking" state
```

---

## Refactoring `BookingWizard.tsx`

### State machine replacing step numbers

**Before:**
```ts
const [step, setStep] = useState(0); // 0, 1, 2
```

**After:**
```ts
type BookingUIState = "selecting_service" | "selecting_date" | "selecting_time" | "booking";
const [uiState, setUiState] = useState<BookingUIState>(
  initialService ? "selecting_date" : "selecting_service"
);
```

### Grid container

```tsx
<div
  ref={animationScope}
  className={cn(
    "grid max-w-full items-start",
    "bg-white dark:bg-neutral-900",
    "border-subtle rounded-xl border",
    "sm:transition-[width] sm:duration-300 sm:motion-reduce:transition-none",
    uiState === "selecting_time"
      ? "[grid-template-areas:'meta_main_timeslots'] [grid-template-columns:var(--booker-meta-width)_1fr_var(--booker-timeslots-width)]"
      : uiState === "booking"
      ? "[grid-template-areas:'meta_main'] [grid-template-columns:var(--booker-meta-width-booking)_var(--booker-main-width-booking)]"
      : "[grid-template-areas:'meta_main'] [grid-template-columns:var(--booker-meta-width)_var(--booker-main-width)]"
  )}
  style={{
    "--booker-meta-width": "280px",
    "--booker-main-width": "480px",
    "--booker-timeslots-width": "260px",
    "--booker-meta-width-booking": "340px",
    "--booker-main-width-booking": "420px",
  } as React.CSSProperties}
>
```

Note: Tailwind v3 does not support dynamic arbitrary values in `grid-template-areas` directly — use `style` prop for the grid template strings, class for everything else.

Actually, use inline style for grid-template-areas and grid-template-columns:

```tsx
// computed in a useMemo
const gridStyle = useMemo((): React.CSSProperties => {
  const base = {
    "--booker-meta-width": "280px",
    "--booker-main-width": "480px",
    "--booker-timeslots-width": "260px",
    "--booker-meta-width-booking": "340px",
    "--booker-main-width-booking": "420px",
  } as React.CSSProperties;

  if (uiState === "selecting_time") return {
    ...base,
    gridTemplateAreas: `"meta main timeslots" "meta main timeslots"`,
    gridTemplateColumns: `var(--booker-meta-width) 1fr var(--booker-timeslots-width)`,
  };
  if (uiState === "booking") return {
    ...base,
    gridTemplateAreas: `"meta main" "meta main"`,
    gridTemplateColumns: `var(--booker-meta-width-booking) var(--booker-main-width-booking)`,
  };
  return {
    ...base,
    gridTemplateAreas: `"meta main" "meta main"`,
    gridTemplateColumns: `var(--booker-meta-width) var(--booker-main-width)`,
  };
}, [uiState]);
```

### AnimatePresence usage

```tsx
<AnimatePresence mode="wait">
  {/* ServiceMeta — always present in date/time/booking states */}
  {uiState !== "selecting_service" && (
    <BookingPanel key="meta" area="meta" className="sticky top-0 self-start">
      <ServiceMetaPanel ... />
    </BookingPanel>
  )}

  {/* Date panel — visible in selecting_date and selecting_time states */}
  {(uiState === "selecting_date" || uiState === "selecting_time") && (
    <BookingPanel key="main" area="main" {...fadeInLeft}>
      <DatePanel ... />
    </BookingPanel>
  )}

  {/* Timeslots panel — slides in when state becomes selecting_time */}
  {uiState === "selecting_time" && (
    <BookingPanel key="timeslots" area="timeslots" {...fadeInLeft}
      className="border-l border-gray-100 dark:border-neutral-800 px-5 py-4">
      <SlotListPanel ... />
    </BookingPanel>
  )}

  {/* Form panel — replaces timeslots in booking state */}
  {uiState === "booking" && (
    <BookingPanel key="main-form" area="main" {...fadeInLeft}
      className="border-l border-gray-100 dark:border-neutral-800">
      <FormPanel>
        <StepConfirm ... onBack={() => setUiState("selecting_time")} />
      </FormPanel>
    </BookingPanel>
  )}
</AnimatePresence>
```

### State transitions

```ts
// Date selected → advance to selecting_time
const handleDateChange = (date: string) => {
  update({ date, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
  setSelectedSlot(null);
  void slotHold.releaseHold();
  if (uiState === "selecting_date") setUiState("selecting_time");
};

// Slot selected + hold succeeds → advance to booking
const selectSlot = useCallback(async (slot: SlotData) => {
  const holdSlot = { ...slot, staffId: slot.staffId ?? state.staff?.id };
  const ok = await slotHold.reserveSlot(holdSlot);
  if (!ok) {
    setSelectedSlot(null);
    setState(s => ({ ...s, timeSlot: "", timeSlotEnd: "", timeLabel: "" }));
    return;
  }
  // assign staff...
  setSelectedSlot(slot);
  setState(s => ({ ...s, staff: assignedStaff ?? s.staff, timeSlot: ..., ... }));
  setUiState("booking"); // ← advance here
}, [...]);

// Service selected → advance to selecting_date
const selectService = useCallback((service: BookingService) => {
  // ... existing logic ...
  setUiState("selecting_date");
}, [...]);

// Back from form → selecting_time
// Back from timeslots → selecting_date
```

### Mobile adaptations

```ts
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);
```

On mobile:
- No grid — full-screen layout
- `ServiceMetaPanel` shown as a compact top strip (logo + service name + hold timer only)
- Date picker is full screen
- When date is selected → open `SlotPickerSheet` (bottom sheet dialog)
- When slot is selected → close sheet → show full-screen `FormPanel`

---

## `useBookingLayoutAnimation` Hook

Mirrors Cal.com's `useBookerResizeAnimation`. Uses `motion/react`'s `useAnimate` to animate only the height of the grid container (width is handled by CSS transition).

```ts
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { RESIZE_DURATION, RESIZE_EASE } from "@/lib/booking/booking-animations";

export function useBookingLayoutAnimation(uiState: BookingUIState) {
  const prefersReducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) return;
    if (prefersReducedMotion) return;
    // Only animate height — width is handled by CSS
    animate(scope.current, { height: "auto" }, {
      duration: RESIZE_DURATION,
      ease: RESIZE_EASE,
    });
  }, [uiState, animate, scope, prefersReducedMotion]);

  return scope;
}
```

---

## Service Selection for Hub Pages

Hub pages (`/book/[slug]` with multiple services) currently show `StepService` in a sidebar. With the new layout, when `uiState === "selecting_service"` we render a **full-width service picker** above the grid, then the grid appears below once a service is chosen.

Option A (simple): Full-width service cards, clicking one fades them out and grid fades in.
Option B (preferred): Same layout but service cards occupy the `main` area, `meta` shows just business identity. Once a service is selected, `meta` transitions to full `ServiceMetaPanel` content.

Implement Option B:

```tsx
{uiState === "selecting_service" && (
  <>
    <BookingPanel key="meta-service" area="meta">
      <BusinessIdentityBlock business={business} bookingUrlLabel={bookingUrlLabel} />
    </BookingPanel>
    <BookingPanel key="main-service" area="main" {...fadeInLeft}>
      <div className="p-6">
        <StepService services={services} selected={null} copy={copy} onSelect={selectService} />
      </div>
    </BookingPanel>
  </>
)}
```

---

## What Changes on Each File

### `BookingWizard.tsx`
- Remove `step` state → add `uiState: BookingUIState`
- Remove `ProgressPills` and `DesktopProgressBar` components entirely
- Wrap with `LazyMotion`
- Replace 2-col grid div with animated grid container
- Replace `step < 2` and `step === 2` branches with `uiState`-based `AnimatePresence` blocks
- Add `useBookingLayoutAnimation` hook
- Add `isMobile` check
- Slot selection no longer calls `setStep(2)` — calls `setUiState("booking")`
- Date change now also sets `setUiState("selecting_time")`
- Keep all existing: `useSlotHold`, `useBookingUrlSync`, `selectedDeal`, `applyDeal`, `handleConfirmed`

### `StepConfirm.tsx`
- Add a back button at the very top (`← Change time`) that calls `onBack()`
- Add inline field-level validation (name required, phone required, email format)
- `aria-invalid`, `aria-describedby`, `inputMode="tel"`, `autoComplete` attributes on all fields
- Error shown beside each field, not just a top banner
- No other structural changes — this component's logic is sound

### `StepDateTime.tsx`
- Extract date-selection logic (calendar, quick strip, next-available, month status) into `DatePanel.tsx`
- Extract slot-loading logic (fetch, poll, empty states) into `SlotListPanel.tsx`
- `StepDateTime.tsx` can remain as a compatibility wrapper that imports both, or be deprecated

### `TimeSlotGrid.tsx`
- Keep the file for now (do not delete until `SlotListPanel` is confirmed stable)
- `SlotListPanel` takes the same props and replaces it in all usages

---

## Delivery Order (Phases)

### Phase 1 — Foundation (no visual change yet)
1. Create `src/lib/booking/booking-animations.ts` with exact animation values
2. Create `BookingPanel.tsx`
3. Add `BookingUIState` type to `BookingWizard.tsx`
4. Replace `step` with `uiState` state, keep behavior identical (map: 0→selecting_date, 1→selecting_date, 2→booking)
5. Wrap with `LazyMotion`
6. Verify: `npm run lint && npm test && npm run build`

### Phase 2 — Grid layout
1. Replace the 2-col div with the animated grid container + `style` prop
2. Wire `gridStyle` memo to `uiState`
3. Add `useBookingLayoutAnimation` hook
4. Move time slots into `BookingPanel area="timeslots"`
5. Move form into `BookingPanel area="main"` for booking state
6. Verify all three states render correctly
7. Verify: build + smoke test

### Phase 3 — ServiceMetaPanel
1. Create `ServiceMetaPanel.tsx`
2. Move `BusinessIdentity`, `BusinessAvatar`, `BookingDealsSection`, `StaffPicker`, `BookingDesktopSummary` content into `ServiceMetaPanel`
3. Add `fadeInUp` on service block and selected-time block
4. Make it `sticky top-0 self-start` on desktop
5. Verify deals, staff picker, hold timer still work

### Phase 4 — SlotListPanel
1. Create `SlotListPanel.tsx` with full-width slot buttons
2. Keep morning/afternoon/evening grouping
3. Keep all loading/empty states
4. Replace `TimeSlotGrid` with `SlotListPanel` in the grid
5. Verify slot selection, hold, and slot-unavailable recovery work

### Phase 5 — Mobile
1. Add `isMobile` detection
2. Create `SlotPickerSheet.tsx` (bottom sheet with `SlotListPanel`)
3. On mobile: date select → open sheet; slot select → close sheet → show form full-screen
4. Compact meta strip on mobile (logo + service name + hold timer)
5. Verify on 375px and 390px viewports

### Phase 6 — FormPanel + StepConfirm UX
1. Create `FormPanel.tsx` wrapper with `fadeInLeft`
2. Add back button to `StepConfirm`
3. Add inline field validation to `StepConfirm`
4. Add `autoComplete`, `inputMode`, `aria-*` attributes
5. Verify payment flows (PayHere, PayPal, bank) still work

### Phase 7 — Polish + verification
1. `npm run lint && npm test && npm run build`
2. Smoke test all paths:
   - Hub page (multiple services)
   - Single-service page
   - Deal-selected flow
   - Staff-specific + any-staff
   - Slot hold expiration + loss recovery
   - PayHere path
   - PayPal path
   - Bank transfer path
   - Success page pending + confirmed states
   - Manage/reschedule/cancel flow
   - Embed mode
   - Mobile (375px + 390px viewports)
   - Dark mode

---

## Guardrails (Do Not Break)

- Never remove slot holds, idempotent booking creation, or overlap protection
- Never remove `PayHere`, `PayPal`, manual payment fallback, or pending payment polling
- Never remove deals flow or `applyDeal` logic
- Never remove WhatsApp share or add-to-calendar on success page
- Never remove client self-service reschedule/cancel token flows
- Never expose secrets or PII in URLs
- Keep plan gating intact
- Keep embed resize reporting working (`EmbedResizeReporter`)
- Keep dark mode working — all new components must support `dark:` variants
- Respect `prefers-reduced-motion` — skip all framer-motion animations when set
- Keep existing URL state sync (`useBookingUrlState`) working
- If adding DB fields, create new migration only — never edit old migrations
- Match `@/` import alias throughout

---

## Non-Goals for This Rebuild

- Do not add week view or column view (Cal.com layout variants)
- Do not add recurring bookings
- Do not add no-show fee flow
- Do not redesign the dashboard or success page in this pass
- Do not change any API routes or booking data schema
- Do not change the confirmed/pay/client-token pages in this pass
- Do not add features not already in the codebase

---

## Files To Read Before Touching Anything

```
src/components/booking/BookingWizard.tsx
src/components/booking/StepDateTime.tsx
src/components/booking/StepConfirm.tsx
src/components/booking/TimeSlotGrid.tsx
src/components/booking/StaffPicker.tsx
src/components/booking/BookingDesktopSummary.tsx
src/components/booking/useSlotHold.ts
src/components/booking/useBookingUrlState.ts
src/lib/booking/load-page-data.ts
src/lib/booking-staff.ts
src/app/api/bookings/route.ts
```

---

## Prompt for Implementing Agent

```
You are rebuilding Dinaya's public booking UI to use a Cal.com-style state-machine layout.

Read these files first:
- AGENTS.md
- docs/booking-ui-v2-plan.md   ← THIS FILE

Then inspect before editing:
- src/components/booking/BookingWizard.tsx
- src/components/booking/StepDateTime.tsx
- src/components/booking/StepConfirm.tsx
- src/components/booking/TimeSlotGrid.tsx
- src/components/booking/StaffPicker.tsx
- src/components/booking/BookingDesktopSummary.tsx
- src/components/booking/useSlotHold.ts
- src/lib/booking/load-page-data.ts

Execution rules:
- Implement phases in order: 1 → 2 → 3 → 4 → 5 → 6 → 7
- Run `npm run build` after each phase before continuing
- Do not break any existing payment flows (PayHere, PayPal, bank transfer)
- Do not remove slot holds, deals, or any Dinaya-specific features
- Use `motion/react` (already installed at v12) for all animations
- Copy animation values exactly from the Animation Specification in this document
- Dark mode: every new component must have `dark:` variants

Required output before finishing:
- Summary of what changed per phase
- Any deferred items
- Build output confirming zero errors
- Verification commands run and results
- Any manual QA items to double-check
```
