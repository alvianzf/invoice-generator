import { memo } from "react";
import { FONTS } from "../pdf/engine";
import { Page, PAGE_HEIGHT, PAGE_WIDTH, PT_TO_MM, RGB } from "../pdf/layout";

const rgb = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;

/** Draws one laid-out page as SVG, from the same ops the PDF is written from. */
const PdfPage = memo(function PdfPage({ page, index, total }: { page: Page; index: number; total: number }) {
  return (
    <figure className="fade-in">
      <div className="overflow-hidden rounded-[3px] bg-white shadow-sheet ring-1 ring-black/[0.04]">
        <svg viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`} className="block h-auto w-full" role="img" aria-label={`Invoice page ${index + 1} of ${total}`}>
          <rect width={PAGE_WIDTH} height={PAGE_HEIGHT} fill="#fff" />
          {page.ops.map((op, i) => {
            if (op.kind === "text") {
              return (
                <text key={i} x={op.x} y={op.y} className="pdf-text" fontFamily={FONTS[op.font].cssFamily} fontSize={op.size * PT_TO_MM} fill={rgb(op.color)}>
                  {op.text}
                </text>
              );
            }
            if (op.kind === "rect") {
              return <rect key={i} x={op.x} y={op.y} width={op.w} height={op.h} rx={op.radius} fill={rgb(op.color)} />;
            }
            return <line key={i} x1={op.x1} y1={op.y1} x2={op.x2} y2={op.y2} stroke={rgb(op.color)} strokeWidth={op.width} />;
          })}
        </svg>
      </div>
      <figcaption className="mt-2 text-center text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-mute">
        Page {index + 1} of {total}
      </figcaption>
    </figure>
  );
});

export default function PdfPreview({ pages }: { pages: Page[] | null }) {
  if (!pages) {
    return (
      <div className="relative aspect-[210/297] overflow-hidden rounded-[3px] bg-white/80 shadow-sheet" aria-busy="true" aria-label="Loading preview">
        <div className="absolute inset-0 -translate-x-full animate-[shine-bar_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-ruby-50 to-transparent" />
        <div className="space-y-3 p-[9%]">
          <div className="h-8 w-1/3 rounded bg-ruby-100/70" />
          <div className="h-px w-full bg-ruby-200" />
          {[70, 55, 90, 80, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-paper-deep" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {pages.map((page, i) => (
        <PdfPage key={i} page={page} index={i} total={pages.length} />
      ))}
    </div>
  );
}
