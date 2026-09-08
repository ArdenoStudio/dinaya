"use client";

import type { ReactNode } from "react";
import { TextField, TextArea, Input, Label, Description, FieldError, Switch, Checkbox, Select, ListBox } from "@heroui/react";

type BaseFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  isRequired?: boolean;
  className?: string;
};

export function DashboardTextField({
  label,
  hint,
  error,
  isRequired,
  className,
  value,
  onChange,
  placeholder,
  type,
  min,
  max,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number | string;
  max?: number | string;
}) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isInvalid={Boolean(error)}
      className={className}
    >
      <Label>{label}</Label>
      <Input placeholder={placeholder} type={type} min={min} max={max} />
      {hint ? <Description>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

export function DashboardTextAreaField({
  label,
  hint,
  error,
  isRequired,
  className,
  value,
  onChange,
  placeholder,
  rows = 3,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isInvalid={Boolean(error)}
      className={className}
    >
      <Label>{label}</Label>
      <TextArea placeholder={placeholder} rows={rows} />
      {hint ? <Description>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

export function DashboardSwitch({
  label,
  isSelected,
  onChange,
  isDisabled,
}: {
  label: ReactNode;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
}) {
  return (
    <Switch.Root isSelected={isSelected} onChange={onChange} isDisabled={isDisabled}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {label}
      </Switch.Content>
    </Switch.Root>
  );
}

export function DashboardSelect<T extends string>({
  label,
  hint,
  error,
  isRequired,
  className,
  value,
  onChange,
  options,
}: BaseFieldProps & {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Select.Root
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as T)}
      isRequired={isRequired}
      isInvalid={Boolean(error)}
      className={className}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {hint ? <Description>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
      <Select.Popover>
        <ListBox.Root>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox.Root>
      </Select.Popover>
    </Select.Root>
  );
}

export function DashboardCheckbox({
  label,
  isSelected,
  onChange,
  isDisabled,
}: {
  label: ReactNode;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
}) {
  return (
    <Checkbox.Root isSelected={isSelected} onChange={onChange} isDisabled={isDisabled}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {label}
      </Checkbox.Content>
    </Checkbox.Root>
  );
}
