import { useEffect, useState } from "react";
import { InvoiceData, InvoiceItem } from "../types";
import { parseNumber } from "./money";

const STORAGE_KEY = "invoiceGeneratorData";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const randomInvoiceNumber = () =>
  `INV-${Math.floor(1000 + Math.random() * 9000)}`;

export const todayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const emptyItem = (): InvoiceItem => ({
  id: newId(),
  description: "",
  quantity: "",
  price: "",
});

export const createInvoice = (): InvoiceData => ({
  invoiceNumber: randomInvoiceNumber(),
  invoiceDate: todayISO(),
  currency: "IDR",
  billedToCompanyName: "",
  billedToAddress: "",
  billedToCompanyId: "",
  billedToVat: "",
  fromName: "",
  fromAddress: "",
  fromVat: "",
  items: [emptyItem()],
  bankName: "",
  accountName: "",
  accountNumber: "",
  swiftCode: "",
  contactEmail: "",
  contactPhone: "",
});

/** Merges saved data over defaults so older saves (no currency, stored amounts) still load. */
function load(): InvoiceData {
  const fresh = createInvoice();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<InvoiceData>;
    const items = Array.isArray(saved.items) && saved.items.length
      ? saved.items.map((item) => ({
          id: item.id || newId(),
          description: item.description ?? "",
          quantity: item.quantity ?? "",
          price: item.price ?? "",
        }))
      : fresh.items;
    return { ...fresh, ...saved, items };
  } catch {
    return fresh;
  }
}

export function useInvoice() {
  const [invoice, setInvoice] = useState<InvoiceData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
    } catch {
      // Storage can be unavailable (private mode, quota); the app still works.
    }
  }, [invoice]);

  return [invoice, setInvoice] as const;
}

export const itemAmount = (item: InvoiceItem) =>
  parseNumber(item.quantity) * parseNumber(item.price);

export const invoiceTotal = (invoice: InvoiceData) =>
  invoice.items.reduce((sum, item) => sum + itemAmount(item), 0);

export const isBlankItem = (item: InvoiceItem) =>
  !item.description.trim() && !item.quantity.trim() && !item.price.trim();

export function formatInvoiceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
