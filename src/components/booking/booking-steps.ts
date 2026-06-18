export const BOOKING_STEPS = ["service", "dateTime", "confirm"] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

export const BOOKING_STEP_INDEX: Record<BookingStep, number> = {
  service: 0,
  dateTime: 1,
  confirm: 2,
};

export function stepToIndex(step: BookingStep): number {
  return BOOKING_STEP_INDEX[step];
}

export function indexToStep(index: number): BookingStep {
  return BOOKING_STEPS[index] ?? "service";
}
