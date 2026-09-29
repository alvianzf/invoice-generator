import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, Download, Loader2 } from "lucide-react";

export function Field({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className="field" {...props} />
    </div>
  );
}

/** Textarea that grows with its content, so long addresses and descriptions stay readable. */
export function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(fit, [props.value]);
  // Wrapping changes when the web font arrives or the column width changes.
  useEffect(() => {
    let width = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== width) {
        width = entry.contentRect.width;
        fit();
      }
    });
    if (ref.current) observer.observe(ref.current);
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener("loadingdone", fit);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, []);
  return <textarea ref={ref} rows={1} {...props} className={props.className || "field"} />;
}

export function TextareaField({ label, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <AutoTextarea id={id} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field cursor-pointer appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-9" style={{ backgroundImage: CHEVRON }} {...props}>
        {children}
      </select>
    </div>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A837D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

/** Tweens between values so totals glide instead of jumping. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduce || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 550);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = start + (value - start) * eased;
      from.current = current;
      setShown(current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{format(shown)}</>;
}

export type DownloadState = "idle" | "working" | "done";

export function DownloadButton({ state, disabled, onClick, className = "" }: { state: DownloadState; disabled?: boolean; onClick: () => void; className?: string }) {
  return (
    <button type="button" className={`btn-ruby ${className}`} onClick={onClick} disabled={disabled || state === "working"}>
      {state === "working" ? (
        <Loader2 size={17} className="animate-spin" />
      ) : state === "done" ? (
        <Check size={17} className="pop-in" />
      ) : (
        <Download size={17} />
      )}
      <span>{state === "done" ? "Downloaded" : "Download PDF"}</span>
    </button>
  );
}

export function SectionCard({
  icon,
  title,
  hint,
  delay = 0,
  children,
  aside,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  delay?: number;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="glass rise p-5 sm:p-6" style={{ ["--d" as string]: `${delay}s` }}>
      <header className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-white to-ruby-50 text-ruby-700 shadow-[inset_0_1px_0_#fff,0_4px_10px_-4px_rgba(139,26,36,.35)] ring-1 ring-ruby-100">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[1.65rem] leading-none text-ink">{title}</h2>
          {hint && <p className="mt-1.5 text-sm text-ink-mute">{hint}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
