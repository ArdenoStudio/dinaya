"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { format, parseISO } from "date-fns";
import { Icon } from "@/components/ui/Icon";
import type { BookingCopy } from "@/lib/i18n";
import { SlotListPanel } from "./SlotListPanel";
import type { SlotEmptyState, SlotOption } from "./TimeSlotGrid";

interface SlotPickerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  slots: SlotOption[];
  selectedStartUtc: string | null;
  copy: BookingCopy;
  onSelect: (slot: SlotOption) => void;
  loading: boolean;
  emptyState: SlotEmptyState;
  timezone: string;
}

export function SlotPickerSheet({
  open,
  onClose,
  selectedDate,
  slots,
  selectedStartUtc,
  copy,
  onSelect,
  loading,
  emptyState,
  timezone,
}: SlotPickerSheetProps) {
  const dateLabel = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEEE, d MMMM")
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-white dark:bg-neutral-900 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
          aria-describedby={undefined}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
          </div>

          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between bg-white dark:bg-neutral-900 px-5 pb-3 pt-2">
            <div>
              <Dialog.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {copy.availableTimes}
              </Dialog.Title>
              {dateLabel && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{dateLabel}</p>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                aria-label={copy.back}
              >
                <Icon name="x" className="text-sm" />
              </button>
            </Dialog.Close>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-gray-100 dark:border-neutral-800" />

          {/* Slot list */}
          <div className="px-5 py-4">
            <SlotListPanel
              slots={slots}
              selectedStartUtc={selectedStartUtc}
              copy={copy}
              onSelect={onSelect}
              loading={loading}
              emptyState={emptyState}
              timezone={timezone}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
