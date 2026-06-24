/** Whether the wizard should show the contact / details step (not date-time). */
export function shouldShowBookingContactForm(input: {
  selectedSlot: unknown;
  timeLabel: string;
  staff: unknown;
  anyStaff: boolean;
  needsLocationPicker: boolean;
  location: unknown;
}): boolean {
  return Boolean(
    input.selectedSlot &&
      input.timeLabel &&
      (input.staff || input.anyStaff) &&
      (!input.needsLocationPicker || input.location),
  );
}
