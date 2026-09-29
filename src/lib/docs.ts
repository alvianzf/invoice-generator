export type DocKind = "invoice" | "quote";

export interface DocConfig {
  kind: DocKind;
  /** "Invoice" / "Quote" */
  title: string;
  /** Lower-case noun for sentences: "invoice" / "quote" */
  noun: string;
  plural: string;
  numberPrefix: string;
  path: string;
  draftKey: string;
  savedKey: string;
  /** Heading above the client's details, on screen and in the PDF. */
  clientLabel: string;
  totalLabel: string;
  pageTitle: string;
  pageDescription: string;
}

export const DOCS: Record<DocKind, DocConfig> = {
  invoice: {
    kind: "invoice",
    title: "Invoice",
    noun: "invoice",
    plural: "Invoices",
    numberPrefix: "INV",
    path: "/",
    draftKey: "invoiceGeneratorData",
    savedKey: "invoiceGeneratorSaved",
    clientLabel: "Billed to",
    totalLabel: "Total due",
    pageTitle: "Free Invoice Generator for Freelancers · Create PDF Invoices Online",
    pageDescription:
      "Create professional PDF invoices for free. Live A4 preview that matches the PDF exactly, automatic totals, multi-currency, no sign-up, and your data never leaves your browser.",
  },
  quote: {
    kind: "quote",
    title: "Quote",
    noun: "quote",
    plural: "Quotes",
    numberPrefix: "QUO",
    path: "/quotes",
    draftKey: "quoteGeneratorData",
    savedKey: "quoteGeneratorSaved",
    clientLabel: "Prepared for",
    totalLabel: "Total",
    pageTitle: "Free Quote Generator for Freelancers · Create PDF Quotes Online",
    pageDescription:
      "Create professional PDF quotes (quotations) for free, then turn an accepted quote into an invoice in one click. Live A4 preview, discounts and tax, no sign-up.",
  },
};

export const kindFromPath = (path: string): DocKind => (path.replace(/\/+$/, "") === "/quotes" ? "quote" : "invoice");
