"use client";

import * as Toast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastMessage = {
  description?: string;
  id: number;
  title: string;
};

type ToastContextValue = {
  showToast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function DashboardToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: Omit<ToastMessage, "id">) => {
    setMessages((current) => [...current, { ...message, id: Date.now() }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <Toast.Provider swipeDirection="right">
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
      {messages.map((message) => (
        <Toast.Root
          key={message.id}
          className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4 shadow-lg"
          onOpenChange={(open) => {
            if (!open) {
              setMessages((current) => current.filter((item) => item.id !== message.id));
            }
          }}
        >
          <Toast.Title className="text-sm font-semibold">{message.title}</Toast.Title>
          {message.description && (
            <Toast.Description className="mt-1 text-sm text-muted-foreground">
              {message.description}
            </Toast.Description>
          )}
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" />
    </Toast.Provider>
  );
}

export function useDashboardToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useDashboardToast must be used inside DashboardToastProvider.");
  }

  return context;
}
