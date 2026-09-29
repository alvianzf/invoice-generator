import { useEffect, useState } from "react";
import { InvoiceData, InvoiceItem } from "../types";
import { formatQuantity, getCurrency, parseNumber } from "./money";
import { DocKind, DOCS } from "./docs";
import { quoteClosingTemplate, quoteIntroTemplate } from "./templates";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const randomInvoiceNumber = (kind: DocKind = "invoice") =>
  `${DOCS[kind].numberPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

export const todayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const emptyItem = (kind: InvoiceItem["kind"] = "item"): InvoiceItem => ({
  id: newId(),
  kind,
  description: "",
  quantity: "",
  unit: "",
  price: "",
});

export const createInvoice = (kind: DocKind = "invoice"): InvoiceData => ({
  invoiceNumber: randomInvoiceNumber(kind),
  invoiceDate: todayISO(),
  validUntil: "",
  currency: "IDR",
  billedToCompanyName: "",
  billedToAddress: "",
  billedToCompanyId: "",
  billedToVat: "",
  fromName: "",
  fromAddress: "",
  fromVat: "",
  introText: kind === "quote" ? quoteIntroTemplate() : null,
  items: [emptyItem()],
  discount: "",
  discountType: "percent",
  taxRate: "",
  closingText: kind === "quote" ? quoteClosingTemplate() : null,
  bankName: "",
  accountName: "",
  accountNumber: "",
  swiftCode: "",
  contactEmail: "",
  contactPhone: "",
});

/** Merges stored data over defaults so older saves (no currency, stored amounts) still load. */
export function normalizeInvoice(saved: Partial<InvoiceData>, kind: DocKind = "invoice"): InvoiceData {
  const fresh = createInvoice(kind);
  const items =
    Array.isArray(saved.items) && saved.items.length
      ? saved.items.map((item) => ({
          id: item.id || newId(),
          kind: item.kind === "heading" ? ("heading" as const) : ("item" as const),
          description: item.description ?? "",
          quantity: item.quantity ?? "",
          unit: item.unit ?? "",
          price: item.price ?? "",
        }))
      : fresh.items;
  return { ...fresh, ...saved, items };
}

function load(kind: DocKind): InvoiceData {
  try {
    const raw = localStorage.getItem(DOCS[kind].draftKey);
    return raw ? normalizeInvoice(JSON.parse(raw), kind) : createInvoice(kind);
  } catch {
    return createInvoice(kind);
  }
}

/** The working draft for one document kind, persisted in this browser. */
export function useInvoice(kind: DocKind = "invoice") {
  const [invoice, setInvoice] = useState<InvoiceData>(() => load(kind));

  useEffect(() => {
    try {
      localStorage.setItem(DOCS[kind].draftKey, JSON.stringify(invoice));
    } catch {
      // Storage can be unavailable (private mode, quota); the app still works.
    }
  }, [kind, invoice]);

  return [invoice, setInvoice] as const;
}

/** True when nothing worth keeping has been entered. */
export const isBlankDraft = (data: InvoiceData) =>
  data.items.every(isBlankItem) && !data.billedToCompanyName.trim() && !data.billedToAddress.trim();

/** A new invoice carrying over everything from a quote, with its own number and today's date. */
export const quoteToInvoice = (quote: InvoiceData): InvoiceData => ({
  ...JSON.parse(JSON.stringify(quote)),
  invoiceNumber: randomInvoiceNumber("invoice"),
  invoiceDate: todayISO(),
  validUntil: "",
  // The quote's pitch and terms don't belong on an invoice.
  introText: null,
  closingText: null,
  items: quote.items.map((item) => ({ ...item, id: newId() })),
});

export const itemAmount = (item: InvoiceItem) =>
  item.kind === "heading" ? 0 : parseNumber(item.quantity) * parseNumber(item.price);

export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  /** e.g. "Discount (10%)"; null when no discount was entered. */
  discountLabel: string | null;
  /** e.g. "Tax (11%)"; null when no tax rate was entered. */
  taxLabel: string | null;
}

/**
 * Subtotal, then discount, then tax on the discounted amount. Every step is
 * rounded to the currency's decimals so the printed lines add up exactly.
 */
export function computeTotals(invoice: InvoiceData): Totals {
  const currency = getCurrency(invoice.currency);
  const factor = 10 ** currency.decimals;
  const round = (n: number) => Math.round(n * factor) / factor;

  const subtotal = round(invoice.items.reduce((sum, item) => sum + round(itemAmount(item)), 0));

  const hasDiscount = invoice.discount.trim() !== "";
  const discountValue = Math.max(0, parseNumber(invoice.discount));
  const isPercent = invoice.discountType !== "amount";
  // A discount can reduce the subtotal to zero but never below it, and never applies to a negative subtotal.
  const discount = !hasDiscount
    ? 0
    : Math.max(0, Math.min(subtotal, round(isPercent ? (subtotal * Math.min(discountValue, 100)) / 100 : discountValue)));

  const hasTax = invoice.taxRate.trim() !== "";
  const taxRate = Math.max(0, parseNumber(invoice.taxRate));
  const tax = hasTax ? round(((subtotal - discount) * taxRate) / 100) : 0;

  const percent = (n: number) => `${formatQuantity(n, currency)}%`;
  return {
    subtotal,
    discount,
    tax,
    total: round(subtotal - discount + tax),
    discountLabel: hasDiscount ? (isPercent ? `Discount (${percent(Math.min(discountValue, 100))})` : "Discount") : null,
    taxLabel: hasTax ? `Tax (${percent(taxRate)})` : null,
  };
}

export const isBlankItem = (item: InvoiceItem) =>
  !item.description.trim() && (item.kind === "heading" || (!item.quantity.trim() && !item.unit.trim() && !item.price.trim()));

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function formatInvoiceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return dateFormat.format(new Date(y, m - 1, d));
}
