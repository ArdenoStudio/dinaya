export function hasExactSlotDuration(input: {
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
}): boolean {
  const startMs = input.startsAt.getTime();
  const endMs = input.endsAt.getTime();
  return (
    Number.isFinite(startMs) &&
    Number.isFinite(endMs) &&
    endMs - startMs === input.durationMinutes * 60_000
  );
}
