export interface InvoiceItem {
  id: string;
  /** "heading" rows divide the table into sections and carry no amount. */
  kind: "item" | "heading";
  description: string;
  quantity: string;
  /** e.g. "hrs", "days", "pcs"; printed after the quantity. */
  unit: string;
  price: string;
}

export type DiscountType = "percent" | "amount";

/** Rich text as stored by the editor (a subset of the ProseMirror/Tiptap JSON format). */
export interface RichMark {
  type: string;
}
export interface RichNode {
  type: string;
  text?: string;
  marks?: RichMark[];
  attrs?: Record<string, unknown>;
  content?: RichNode[];
}
export interface RichDoc {
  type: "doc";
  content?: RichNode[];
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  /** Quotes only: optional expiry date. */
  validUntil: string;
  currency: string;

  // Billed To
  billedToCompanyName: string;
  billedToAddress: string;
  billedToCompanyId: string;
  billedToVat: string;

  // From
  fromName: string;
  fromAddress: string;
  fromVat: string;

  /** Quotes only: text above the line items. */
  introText: RichDoc | null;

  // Items
  items: InvoiceItem[];

  // Adjustments (optional; blank means not applied)
  discount: string;
  discountType: DiscountType;
  taxRate: string;

  /** Quotes only: terms and closing notes below the totals. */
  closingText: RichDoc | null;

  // Payment Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  contactEmail: string;
  contactPhone: string;
}
