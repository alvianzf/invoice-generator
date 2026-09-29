import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Eye, PencilLine } from "lucide-react";
import InvoiceForm from "./components/InvoiceForm";
import PdfPreview from "./components/PdfPreview";
import { DownloadButton, DownloadState } from "./components/ui";
import { useInvoice } from "./lib/invoice";
import { Engine, loadEngine } from "./pdf/engine";

type View = "edit" | "preview";

export default function App() {
  const [invoice, setInvoice] = useInvoice();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [engineError, setEngineError] = useState(false);
  const [view, setView] = useState<View>("edit");
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");

  useEffect(() => {
    loadEngine().then(setEngine, (err) => {
      console.error(err);
      setEngineError(true);
    });
  }, []);

  // Typing stays responsive; the preview catches up a frame later.
  const previewData = useDeferredValue(invoice);
  const pages = useMemo(() => (engine ? engine.layout(previewData) : null), [engine, previewData]);

  const download = useCallback(() => {
    if (!engine) return;
    setDownloadState("working");
    // Let the spinner paint before the synchronous PDF build.
    requestAnimationFrame(() =>
      setTimeout(() => {
        engine.download(invoice);
        setDownloadState("done");
        setTimeout(() => setDownloadState("idle"), 2200);
      }, 30)
    );
  }, [engine, invoice]);

  return (
    <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-8">
        <div className={view === "preview" ? "hidden lg:block" : ""}>
          <InvoiceForm invoice={invoice} setInvoice={setInvoice} onDownload={download} downloadState={downloadState} engineReady={!!engine} />
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
                Live preview
              </p>
              <p className="mt-1 text-sm text-ink-mute">
                A4 · {pages ? `${pages.length} ${pages.length === 1 ? "page" : "pages"}` : "preparing…"} · exactly what the PDF contains
              </p>
            </div>
            <DownloadButton state={downloadState} disabled={!engine} onClick={download} />
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
    </div>
  );
}
