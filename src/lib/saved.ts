import { useCallback, useEffect, useState } from "react";
import { InvoiceData } from "../types";
import { newId, normalizeInvoice } from "./invoice";

const STORAGE_KEY = "invoiceGeneratorSaved";
export const MAX_SAVED = 5;

export interface SavedInvoice {
  id: string;
  savedAt: number;
  data: InvoiceData;
}

export type SaveResult = "added" | "updated" | "full" | "duplicate";

function load(): SavedInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as SavedInvoice[]) : [];
    return list.slice(0, MAX_SAVED).map((s) => ({ ...s, data: normalizeInvoice(s.data) }));
  } catch {
    return [];
  }
}

const sameNumber = (a: InvoiceData, b: InvoiceData) =>
  a.invoiceNumber.trim().toLowerCase() === b.invoiceNumber.trim().toLowerCase();

/** Up to five saved invoices, newest first, kept in this browser only. */
export function useSavedInvoices() {
  const [saved, setSaved] = useState<SavedInvoice[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage unavailable; the list still works for this session.
    }
  }, [saved]);

  /**
   * An invoice number that is already saved is only replaced with `overwrite`;
   * otherwise the caller gets "duplicate" and can ask the user.
   */
  const save = useCallback(
    (data: InvoiceData, { overwrite = false } = {}): SaveResult => {
      const snapshot: InvoiceData = JSON.parse(JSON.stringify(data));
      const existing = saved.find((s) => sameNumber(s.data, snapshot));
      if (existing && !overwrite) return "duplicate";
      if (!existing && saved.length >= MAX_SAVED) return "full";
      const entry: SavedInvoice = { id: existing?.id ?? newId(), savedAt: Date.now(), data: snapshot };
      setSaved((list) => [entry, ...list.filter((s) => s.id !== entry.id)]);
      return existing ? "updated" : "added";
    },
    [saved]
  );

  const remove = useCallback((id: string) => setSaved((list) => list.filter((s) => s.id !== id)), []);

  /** The saved entry for this invoice number, if any. */
  const findFor = useCallback((data: InvoiceData) => saved.find((s) => sameNumber(s.data, data)), [saved]);

  return { saved, save, remove, findFor };
}
