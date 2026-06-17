"use client";

import * as Dialog from "@radix-ui/react-dialog";

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  onConfirm,
  title,
  trigger,
}: {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  title: string;
  trigger: React.ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
              {cancelLabel}
            </Dialog.Close>
            <Dialog.Close
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              onClick={() => {
                void onConfirm();
              }}
            >
              {confirmLabel}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
