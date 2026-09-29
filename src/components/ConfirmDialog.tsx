import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Confirm, ConfirmContext, ConfirmOptions } from "../lib/confirm";

/** Promise-based confirmation modal, styled to match the app, replacing window.confirm. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolver = useRef<(value: boolean) => void>();
  const returnFocus = useRef<HTMLElement | null>(null);

  const confirm = useCallback<Confirm>((opts) => {
    resolver.current?.(false);
    returnFocus.current = document.activeElement as HTMLElement | null;
    setClosing(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => (resolver.current = resolve));
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!options || !dialog || dialog.open) return;
    dialog.showModal();
    // Destructive prompts focus Cancel so a stray Enter can't delete anything.
    dialog.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
  }, [options]);

  const finish = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = undefined;
    setClosing(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      dialogRef.current?.close();
      setOptions(null);
      setClosing(false);
      returnFocus.current?.focus?.({ preventScroll: true });
    }, reduce ? 0 : 160);
  }, []);

  const danger = options?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        className={`confirm-dialog ${closing ? "is-closing" : ""}`}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onCancel={(e) => {
          e.preventDefault();
          finish(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) finish(false);
        }}
      >
        {options && (
          <div className="glass w-[min(26rem,calc(100vw-2rem))] p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${
                  danger ? "bg-ruby-50 text-ruby-700 ring-ruby-100" : "bg-white text-ink-soft ring-black/5"
                } shadow-[inset_0_1px_0_#fff,0_6px_14px_-8px_rgba(139,26,36,.5)]`}
              >
                {danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 id="confirm-title" className="font-display text-[1.7rem] leading-tight text-ink">
                  {options.title}
                </h2>
                <div id="confirm-message" className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  {options.message}
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-glass px-5 py-2.5" onClick={() => finish(false)} data-autofocus={danger ? "" : undefined}>
                {options.cancelText ?? "Cancel"}
              </button>
              <button type="button" className="btn-ruby px-5" onClick={() => finish(true)} data-autofocus={danger ? undefined : ""}>
                {options.confirmText ?? "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
