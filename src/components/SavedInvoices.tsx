import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Archive, FolderOpen, PencilLine, Save, Trash2, X } from "lucide-react";
import { InvoiceData } from "../types";
import { computeTotals, formatInvoiceDate } from "../lib/invoice";
import { formatMoney, getCurrency } from "../lib/money";
import { MAX_SAVED, SavedInvoice, useSavedInvoices } from "../lib/saved";
import { SectionCard } from "./ui";

type Notice =
  | { kind: "info"; text: string }
  | { kind: "full" }
  | { kind: "duplicate"; existing: SavedInvoice };

const isSame = (a: InvoiceData, b: InvoiceData) => JSON.stringify(a) === JSON.stringify(b);

export default function SavedInvoices({ invoice, setInvoice }: { invoice: InvoiceData; setInvoice: Dispatch<SetStateAction<InvoiceData>> }) {
  const { saved, save, remove, findFor } = useSavedInvoices();
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<number>();

  // Informational notices fade on their own; questions wait for an answer.
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (notice?.kind === "info") timer.current = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer.current);
  }, [notice]);

  const number = invoice.invoiceNumber.trim() || "this invoice";
  const current = findFor(invoice);
  const upToDate = current ? isSame(current.data, invoice) : false;

  const doSave = (overwrite = false) => {
    const result = save(invoice, { overwrite });
    if (result === "duplicate") setNotice({ kind: "duplicate", existing: current! });
    else if (result === "full") setNotice({ kind: "full" });
    else setNotice({ kind: "info", text: result === "updated" ? `Overwrote ${number}.` : `Saved ${number}.` });
  };

  const changeNumber = () => {
    setNotice(null);
    const input = document.querySelector<HTMLInputElement>('input[name="invoiceNumber"]');
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
    input?.select();
  };

  const open = (entry: SavedInvoice) => {
    if (isSame(entry.data, invoice)) return;
    const editingSaved = current && isSame(current.data, invoice);
    if (!editingSaved && !window.confirm(`Open ${entry.data.invoiceNumber || "this invoice"}? Unsaved changes to the invoice you're editing will be lost.`)) return;
    setInvoice(JSON.parse(JSON.stringify(entry.data)));
    setNotice({ kind: "info", text: `Opened ${entry.data.invoiceNumber || "invoice"}.` });
  };

  const del = (entry: SavedInvoice) => {
    if (!window.confirm(`Delete saved invoice ${entry.data.invoiceNumber || ""}? This can't be undone.`)) return;
    remove(entry.id);
    setNotice({ kind: "info", text: `Deleted ${entry.data.invoiceNumber || "invoice"}.` });
  };

  return (
    <SectionCard
      icon={<Archive size={19} />}
      title="Saved invoices"
      hint={`Keep up to ${MAX_SAVED} invoices in this browser. ${saved.length} of ${MAX_SAVED} used.`}
      delay={0}
      aside={
        <button type="button" className="btn-glass shrink-0" onClick={() => doSave()} disabled={upToDate} title={upToDate ? "No changes since it was saved" : undefined}>
          <Save size={15} /> {upToDate ? "Saved" : "Save invoice"}
        </button>
      }
    >
      {notice && (
        <div
          role={notice.kind === "info" ? "status" : "alertdialog"}
          aria-live="polite"
          className={`pop-in mb-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${
            notice.kind === "info" ? "bg-white/70 text-ink-soft ring-black/5" : "bg-ruby-50/90 text-ruby-900 ring-ruby-200"
          }`}
        >
          <p className="min-w-0 flex-1">
            {notice.kind === "info" && notice.text}
            {notice.kind === "full" && `You can keep up to ${MAX_SAVED} invoices. Delete one below to save ${number}.`}
            {notice.kind === "duplicate" && (
              <>
                <strong className="font-semibold">{notice.existing.data.invoiceNumber}</strong> is already saved (
                {formatInvoiceDate(notice.existing.data.invoiceDate)}). Overwrite it, or change the invoice number?
              </>
            )}
          </p>
          {notice.kind === "duplicate" && (
            <div className="flex gap-2">
              <button type="button" className="btn-ruby px-4 py-1.5" onClick={() => doSave(true)}>
                Overwrite
              </button>
              <button type="button" className="btn-glass py-1.5" onClick={changeNumber}>
                <PencilLine size={14} /> Change number
              </button>
            </div>
          )}
          {notice.kind !== "info" && (
            <button type="button" className="icon-btn h-8 w-8" onClick={() => setNotice(null)} aria-label="Dismiss">
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {saved.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/10 px-4 py-5 text-center text-sm text-ink-mute">
          Nothing saved yet. Save this invoice to come back to it later.
        </p>
      ) : (
        <ul className="divide-y divide-ink/[0.06] overflow-hidden rounded-2xl bg-white/55 ring-1 ring-black/[0.05]">
          {saved.map((entry) => {
            const totals = computeTotals(entry.data);
            const editing = entry.id === current?.id;
            return (
              <li key={entry.id} className={`pop-in flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/70 ${editing ? "bg-ruby-50/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="truncate">{entry.data.invoiceNumber || "Untitled"}</span>
                    {editing && <span className="shrink-0 rounded-full bg-ruby-100 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-ruby-700">Editing</span>}
                  </p>
                  <p className="truncate text-xs text-ink-mute">
                    {formatInvoiceDate(entry.data.invoiceDate)} · {entry.data.billedToCompanyName || "No client name"}
                  </p>
                </div>
                <p className={`whitespace-nowrap text-sm font-semibold tabular-nums ${totals.total < 0 ? "text-negative" : "text-ink"}`}>
                  {formatMoney(totals.total, getCurrency(entry.data.currency))}
                </p>
                <div className="flex shrink-0">
                  <button type="button" className="icon-btn" onClick={() => open(entry)} aria-label={`Open ${entry.data.invoiceNumber}`} title="Open">
                    <FolderOpen size={16} />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => del(entry)} aria-label={`Delete ${entry.data.invoiceNumber}`} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
