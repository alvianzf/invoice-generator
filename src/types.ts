export interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  price: string;
  amount: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  
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
  
  // Payment Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  contactEmail: string;
  contactPhone: string;
}