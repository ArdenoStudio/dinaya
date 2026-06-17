"use client";

import { useCallback, useEffect } from "react";

const STORAGE_PREFIX = "dinaya-booking-contact:";

export type BookingContactFields = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
};

function storageKey(businessId: string) {
  return `${STORAGE_PREFIX}${businessId}`;
}

export function readBookingContact(businessId: string): Partial<BookingContactFields> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(businessId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BookingContactFields>;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBookingContact(businessId: string, contact: BookingContactFields) {
  if (typeof window === "undefined") return;
  try {
    const payload: Partial<BookingContactFields> = {};
    if (contact.clientName.trim()) payload.clientName = contact.clientName.trim();
    if (contact.clientPhone.trim()) payload.clientPhone = contact.clientPhone.trim();
    if (contact.clientEmail.trim()) payload.clientEmail = contact.clientEmail.trim();
    if (Object.keys(payload).length === 0) {
      sessionStorage.removeItem(storageKey(businessId));
      return;
    }
    sessionStorage.setItem(storageKey(businessId), JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function useBookingContactStorage(
  businessId: string,
  contact: BookingContactFields,
  onRestore?: (restored: Partial<BookingContactFields>) => void,
) {
  useEffect(() => {
    const stored = readBookingContact(businessId);
    if (!stored) return;
    const hasUrlContact =
      contact.clientName.trim() || contact.clientPhone.trim() || contact.clientEmail.trim();
    if (!hasUrlContact) {
      onRestore?.(stored);
    }
    // Only restore once on mount when URL did not provide contact info.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    writeBookingContact(businessId, contact);
    // Persist individual contact fields; parent should memoize the contact object.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitive fields are listed explicitly
  }, [businessId, contact.clientName, contact.clientPhone, contact.clientEmail]);
}

export function useBookingContactRestore(
  businessId: string,
  onRestore: (restored: Partial<BookingContactFields>) => void,
) {
  const restore = useCallback(() => {
    const stored = readBookingContact(businessId);
    if (stored) onRestore(stored);
  }, [businessId, onRestore]);

  useEffect(() => {
    restore();
  }, [restore]);
}
