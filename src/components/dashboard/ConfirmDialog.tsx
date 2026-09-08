"use client";

import { useState } from "react";
import {
  AlertDialogRoot,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogIcon,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  onConfirm,
  open,
  onOpenChange,
  title,
  variant = "default",
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
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialogRoot isOpen={open} onOpenChange={onOpenChange}>
      <AlertDialogBackdrop>
        <AlertDialogContainer size="sm">
          <AlertDialogDialog>
            {variant === "destructive" ? (
              <AlertDialogIcon status="danger">
                <AlertTriangle className="size-5" />
              </AlertDialogIcon>
            ) : null}
            <AlertDialogHeader>
              <AlertDialogHeading>{title}</AlertDialogHeading>
            </AlertDialogHeader>
            <AlertDialogBody>{description}</AlertDialogBody>
            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                className="min-h-11 w-full sm:w-auto"
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? "…" : confirmLabel}
              </Button>
            </AlertDialogFooter>
          </AlertDialogDialog>
        </AlertDialogContainer>
      </AlertDialogBackdrop>
    </AlertDialogRoot>
  );
}
