import { ChangeEvent, Dispatch, SetStateAction, useId, useState } from "react";
import { Building2, CalendarDays, Landmark, ListOrdered, Plus, RefreshCw, RotateCcw, Trash2, FileText } from "lucide-react";
import { InvoiceData, InvoiceItem } from "../types";
import { createInvoice, emptyItem, invoiceTotal, itemAmount, randomInvoiceNumber, todayISO } from "../lib/invoice";
import { CURRENCIES, formatMoney, formatNumber, getCurrency } from "../lib/money";
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
        hint="Amounts are quantity × unit price. Long descriptions wrap in the PDF."
        delay={0.19}
      >
        <ol className="space-y-3">
          {invoice.items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              index={i}
              leaving={leaving.has(item.id)}
              amount={item.quantity.trim() && item.price.trim() ? formatNumber(itemAmount(item), currency) : ""}
              onChange={updateItem}
              onRemove={removeItem}
            />
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <button type="button" className="btn-glass" onClick={addItem}>
            <Plus size={16} /> Add item
          </button>
          <div className="text-right">
            <p className="field-label mb-0.5">Total due</p>
            <p className="font-display text-4xl leading-none text-ruby-700 tabular-nums">
              <AnimatedNumber value={invoiceTotal(invoice)} format={(n) => formatMoney(n, currency)} />
            </p>
          </div>
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

function ItemRow({
  item,
  index,
  leaving,
  amount,
  onChange,
  onRemove,
}: {
  item: InvoiceItem;
  index: number;
  leaving: boolean;
  amount: string;
  onChange: (id: string, field: keyof InvoiceItem, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const id = useId();
  return (
    <li
      className={`pop-in grid transition-all duration-300 ease-out ${leaving ? "pointer-events-none grid-rows-[0fr] opacity-0 -translate-x-3" : "grid-rows-[1fr]"}`}
    >
      <div className="overflow-hidden">
        <div className="rounded-2xl border border-white/80 bg-white/55 p-3.5 shadow-[inset_0_1px_0_#fff,0_6px_16px_-12px_rgba(28,25,23,.3)] sm:p-4">
          <div className="flex items-start gap-3">
            <span className="mt-2.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ruby-50 text-[0.7rem] font-semibold text-ruby-700 ring-1 ring-ruby-100">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label htmlFor={`${id}-d`} className="sr-only">
                  Description
                </label>
                <AutoTextarea
                  id={`${id}-d`}
                  value={item.description}
                  onChange={(e) => onChange(item.id, "description", e.target.value)}
                  placeholder="Description, e.g. Frontend development, September 2026"
                />
              </div>
              <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-2.5">
                <div>
                  <label htmlFor={`${id}-q`} className="field-label">
                    Qty
                  </label>
                  <input id={`${id}-q`} className="field" inputMode="decimal" value={item.quantity} placeholder="1" onChange={(e) => onChange(item.id, "quantity", e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`${id}-p`} className="field-label">
                    Unit price
                  </label>
                  <input id={`${id}-p`} className="field" inputMode="decimal" value={item.price} placeholder="27.500.000" onChange={(e) => onChange(item.id, "price", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Amount</p>
                  <p className="truncate rounded-xl border border-dashed border-ink/10 px-3.5 py-2.5 text-right text-[0.95rem] font-semibold tabular-nums text-ink" title={amount}>
                    {amount || <span className="font-normal text-ink-mute/60">—</span>}
                  </p>
                </div>
              </div>
            </div>
            <button type="button" className="icon-btn mt-1" onClick={() => onRemove(item.id)} aria-label={`Remove item ${index + 1}`} title="Remove item">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
