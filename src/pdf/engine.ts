import type { jsPDF as JsPDF } from "jspdf";
import interRegularUrl from "../assets/fonts/Inter-Regular.ttf?url";
import interSemiBoldUrl from "../assets/fonts/Inter-SemiBold.ttf?url";
import serifUrl from "../assets/fonts/InstrumentSerif-Regular.ttf?url";
import { InvoiceData } from "../types";
import { FontKey, layoutInvoice, Measure, Page } from "./layout";

/** How each font key maps to jsPDF names and to the preview's CSS family. */
export const FONTS: Record<FontKey, { url: string; file: string; pdfFamily: string; pdfStyle: string; cssFamily: string }> = {
  regular: { url: interRegularUrl, file: "Inter-Regular.ttf", pdfFamily: "Inter", pdfStyle: "normal", cssFamily: "PdfInterRegular" },
  bold: { url: interSemiBoldUrl, file: "Inter-SemiBold.ttf", pdfFamily: "Inter", pdfStyle: "bold", cssFamily: "PdfInterSemiBold" },
  serif: { url: serifUrl, file: "InstrumentSerif-Regular.ttf", pdfFamily: "InstrumentSerif", pdfStyle: "normal", cssFamily: "PdfSerif" },
};

export interface Engine {
  layout: (data: InvoiceData) => Page[];
  download: (data: InvoiceData) => void;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

let enginePromise: Promise<Engine> | null = null;

export function loadEngine(): Promise<Engine> {
  enginePromise ??= createEngine().catch((err) => {
    enginePromise = null;
    throw err;
  });
  return enginePromise;
}

async function createEngine(): Promise<Engine> {
  const keys = Object.keys(FONTS) as FontKey[];
  const [{ jsPDF }, buffers] = await Promise.all([
    import("jspdf"),
    Promise.all(keys.map((k) => fetch(FONTS[k].url).then((r) => r.arrayBuffer()))),
  ]);

  const base64 = keys.map((_, i) => toBase64(buffers[i]));

  // The preview draws with the very same font files, so wrapping and widths match the PDF.
  await Promise.all(
    keys.map(async (k, i) => {
      const face = new FontFace(FONTS[k].cssFamily, buffers[i]);
      document.fonts.add(await face.load());
    })
  );
  const createDoc = (): JsPDF => {
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    keys.forEach((k, i) => {
      const f = FONTS[k];
      doc.addFileToVFS(f.file, base64[i]);
      doc.addFont(f.file, f.pdfFamily, f.pdfStyle);
    });
    return doc;
  };

  const measurer = createDoc();
  const cache = new Map<string, number>();
  const measure: Measure = (text, font, size) => {
    const key = `${font}|${size}|${text}`;
    let width = cache.get(key);
    if (width === undefined) {
      if (cache.size > 20000) cache.clear();
      measurer.setFont(FONTS[font].pdfFamily, FONTS[font].pdfStyle);
      measurer.setFontSize(size);
      width = measurer.getTextWidth(text);
      cache.set(key, width);
    }
    return width;
  };

  const layout = (data: InvoiceData) => layoutInvoice(data, measure);

  const download = (data: InvoiceData) => {
    const doc = createDoc();
    const number = data.invoiceNumber.trim();
    doc.setProperties({
      title: number ? `Invoice ${number}` : "Invoice",
      subject: "Invoice",
      author: data.fromName,
      creator: "Invoice Generator (invoice.alvianzf.id)",
    });

    layout(data).forEach((page, i) => {
      if (i > 0) doc.addPage();
      for (const op of page.ops) {
        if (op.kind === "text") {
          doc.setFont(FONTS[op.font].pdfFamily, FONTS[op.font].pdfStyle);
          doc.setFontSize(op.size);
          doc.setTextColor(...op.color);
          doc.text(op.text, op.x, op.y);
        } else if (op.kind === "rect") {
          doc.setFillColor(...op.color);
          doc.roundedRect(op.x, op.y, op.w, op.h, op.radius, op.radius, "F");
        } else {
          doc.setDrawColor(...op.color);
          doc.setLineWidth(op.width);
          doc.line(op.x1, op.y1, op.x2, op.y2);
        }
      }
    });

    const safeName = (number || "invoice").replace(/[^\w.-]+/g, "_");
    doc.save(`Invoice_${safeName}.pdf`);
  };

  return { layout, download };
}
