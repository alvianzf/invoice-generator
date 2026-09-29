import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Eye, FileSignature, PencilLine, Receipt } from "lucide-react";
import InvoiceForm from "./components/InvoiceForm";
import PdfPreview from "./components/PdfPreview";
import { DownloadButton, DownloadState } from "./components/ui";
import { isBlankDraft, quoteToInvoice, useInvoice } from "./lib/invoice";
import { DocKind, DOCS, kindFromPath } from "./lib/docs";
import { useConfirm } from "./lib/confirm";
import { Engine, loadEngine } from "./pdf/engine";

type View = "edit" | "preview";

function setHead(kind: DocKind) {
  const doc = DOCS[kind];
  document.title = doc.pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", doc.pageDescription);
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://invoice.alvianzf.id${doc.path}`);
  document.querySelectorAll<HTMLAnchorElement>("a[data-doc]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.doc === kind));
}

export default function App() {
  const [kind, setKind] = useState<DocKind>(() => kindFromPath(location.pathname));
  const [invoice, setInvoice] = useInvoice("invoice");
  const [quote, setQuote] = useInvoice("quote");
  const [engine, setEngine] = useState<Engine | null>(null);
  const [engineError, setEngineError] = useState(false);
  const [view, setView] = useState<View>("edit");
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const confirm = useConfirm();

  const doc = DOCS[kind];
  const current = kind === "quote" ? quote : invoice;
  const setCurrent = kind === "quote" ? setQuote : setInvoice;

  useEffect(() => {
    loadEngine().then(setEngine, (err) => {
      console.error(err);
      setEngineError(true);
    });
  }, []);

  const navigate = useCallback((next: DocKind, scroll = true) => {
    if (location.pathname !== DOCS[next].path) history.pushState({ kind: next }, "", DOCS[next].path);
    setKind(next);
    setView("edit");
    const app = document.getElementById("app");
    if (scroll && app && app.getBoundingClientRect().top < 0) app.scrollIntoView({ block: "start" });
  }, []);

  // Back/forward buttons, and the header's static links (handled here without a reload).
  useEffect(() => {
    const onPop = () => setKind(kindFromPath(location.pathname));
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-doc]");
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(link.dataset.doc as DocKind);
      document.getElementById("app")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, [navigate]);

  useEffect(() => setHead(kind), [kind]);

  // Warm the quote editor chunk while idle so switching to Quotes is instant.
  useEffect(() => {
    const warm = () => void import("./components/RichTextEditor");
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(warm);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Typing stays responsive; the preview catches up a frame later.
  const previewData = useDeferredValue(current);
  const previewKind = useDeferredValue(kind);
  const pages = useMemo(() => (engine ? engine.layout(previewData, previewKind) : null), [engine, previewData, previewKind]);

  const download = useCallback(() => {
    if (!engine) return;
    setDownloadState("working");
    // Let the spinner paint before the synchronous PDF build.
    requestAnimationFrame(() =>
      setTimeout(() => {
        engine.download(current, kind);
        setDownloadState("done");
        setTimeout(() => setDownloadState("idle"), 2200);
      }, 30)
    );
  }, [engine, current, kind]);

  const createInvoice = useCallback(async () => {
    if (
      !isBlankDraft(invoice) &&
      !(await confirm({
        title: "Replace your invoice draft?",
        message: (
          <>
            The invoice you were working on{invoice.invoiceNumber.trim() ? ` (${invoice.invoiceNumber.trim()})` : ""} will be replaced by a new invoice made
            from <strong className="font-semibold text-ink">{quote.invoiceNumber || "this quote"}</strong>. Save it first if you still need it.
          </>
        ),
        confirmText: "Create invoice",
        tone: "danger",
      }))
    )
      return;
    const next = quoteToInvoice(quote);
    setInvoice(next);
    navigate("invoice");
    setToast(`Created ${next.invoiceNumber} from ${quote.invoiceNumber || "the quote"}. Review it, then download or save.`);
  }, [confirm, invoice, quote, setInvoice, navigate]);

  return (
    <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
      <nav className="rise mb-6 flex justify-center lg:justify-start" aria-label="Document type">
        <div className="glass inline-flex gap-1 rounded-full p-1.5" role="tablist">
          {(
            [
              ["invoice", "Invoices", <Receipt key="i" size={16} />],
              ["quote", "Quotes", <FileSignature key="q" size={16} />],
            ] as const
          ).map(([value, label, icon]) => (
            <a
              key={value}
              href={DOCS[value].path}
              role="tab"
              aria-selected={kind === value}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                navigate(value);
              }}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                kind === value
                  ? "bg-gradient-to-b from-ruby-500 to-ruby-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_8px_18px_-8px_rgba(139,26,36,.8)]"
                  : "text-ink-soft hover:bg-white/70 hover:text-ruby-700"
              }`}
            >
              {icon}
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="sticky top-[4.75rem] z-30 mb-5 flex justify-center lg:hidden">
        <div className="glass-bar inline-flex rounded-full p-1 ring-1 ring-black/5" role="tablist" aria-label="Editor view">
          {(
            [
              ["edit", "Edit", <PencilLine key="e" size={15} />],
              ["preview", "Preview", <Eye key="p" size={15} />],
            ] as const
          ).map(([value, label, icon]) => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => {
                setView(value);
                document.getElementById("app")?.scrollIntoView({ block: "start" });
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                view === value ? "bg-gradient-to-b from-ruby-500 to-ruby-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_14px_-6px_rgba(139,26,36,.8)]" : "text-ink-soft hover:text-ruby-700"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-8">
        <div className={view === "preview" ? "hidden lg:block" : ""}>
          <InvoiceForm
            key={kind}
            doc={doc}
            invoice={current}
            setInvoice={setCurrent}
            onDownload={download}
            downloadState={downloadState}
            engineReady={!!engine}
            onCreateInvoice={kind === "quote" ? createInvoice : undefined}
          />
        </div>

        <aside
          aria-label="Live PDF preview"
          className={`glass rise p-3 sm:p-5 lg:sticky lg:top-24 ${view === "edit" ? "hidden lg:block" : ""}`}
          style={{ ["--d" as string]: "0.15s" }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ruby-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ruby-600" />
                </span>
                Live preview · {doc.title}
              </p>
              <p className="mt-1 text-sm text-ink-mute">
                A4 · {pages ? `${pages.length} ${pages.length === 1 ? "page" : "pages"}` : "preparing…"} · exactly what the PDF contains
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {kind === "quote" && (
                <button type="button" className="btn-glass" onClick={createInvoice} title="Create an invoice from this quote">
                  <ArrowRightLeft size={15} /> Create invoice
                </button>
              )}
              <DownloadButton state={downloadState} disabled={!engine} onClick={download} />
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-paper-deep/80 to-paper-deep/40 p-3 ring-1 ring-inset ring-black/[0.04] sm:p-6 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
            {engineError ? (
              <p className="p-6 text-center text-sm text-ruby-800">The PDF engine failed to load. Check your connection and reload the page.</p>
            ) : (
              <PdfPreview pages={pages} />
            )}
          </div>
        </aside>
      </div>

      {toast && (
        <div role="status" className="pop-in fixed inset-x-4 bottom-5 z-50 mx-auto w-fit max-w-[calc(100vw-2rem)] rounded-2xl px-5 py-3.5 text-sm text-ink shadow-sheet glass">
          {toast}
        </div>
      )}
    </div>
  );
}
