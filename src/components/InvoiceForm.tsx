import { ChangeEvent, Dispatch, SetStateAction, useId, useState } from "react";
import { Building2, CalendarDays, Landmark, ListOrdered, Plus, RefreshCw, RotateCcw, Trash2, FileText } from "lucide-react";
import { InvoiceData, InvoiceItem } from "../types";
import { computeTotals, createInvoice, emptyItem, itemAmount, randomInvoiceNumber, todayISO } from "../lib/invoice";
import { CURRENCIES, Currency, formatMoney, formatNumber, getCurrency, parseNumber } from "../lib/money";
import SavedInvoices from "./SavedInvoices";
import { AnimatedNumber, AutoTextarea, DownloadButton, DownloadState, Field, SectionCard, SelectField, TextareaField } from "./ui";

interface Props {
  invoice: InvoiceData;
  setInvoice: Dispatch<SetStateAction<InvoiceData>>;
  onDownload: () => void;
  downloadState: DownloadState;
  engineReady: boolean;
}

type TextKey = { [K in keyof InvoiceData]: InvoiceData[K] extends string ? K : never }[keyof InvoiceData];

export default function InvoiceForm({ invoice, setInvoice, onDownload, downloadState, engineReady }: Props) {
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const currency = getCurrency(invoice.currency);
  const totals = computeTotals(invoice);
  const hasBreakdown = totals.discountLabel !== null || totals.taxLabel !== null;

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

  const addItem = () => setInvoice((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

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

  const reset = () => {
    if (window.confirm("Clear every field and start a new invoice?")) setInvoice(createInvoice());
  };

  return (
    <div className="space-y-6">
      <SavedInvoices invoice={invoice} setInvoice={setInvoice} />

      <SectionCard icon={<FileText size={19} />} title="Invoice details" hint="Number, date and the currency you bill in." delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-3">
          <InputWithAction
            label="Invoice number"
            input={bind("invoiceNumber")}
            actionLabel="Generate a new invoice number"
            actionText="New"
            spin
            onAction={() => setInvoice((prev) => ({ ...prev, invoiceNumber: randomInvoiceNumber() }))}
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
          <SelectField label="Currency" {...bind("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.label}
              </option>
            ))}
          </SelectField>
        </div>
      </SectionCard>

      <SectionCard icon={<Building2 size={19} />} title="Who's involved" hint="Your client on the left, you on the right, just like the PDF." delay={0.12}>
        <div className="grid gap-x-6 gap-y-8 md:grid-cols-2">
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-4">Billed to</legend>
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

      <SectionCard
        icon={<ListOrdered size={19} />}
        title="Line items"
        hint="Amount = quantity × unit price. Discount and tax are optional; tax applies after the discount."
        delay={0.19}
      >
        <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
          <table className="w-full min-w-[34rem] border-separate border-spacing-0 overflow-hidden rounded-2xl bg-white/55 text-left shadow-[inset_0_1px_0_#fff,0_8px_20px_-14px_rgba(28,25,23,.35)] ring-1 ring-black/[0.05]">
            <thead>
              <tr className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                <th scope="col" className="w-9 border-b-2 border-ruby-700/70 py-3 pl-3 text-left">#</th>
                <th scope="col" className="border-b-2 border-ruby-700/70 px-2.5 py-3">Description</th>
                <th scope="col" className="w-[4.5rem] border-b-2 border-ruby-700/70 px-2.5 py-3 text-right">Qty</th>
                <th scope="col" className="w-[7.5rem] border-b-2 border-ruby-700/70 px-2.5 py-3 text-right">Unit price</th>
                <th scope="col" className="w-[8rem] border-b-2 border-ruby-700/70 px-2.5 py-3 text-right">Amount ({currency.code})</th>
                <th scope="col" className="w-10 border-b-2 border-ruby-700/70 py-3 pr-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={i}
                  leaving={leaving.has(item.id)}
                  amount={item.quantity.trim() && item.price.trim() ? itemAmount(item) : null}
                  currency={currency}
                  onChange={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="border-b border-ink/[0.06] py-2.5 pl-3">
                  <button type="button" className="btn-glass py-1.5" onClick={addItem}>
                    <Plus size={15} /> Add item
                  </button>
                </td>
              </tr>
              {hasBreakdown && (
                <SummaryRow label="Subtotal" className="fade-in" negative={totals.subtotal < 0}>
                  {formatNumber(totals.subtotal, currency)}
                </SummaryRow>
              )}
              <SummaryRow
                label="Discount"
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
                <th scope="row" colSpan={4} className="px-2.5 py-3.5 text-right text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ruby-700">
                  Total due
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

      <SectionCard icon={<Landmark size={19} />} title="Payment details" hint="Only filled-in fields appear on the invoice." delay={0.26}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" placeholder="Bank Mandiri" {...bind("bankName")} />
          <Field label="Account name" placeholder="John Doe" {...bind("accountName")} />
          <Field label="Account number" placeholder="1234567890" inputMode="numeric" {...bind("accountNumber")} />
          <Field label="SWIFT / BIC" placeholder="BMRIIDJA" {...bind("swiftCode")} />
          <Field label="Contact email" type="email" placeholder="name@example.com" {...bind("contactEmail")} />
          <Field label="Contact phone" type="tel" placeholder="+62 812 0000 0000" {...bind("contactPhone")} />
        </div>
      </SectionCard>

      <div className="rise flex flex-wrap items-center justify-between gap-3 px-1" style={{ ["--d" as string]: "0.33s" }}>
        <button type="button" className="btn-glass" onClick={reset}>
          <RotateCcw size={15} /> Start over
        </button>
        <DownloadButton state={downloadState} disabled={!engineReady} onClick={onDownload} className="px-7 py-3 text-base" />
      </div>
    </div>
  );
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
  icon: React.ReactNode;
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
  control,
  negative = false,
  className = "",
  children,
}: {
  label: string;
  control?: React.ReactNode;
  negative?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr className={`[&>*]:border-b [&>*]:border-ink/[0.06] ${className}`}>
      <th scope="row" colSpan={4} className="px-2.5 py-2 text-right font-normal">
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

function ItemRow({
  item,
  index,
  leaving,
  amount,
  currency,
  onChange,
  onRemove,
}: {
  item: InvoiceItem;
  index: number;
  leaving: boolean;
  amount: number | null;
  currency: Currency;
  onChange: (id: string, field: keyof InvoiceItem, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const n = index + 1;
  return (
    <tr
      className={`pop-in group align-top transition-all duration-300 ease-out hover:bg-white/70 [&>td]:border-b [&>td]:border-ink/[0.06] ${
        leaving ? "pointer-events-none -translate-x-3 opacity-0" : ""
      }`}
    >
      <td className="py-3.5 pl-3 text-xs font-semibold tabular-nums text-ink-mute">{n}</td>
      <td className="px-1 py-1.5">
        <AutoTextarea
          aria-label={`Item ${n} description`}
          className="cell-input"
          value={item.description}
          onChange={(e) => onChange(item.id, "description", e.target.value)}
          placeholder="Frontend development, September 2026"
        />
      </td>
      <td className="px-1 py-1.5">
        <input aria-label={`Item ${n} quantity`} className={`cell-input text-right tabular-nums ${parseNumber(item.quantity) < 0 ? "text-negative" : ""}`} inputMode="decimal" value={item.quantity} placeholder="1" onChange={(e) => onChange(item.id, "quantity", e.target.value)} />
      </td>
      <td className="px-1 py-1.5">
        <input aria-label={`Item ${n} unit price`} className={`cell-input text-right tabular-nums ${parseNumber(item.price) < 0 ? "text-negative" : ""}`} inputMode="decimal" value={item.price} placeholder="27.500.000" onChange={(e) => onChange(item.id, "price", e.target.value)} />
      </td>
      <td className={`whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-semibold tabular-nums ${amount !== null && amount < 0 ? "text-negative" : "text-ink"}`}>
        {amount !== null ? formatNumber(amount, currency) : <span className="font-normal text-ink-mute/50">—</span>}
      </td>
      <td className="py-1.5 pr-2 text-right">
        <button type="button" className="icon-btn opacity-60 transition group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onRemove(item.id)} aria-label={`Remove item ${n}`} title="Remove item">
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
