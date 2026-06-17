"use client";

export type ComboboxOption = {
  label: string;
  value: string;
};

export function Combobox({
  id,
  onChange,
  options,
  placeholder = "Select an option",
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  value: string;
}) {
  const listId = `${id}-options`;

  return (
    <div>
      <input
        id={id}
        list={listId}
        placeholder={placeholder}
        value={options.find((option) => option.value === value)?.label ?? value}
        onChange={(event) => {
          const selected = options.find((option) => option.label === event.target.value);
          onChange(selected?.value ?? event.target.value);
        }}
        className="h-10 w-full rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}
