"use client";

export type DateRange = {
  from: string;
  to: string;
};

export function DateRangePicker({
  id = "date-range",
  onChange,
  value,
}: {
  id?: string;
  onChange: (value: DateRange) => void;
  value: DateRange;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="sr-only" htmlFor={`${id}-from`}>
        From date
      </label>
      <input
        id={`${id}-from`}
        type="date"
        value={value.from}
        onChange={(event) => onChange({ ...value, from: event.target.value })}
        className="h-10 rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="hidden text-sm text-muted-foreground sm:inline">to</span>
      <label className="sr-only" htmlFor={`${id}-to`}>
        To date
      </label>
      <input
        id={`${id}-to`}
        type="date"
        value={value.to}
        onChange={(event) => onChange({ ...value, to: event.target.value })}
        className="h-10 rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
