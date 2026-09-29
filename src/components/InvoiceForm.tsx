import { ChangeEvent, Dispatch, lazy, ReactNode, SetStateAction, Suspense, useId, useState } from "react";
import {
  ArrowRightLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  FileText,
  Heading,
  Landmark,
  ListOrdered,
  MessageSquareText,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Trash2,
} from "lucide-react";
import { InvoiceData, InvoiceItem, RichDoc } from "../types";
import { computeTotals, createInvoice, emptyItem, itemAmount, randomInvoiceNumber, todayISO } from "../lib/invoice";
import { CURRENCIES, Currency, formatMoney, formatNumber, getCurrency, parseNumber } from "../lib/money";
import { DocConfig } from "../lib/docs";
import { quoteClosingTemplate, quoteIntroTemplate } from "../lib/templates";
import { useConfirm } from "../lib/confirm";
import SavedInvoices from "./SavedInvoices";
import { AnimatedNumber, AutoTextarea, DownloadButton, DownloadState, Field, SectionCard, SelectField, TextareaField } from "./ui";

// The editor (Tiptap) is only needed for quotes, so it loads on demand.
const RichTextEditor = lazy(() => import("./RichTextEditor"));

interface Props {
  doc: DocConfig;
  invoice: InvoiceData;
  setInvoice: Dispatch<SetStateAction<InvoiceData>>;
  onDownload: () => void;
  downloadState: DownloadState;
  engineReady: boolean;
  /** Quotes only: turn this quote into an invoice. */
  onCreateInvoice?: () => void;
}

