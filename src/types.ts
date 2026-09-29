export interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  price: string;
}

export type DiscountType = "percent" | "amount";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
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

  // Items
  items: InvoiceItem[];

  // Adjustments (optional; blank means not applied)
  discount: string;
  discountType: DiscountType;
  taxRate: string;

  // Payment Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  contactEmail: string;
  contactPhone: string;
}
