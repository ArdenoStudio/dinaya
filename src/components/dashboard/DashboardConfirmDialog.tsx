"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

export function DashboardConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  onConfirm,
  open,
  onOpenChange,
  title,
  variant = "destructive",
}: {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  variant?: "destructive" | "default";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={() => {
                void onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
