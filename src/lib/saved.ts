import { useCallback, useEffect, useState } from "react";
import { InvoiceData } from "../types";
import { newId, normalizeInvoice } from "./invoice";
import { DocKind, DOCS } from "./docs";
export const MAX_SAVED = 5;

export interface SavedInvoice {
  id: string;
  savedAt: number;
  data: InvoiceData;
}

export type SaveResult = "added" | "updated" | "full" | "duplicate";

function load(kind: DocKind): SavedInvoice[] {
  try {
    const raw = localStorage.getItem(DOCS[kind].savedKey);
    const list = raw ? (JSON.parse(raw) as SavedInvoice[]) : [];
    return list.slice(0, MAX_SAVED).map((s) => ({ ...s, data: normalizeInvoice(s.data, kind) }));
  } catch {
    return [];
  }
}

const sameNumber = (a: InvoiceData, b: InvoiceData) =>
  a.invoiceNumber.trim().toLowerCase() === b.invoiceNumber.trim().toLowerCase();

/** Up to five saved documents of one kind, newest first, kept in this browser only. */
export function useSavedInvoices(kind: DocKind = "invoice") {
  const [saved, setSaved] = useState<SavedInvoice[]>(() => load(kind));

  useEffect(() => {
    try {
      localStorage.setItem(DOCS[kind].savedKey, JSON.stringify(saved));
    } catch {
      // Storage unavailable; the list still works for this session.
    }
  }, [kind, saved]);

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
