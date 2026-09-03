/**
 * Pure layout math for the calendar's day/week grid — extracted from the page
 * component so the overlap-resolution and height-capping logic (both a bit
 * subtle) can be unit tested independently of React/DOM.
 */

export type TimeRangeItem = {
  id: string;
  startsAt: string;
  endsAt: string;
};

export type LaidOutItem<T extends TimeRangeItem> = T & {
  col: number;
  totalCols: number;
};

export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 21;
export const CALENDAR_TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
export const CALENDAR_HOUR_HEIGHT = 56;
export const CALENDAR_MIN_EVENT_HEIGHT = 44;
/** Visible seam between back-to-back events so adjacent same-status bookings don't visually merge into one block. */
export const CALENDAR_EVENT_GAP_PX = 3;

export function topPercent(startsAt: string): number {
  const d = new Date(startsAt);
  const hour = d.getHours() + d.getMinutes() / 60;
  return Math.max(0, ((hour - CALENDAR_START_HOUR) / CALENDAR_TOTAL_HOURS) * 100);
}

/** Same as topPercent but in px, for comparing against pixel-based heights. */
export function topPx(startsAt: string): number {
  const d = new Date(startsAt);
  const hour = d.getHours() + d.getMinutes() / 60;
  return Math.max(0, (hour - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT);
}

export function eventHeightPx(startsAt: string, endsAt: string): number {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const durationHours = Math.max(0.25, (end - start) / (1000 * 60 * 60));
  return Math.max(CALENDAR_MIN_EVENT_HEIGHT, durationHours * CALENDAR_HOUR_HEIGHT);
}

/**
 * Assigns each item a column + column count so overlapping time ranges render
 * side-by-side instead of stacking on top of each other. Items are grouped
 * into clusters of mutually-touching ranges (sweeping by start time), then
 * greedily packed into the fewest columns within each cluster — the same
 * shape of algorithm most calendar UIs (Google Calendar included) use.
 */
export function layoutOverlaps<T extends TimeRangeItem>(items: T[]): LaidOutItem<T>[] {
  const sorted = [...items].sort((a, b) => {
    const startDiff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    if (startDiff !== 0) return startDiff;
    return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
  });

  const results: LaidOutItem<T>[] = [];
  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const cols: number[] = [];
    for (const item of cluster) {
      const start = new Date(item.startsAt).getTime();
      const end = new Date(item.endsAt).getTime();
      let placed = false;
      for (let i = 0; i < columnEnds.length; i++) {
        if (columnEnds[i]! <= start) {
          columnEnds[i] = end;
          cols.push(i);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columnEnds.push(end);
        cols.push(columnEnds.length - 1);
      }
    }
    const totalCols = columnEnds.length;
    cluster.forEach((item, i) => {
      results.push({ ...item, col: cols[i]!, totalCols });
    });
    cluster = [];
  }

  for (const item of sorted) {
    const start = new Date(item.startsAt).getTime();
    const end = new Date(item.endsAt).getTime();
    if (start >= clusterEnd) {
      flushCluster();
      clusterEnd = end;
    } else {
      clusterEnd = Math.max(clusterEnd, end);
    }
    cluster.push(item);
  }
  flushCluster();

  return results;
}

/**
 * Height in px for a laid-out item, capped so it never visually reaches the
 * next item that starts in the same column — a fixed pixel gap alone isn't
 * enough because CALENDAR_MIN_EVENT_HEIGHT can floor a short item's "natural"
 * height above its actual time slot, bleeding into whatever comes next.
 */
export function cappedEventHeightPx<T extends TimeRangeItem>(
  laidOut: LaidOutItem<T>[],
  item: LaidOutItem<T>,
): number {
  const natural = eventHeightPx(item.startsAt, item.endsAt);
  const myTop = topPx(item.startsAt);
  const nextInColumn = laidOut
    .filter((b) => b.col === item.col && b.id !== item.id && topPx(b.startsAt) > myTop)
    .sort((a, b) => topPx(a.startsAt) - topPx(b.startsAt))[0];
  const cap = nextInColumn ? topPx(nextInColumn.startsAt) - myTop : Infinity;
  // The cap (never overlap the next item) always wins over any "looks nice"
  // minimum — for very dense back-to-back short bookings there may not be
  // room for a comfortable box, and a thin sliver is correct, not a bug.
  return Math.max(4, Math.min(natural, cap) - CALENDAR_EVENT_GAP_PX);
}
