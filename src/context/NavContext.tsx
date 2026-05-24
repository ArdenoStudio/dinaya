"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";

interface NavContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Always close on any route change (covers navigating away from pages
  // that don't render UnderlayNav, e.g. dashboard)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close  = useCallback(() => setIsOpen(false),      []);

  return (
    <NavContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside <NavProvider>");
  return ctx;
}