type TextKey = { [K in keyof InvoiceData]: InvoiceData[K] extends string ? K : never }[keyof InvoiceData];

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export default function InvoiceForm({ doc, invoice, setInvoice, onDownload, downloadState, engineReady, onCreateInvoice }: Props) {
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const confirm = useConfirm();
  const isQuote = doc.kind === "quote";
  const currency = getCurrency(invoice.currency);
  const totals = computeTotals(invoice);
  const hasBreakdown = totals.discountLabel !== null || totals.taxLabel !== null;
  const showUnit = isQuote || invoice.items.some((item) => item.kind === "item" && item.unit.trim());
  const columns = showUnit ? 7 : 6;

  const bind = (name: TextKey) => ({
    name,
    value: invoice[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setInvoice((prev) => ({ ...prev, [name]: e.target.value })),
  });

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) =>
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));

  const addRow = (kind: InvoiceItem["kind"]) => setInvoice((prev) => ({ ...prev, items: [...prev.items, emptyItem(kind)] }));

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) {
      setInvoice((prev) => ({ ...prev, items: [emptyItem()] }));
      return;
    }
    setLeaving((s) => new Set(s).add(id));
    window.setTimeout(() => {
      setInvoice((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
      setLeaving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 260);
  };

  const reset = async () => {
    const ok = await confirm({
      title: `Start a new ${doc.noun}?`,
      message: `Every field will be cleared. Saved ${doc.plural.toLowerCase()} are kept.`,
      confirmText: "Clear and start over",
      tone: "danger",
    });
    if (ok) setInvoice(createInvoice(doc.kind));
  };

  const setRich = (key: "introText" | "closingText") => (value: RichDoc) => setInvoice((prev) => ({ ...prev, [key]: value }));

  const resetTemplate = async (key: "introText" | "closingText") => {
    const ok = await confirm({
      title: "Restore the template?",
      message: "Your edits to this text will be replaced with the original template.",
      confirmText: "Restore template",
      tone: "danger",
    });
    if (ok) setInvoice((prev) => ({ ...prev, [key]: key === "introText" ? quoteIntroTemplate() : quoteClosingTemplate() }));
  };

  let itemNumber = 0;
  const delay = (i: number) => 0.05 + i * 0.07;

  return (
    <div className="space-y-6">
      <SavedInvoices key={doc.kind} doc={doc} invoice={invoice} setInvoice={setInvoice} />

      <SectionCard
        icon={<FileText size={19} />}
        title={`${doc.title} details`}
        hint={isQuote ? "Number, dates and the currency you quote in." : "Number, date and the currency you bill in."}
        delay={delay(0)}
      >
        <div className={`grid gap-4 ${isQuote ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <InputWithAction
            label={`${doc.title} number`}
            input={bind("invoiceNumber")}
            actionLabel={`Generate a new ${doc.noun} number`}
            actionText="New"
            spin
            onAction={() => setInvoice((prev) => ({ ...prev, invoiceNumber: randomInvoiceNumber(doc.kind) }))}
            icon={<RefreshCw size={12} />}
          />
          <InputWithAction
            label="Issue date"
            type="date"
            input={bind("invoiceDate")}
            actionLabel="Use today's date"
            actionText="Today"
            onAction={() => setInvoice((prev) => ({ ...prev, invoiceDate: todayISO() }))}
            icon={<CalendarDays size={12} />}
          />
          {isQuote && (
            <InputWithAction
              label="Valid until"
              type="date"
              input={bind("validUntil")}
              actionLabel="Valid for 30 days from the issue date"
              actionText="+30 days"
              onAction={() => setInvoice((prev) => ({ ...prev, validUntil: addDays(prev.invoiceDate, 30) }))}
              icon={<CalendarClock size={12} />}
            />
          )}
          <SelectField label="Currency" {...bind("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.label}
              </option>
            ))}
          </SelectField>
        </div>
      </SectionCard>

      <SectionCard icon={<Building2 size={19} />} title="Who's involved" hint="Your client on the left, you on the right, just like the PDF." delay={delay(1)}>
        <div className="grid gap-x-6 gap-y-8 md:grid-cols-2">
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-4">{doc.clientLabel}</legend>
            <Field label="Company name" placeholder="Devshore Partners s.r.o." {...bind("billedToCompanyName")} />
            <TextareaField label="Address" placeholder={"Námestie SNP 3\n811 06 Bratislava, Slovakia"} {...bind("billedToAddress")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company ID" placeholder="12345678" {...bind("billedToCompanyId")} />
              <Field label="VAT number" placeholder="SK1234567890" {...bind("billedToVat")} />
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-4">From</legend>
            <Field label="Your name" placeholder="John Doe" {...bind("fromName")} />
            <TextareaField label="Address" placeholder={"Jl. Example No. 1\nJakarta Utara, Indonesia"} {...bind("fromAddress")} />
            <Field label="VAT number" placeholder="Optional" {...bind("fromVat")} />
          </fieldset>
        </div>
      </SectionCard>

      {isQuote && (
        <SectionCard
          icon={<MessageSquareText size={19} />}
          title="Introduction"
          hint="Printed above the line items. Start from the template and make it yours."
          delay={delay(2)}
          aside={<TemplateButton onClick={() => resetTemplate("introText")} />}
        >
          <Suspense fallback={<EditorSkeleton />}>
            <RichTextEditor label="Introduction" value={invoice.introText} onChange={setRich("introText")} />
          </Suspense>
        </SectionCard>
      )}

      <SectionCard
        icon={<ListOrdered size={19} />}
        title="Line items"
        hint="Amount = quantity × unit price. Headings split the table into sections. Discount and tax are optional; tax applies after the discount."
        delay={delay(isQuote ? 3 : 2)}
      >
        <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
          <table
            className={`w-full ${showUnit ? "min-w-[38rem]" : "min-w-[34rem]"} border-separate border-spacing-0 overflow-hidden rounded-2xl bg-white/55 text-left shadow-[inset_0_1px_0_#fff,0_8px_20px_-14px_rgba(28,25,23,.35)] ring-1 ring-black/[0.05]`}
          >
            <thead>
              <tr className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-mute [&>th]:border-b-2 [&>th]:border-ruby-700/70 [&>th]:py-3">
                <th scope="col" className="w-9 pl-3 text-left">
                  #
                </th>
                <th scope="col" className="px-2.5">
                  Description
                </th>
                <th scope="col" className="w-[4.25rem] px-2.5 text-right">
                  Qty
                </th>
                {showUnit && (
                  <th scope="col" className="w-[4.75rem] px-2.5">
                    Unit
                  </th>
                )}
                <th scope="col" className="w-[7.25rem] px-2.5 text-right">
                  Unit price
                </th>
                <th scope="col" className="w-[7.75rem] px-2.5 text-right">
                  Amount ({currency.code})
                </th>
                <th scope="col" className="w-10 pr-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => {
                if (item.kind === "heading") {
                  return <HeadingRow key={item.id} item={item} columns={columns} leaving={leaving.has(item.id)} onChange={updateItem} onRemove={removeItem} />;
                }
                itemNumber += 1;
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    number={itemNumber}
                    showUnit={showUnit}
                    leaving={leaving.has(item.id)}
                    amount={item.quantity.trim() && item.price.trim() ? itemAmount(item) : null}
                    currency={currency}
                    onChange={updateItem}
                    onRemove={removeItem}
                  />
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={columns} className="border-b border-ink/[0.06] py-2.5 pl-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-glass py-1.5" onClick={() => addRow("item")}>
                      <Plus size={15} /> Add item
                    </button>
                    <button type="button" className="btn-glass py-1.5" onClick={() => addRow("heading")}>
                      <Heading size={15} /> Add heading
                    </button>
                  </div>
                </td>
              </tr>
              {hasBreakdown && (
                <SummaryRow label="Subtotal" span={columns - 2} className="fade-in" negative={totals.subtotal < 0}>
                  {formatNumber(totals.subtotal, currency)}
                </SummaryRow>
              )}
              <SummaryRow
                label="Discount"
                span={columns - 2}
                negative={totals.discount > 0}
                control={
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label={invoice.discountType === "percent" ? "Discount percentage" : `Discount amount in ${currency.code}`}
                      className="cell-input w-24 border-ink/10 bg-white/60 text-right tabular-nums"
                      inputMode="decimal"
                      placeholder="Optional"
                      {...bind("discount")}
                    />
                    <UnitToggle
                      value={invoice.discountType}
                      options={[
                        ["percent", "%"],
                        ["amount", currency.code],
                      ]}
                      onChange={(discountType) => setInvoice((prev) => ({ ...prev, discountType }))}
                    />
                  </div>
                }
              >
                {totals.discountLabel ? formatNumber(-totals.discount, currency) : <span className="font-normal text-ink-mute/50">—</span>}
              </SummaryRow>
              <SummaryRow
                label="Tax"
                span={columns - 2}
                negative={totals.tax < 0}
                control={
                  <div className="relative">
                    <input aria-label="Tax rate in percent" className="cell-input w-24 border-ink/10 bg-white/60 pr-7 text-right tabular-nums" inputMode="decimal" placeholder="Optional" {...bind("taxRate")} />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-mute">%</span>
                  </div>
                }
              >
                {totals.taxLabel ? formatNumber(totals.tax, currency) : <span className="font-normal text-ink-mute/50">—</span>}
              </SummaryRow>
              <tr className="bg-ruby-50/70">
                <th scope="row" colSpan={columns - 2} className="px-2.5 py-3.5 text-right text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ruby-700">
                  {doc.totalLabel}
                </th>
                <td className={`whitespace-nowrap px-2.5 py-3.5 text-right text-base font-semibold tabular-nums ${totals.total < 0 ? "text-negative" : "text-ruby-700"}`}>
                  <AnimatedNumber value={totals.total} format={(n) => formatMoney(n, currency)} />
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {isQuote && (
        <SectionCard
          icon={<ScrollText size={19} />}
          title="Terms & notes"
          hint="Printed below the totals: payment terms, timeline, how to accept."
          delay={delay(4)}
          aside={<TemplateButton onClick={() => resetTemplate("closingText")} />}
        >
          <Suspense fallback={<EditorSkeleton />}>
            <RichTextEditor label="Terms and notes" value={invoice.closingText} onChange={setRich("closingText")} />
          </Suspense>
        </SectionCard>
      )}

      <SectionCard icon={<Landmark size={19} />} title="Payment details" hint={`Only filled-in fields appear on the ${doc.noun}.`} delay={delay(isQuote ? 5 : 3)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" placeholder="Bank Mandiri" {...bind("bankName")} />
          <Field label="Account name" placeholder="John Doe" {...bind("accountName")} />
          <Field label="Account number" placeholder="1234567890" inputMode="numeric" {...bind("accountNumber")} />
          <Field label="SWIFT / BIC" placeholder="BMRIIDJA" {...bind("swiftCode")} />
          <Field label="Contact email" type="email" placeholder="name@example.com" {...bind("contactEmail")} />
          <Field label="Contact phone" type="tel" placeholder="+62 812 0000 0000" {...bind("contactPhone")} />
        </div>
      </SectionCard>

      <div className="rise flex flex-wrap items-center justify-between gap-3 px-1" style={{ ["--d" as string]: `${delay(isQuote ? 6 : 4)}s` }}>
        <button type="button" className="btn-glass" onClick={reset}>
          <RotateCcw size={15} /> Start over
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {onCreateInvoice && (
            <button type="button" className="btn-glass px-4 py-2.5" onClick={onCreateInvoice}>
              <ArrowRightLeft size={15} /> Create invoice
            </button>
          )}
          <DownloadButton state={downloadState} disabled={!engineReady} onClick={onDownload} className="px-7 py-3 text-base" />
        </div>
      </div>
    </div>
  );
}

function TemplateButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn-glass shrink-0 px-3 py-1.5 text-xs" onClick={onClick} title="Replace this text with the original template">
      <RotateCcw size={13} /> Template
    </button>
  );
}

function EditorSkeleton() {
  return <div className="h-40 animate-pulse rounded-[0.9rem] bg-white/60 ring-1 ring-black/5" aria-label="Loading editor" />;
}

function InputWithAction({
  label,
  input,
  type = "text",
  actionLabel,
  actionText,
  spin = false,
  onAction,
  icon,
}: {
  label: string;
  input: { name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void };
  type?: string;
  actionLabel: string;
  actionText: string;
  spin?: boolean;
  onAction: () => void;
  icon: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <button
          type="button"
          onClick={onAction}
          title={actionLabel}
          className="group -mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-ruby-700 transition hover:bg-ruby-50"
        >
          <span className={`transition-transform duration-500 group-active:scale-90 ${spin ? "group-hover:rotate-180" : "group-hover:-rotate-12"}`}>{icon}</span>
          {actionText}
        </button>
      </div>
      <input id={id} type={type} className="field" {...input} />
    </div>
  );
}

function SummaryRow({
  label,
  span,
  control,
  negative = false,
  className = "",
  children,
}: {
  label: string;
  span: number;
  control?: ReactNode;
  negative?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <tr className={`[&>*]:border-b [&>*]:border-ink/[0.06] ${className}`}>
      <th scope="row" colSpan={span} className="px-2.5 py-2 text-right font-normal">
        <div className="flex items-center justify-end gap-3">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-mute">{label}</span>
          {control}
        </div>
      </th>
      <td className={`whitespace-nowrap px-2.5 py-2 text-right text-sm font-semibold tabular-nums ${negative ? "text-negative" : "text-ink"}`}>{children}</td>
      <td />
    </tr>
  );
}

function UnitToggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-ink/[0.05] p-0.5" role="group" aria-label="Discount type">
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`min-w-[2.25rem] rounded-md px-2 py-1.5 text-xs font-semibold transition ${
            value === option ? "bg-white text-ruby-700 shadow-[0_1px_3px_rgba(28,25,23,.15)]" : "text-ink-mute hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const rowClass = (leaving: boolean) =>
  `pop-in group align-top transition-all duration-300 ease-out [&>td]:border-b [&>td]:border-ink/[0.06] ${leaving ? "pointer-events-none -translate-x-3 opacity-0" : ""}`;

function HeadingRow({
  item,
  columns,
  leaving,
  onChange,
  onRemove,
}: {
  item: InvoiceItem;
  columns: number;
  leaving: boolean;
  onChange: (id: string, field: keyof InvoiceItem, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <tr className={`${rowClass(leaving)} bg-ruby-50/60`}>
      <td className="py-3.5 pl-3 text-ruby-700">
        <Heading size={14} aria-hidden />
      </td>
      <td colSpan={columns - 2} className="px-1 py-1.5">
        <input
          aria-label="Section heading"
          className="cell-input font-semibold text-ruby-800 placeholder:font-normal"
          value={item.description}
          placeholder="Section heading, e.g. Phase 1: Discovery & design"
          onChange={(e) => onChange(item.id, "description", e.target.value)}
        />
      </td>
      <td className="py-1.5 pr-2 text-right">
        <button type="button" className="icon-btn opacity-60 transition group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onRemove(item.id)} aria-label="Remove heading" title="Remove heading">
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}

function ItemRow({
  item,
  number,
  showUnit,
  leaving,
  amount,
  currency,
  onChange,
  onRemove,
}: {
  item: InvoiceItem;
  number: number;
  showUnit: boolean;
  leaving: boolean;
  amount: number | null;
  currency: Currency;
  onChange: (id: string, field: keyof InvoiceItem, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <tr className={`${rowClass(leaving)} hover:bg-white/70`}>
      <td className="py-3.5 pl-3 text-xs font-semibold tabular-nums text-ink-mute">{number}</td>
      <td className="px-1 py-1.5">
        <AutoTextarea
          aria-label={`Item ${number} description`}
          className="cell-input"
          value={item.description}
          onChange={(e) => onChange(item.id, "description", e.target.value)}
          placeholder="Frontend development, September 2026"
        />
      </td>
      <td className="px-1 py-1.5">
        <input
          aria-label={`Item ${number} quantity`}
          className={`cell-input text-right tabular-nums ${parseNumber(item.quantity) < 0 ? "text-negative" : ""}`}
          inputMode="decimal"
          value={item.quantity}
          placeholder="1"
          onChange={(e) => onChange(item.id, "quantity", e.target.value)}
        />
      </td>
      {showUnit && (
        <td className="px-1 py-1.5">
          <input aria-label={`Item ${number} unit`} className="cell-input" value={item.unit} placeholder="hrs" onChange={(e) => onChange(item.id, "unit", e.target.value)} />
        </td>
      )}
      <td className="px-1 py-1.5">
        <input
          aria-label={`Item ${number} unit price`}
          className={`cell-input text-right tabular-nums ${parseNumber(item.price) < 0 ? "text-negative" : ""}`}
          inputMode="decimal"
          value={item.price}
          placeholder="27.500.000"
          onChange={(e) => onChange(item.id, "price", e.target.value)}
        />
      </td>
      <td className={`whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-semibold tabular-nums ${amount !== null && amount < 0 ? "text-negative" : "text-ink"}`}>
        {amount !== null ? formatNumber(amount, currency) : <span className="font-normal text-ink-mute/50">—</span>}
      </td>
      <td className="py-1.5 pr-2 text-right">
        <button type="button" className="icon-btn opacity-60 transition group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onRemove(item.id)} aria-label={`Remove item ${number}`} title="Remove item">
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
