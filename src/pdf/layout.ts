import { InvoiceData } from "../types";
import { formatInvoiceDate, isBlankItem, itemAmount, invoiceTotal } from "../lib/invoice";
import { formatMoney, formatNumber, formatQuantity, getCurrency, parseNumber } from "../lib/money";

/*
 * Page layout shared by the PDF and the on-screen preview. Everything is
 * positioned here in millimetres, with text wrapped using the real font
 * metrics, so both renderers only have to draw the resulting ops verbatim.
 */

export type RGB = readonly [number, number, number];
export type FontKey = "regular" | "bold" | "serif";

export type Op =
  | { kind: "text"; x: number; y: number; text: string; font: FontKey; size: number; color: RGB }
  | { kind: "rect"; x: number; y: number; w: number; h: number; color: RGB; radius: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; color: RGB; width: number };

export interface Page {
  ops: Op[];
}

/** Width in mm of `text` set in `font` at `size` pt. */
export type Measure = (text: string, font: FontKey, size: number) => number;

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const PT_TO_MM = 25.4 / 72;

const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOP = 20;
const BOTTOM = PAGE_HEIGHT - 24;
/** Rows shorter than this move to the next page whole instead of splitting. */
const KEEP_TOGETHER = 60;

export const COLORS = {
  ink: [28, 25, 23],
  muted: [120, 113, 108],
  rule: [231, 226, 222],
  accent: [139, 26, 36],
  tint: [250, 241, 240],
} satisfies Record<string, RGB>;

interface TextStyle {
  font: FontKey;
  size: number;
  color: RGB;
  leading?: number;
}

const STYLES = {
  title: { font: "serif", size: 34, color: COLORS.accent, leading: 1.05 },
  label: { font: "bold", size: 7, color: COLORS.accent },
  metaLabel: { font: "bold", size: 7, color: COLORS.muted },
  metaValue: { font: "bold", size: 10, color: COLORS.ink },
  name: { font: "bold", size: 11, color: COLORS.ink },
  body: { font: "regular", size: 9.5, color: COLORS.ink },
  bodyMuted: { font: "regular", size: 9, color: COLORS.muted },
  th: { font: "bold", size: 7, color: COLORS.muted },
  cellMuted: { font: "regular", size: 8.5, color: COLORS.muted },
  totalLabel: { font: "bold", size: 8, color: COLORS.accent },
  totalValue: { font: "bold", size: 14, color: COLORS.ink },
  note: { font: "regular", size: 8.5, color: COLORS.muted },
  footer: { font: "regular", size: 7.5, color: COLORS.muted },
} satisfies Record<string, TextStyle>;

const lineHeight = (s: TextStyle) => s.size * PT_TO_MM * (s.leading ?? 1.42);

interface Line {
  text: string;
  style: TextStyle;
  /** Extra space below this line, in mm. */
  gap?: number;
}

interface Cell {
  x: number;
  width: number;
  align?: "left" | "right";
  lines: Line[];
}

const lineBox = (l: Line) => lineHeight(l.style) + (l.gap ?? 0);

/** Greedy word wrap that honours newlines and breaks words wider than the column. */
export function wrapText(text: string, style: TextStyle, width: number, measure: Measure): string[] {
  const fits = (s: string) => measure(s, style.font, style.size) <= width;
  const out: string[] = [];

  for (const paragraph of text.replace(/\r/g, "").replace(/\t/g, " ").trim().split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ").filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (fits(candidate)) {
        line = candidate;
        continue;
      }
      if (line) out.push(line);
      line = "";
      if (fits(word)) {
        line = word;
        continue;
      }
      for (const ch of Array.from(word)) {
        if (line && !fits(line + ch)) {
          out.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
    }
    out.push(line);
  }
  return out;
}

class Flow {
  pages: Page[] = [];
  y = TOP;
  /** Redrawn at the top of every continuation page, e.g. a table header. */
  repeat: (() => void) | null = null;

  constructor(private measure: Measure, private continuationLabel: string) {
    this.pages.push({ ops: [] });
  }

  get ops() {
    return this.pages[this.pages.length - 1].ops;
  }

  get room() {
    return BOTTOM - this.y;
  }

  newPage() {
    this.pages.push({ ops: [] });
    this.y = TOP;
    this.text(MARGIN, this.y, { text: this.continuationLabel, style: STYLES.footer });
    this.y += 9;
    this.repeat?.();
  }

  /** Starts a new page unless `height` mm fit on the current one. */
  ensure(height: number) {
    if (height > this.room) this.newPage();
  }

  lines(text: string, style: TextStyle, width: number, gap?: number): Line[] {
    const wrapped = wrapText(text, style, width, this.measure);
    return wrapped.map((t, i) => ({ text: t, style, gap: i === wrapped.length - 1 ? gap : undefined }));
  }

  text(x: number, top: number, line: Line, width?: number, align: "left" | "right" = "left") {
    if (!line.text) return;
    const { style } = line;
    const em = style.size * PT_TO_MM;
    const baseline = top + (lineHeight(style) - em) / 2 + em * 0.8;
    const drawX =
      align === "right" && width !== undefined
        ? x + width - this.measure(line.text, style.font, style.size)
        : x;
    this.ops.push({ kind: "text", x: drawX, y: baseline, text: line.text, font: style.font, size: style.size, color: style.color });
  }

  rule(y: number, color: RGB = COLORS.rule, width = 0.2, x1 = MARGIN, x2 = MARGIN + CONTENT_WIDTH) {
    this.ops.push({ kind: "line", x1, y1: y, x2, y2: y, color, width });
  }

  /**
   * Draws cells side by side, each an independent column of lines. If the
   * row does not fit, short rows move to the next page and tall rows are
   * split line by line across as many pages as needed.
   */
  row(
    cells: Cell[],
    opts: {
      padY?: number;
      background?: (top: number, height: number) => void;
      after?: (bottom: number) => void;
    } = {}
  ) {
    const padY = opts.padY ?? 0;
    const cellHeight = (c: Cell, from: number, to: number) =>
      c.lines.slice(from, to).reduce((h, l) => h + lineBox(l), 0);
    const total = Math.max(0, ...cells.map((c) => cellHeight(c, 0, c.lines.length))) + padY * 2;

    if (total > this.room && total <= KEEP_TOGETHER) this.newPage();

    const next = cells.map(() => 0);
    const remaining = () => cells.some((c, i) => next[i] < c.lines.length);
    let freshPage = false;

    while (remaining()) {
      const avail = this.room - padY * 2;
      const until = cells.map((c, i) => {
        let h = 0;
        let j = next[i];
        while (j < c.lines.length && h + lineBox(c.lines[j]) <= avail) h += lineBox(c.lines[j++]);
        return j;
      });

      if (until.every((j, i) => j === next[i])) {
        if (!freshPage) {
          this.newPage();
          freshPage = true;
          continue;
        }
        // A single line taller than a whole page: draw it anyway.
        cells.forEach((c, i) => (until[i] = Math.min(c.lines.length, next[i] + 1)));
      }

      const chunk = Math.max(...cells.map((c, i) => cellHeight(c, next[i], until[i]))) + padY * 2;
      opts.background?.(this.y, chunk);
      cells.forEach((c, i) => {
        let top = this.y + padY;
        for (const line of c.lines.slice(next[i], until[i])) {
          this.text(c.x, top, line, c.width, c.align);
          top += lineBox(line);
        }
        next[i] = until[i];
      });
      this.y += chunk;
      opts.after?.(this.y);

      if (remaining()) {
        this.newPage();
        freshPage = true;
      }
    }
  }
}

export function layoutInvoice(data: InvoiceData, measure: Measure): Page[] {
  const currency = getCurrency(data.currency);
  const invoiceLabel = data.invoiceNumber.trim() ? `Invoice ${data.invoiceNumber.trim()}` : "Invoice";
  const flow = new Flow(measure, `${invoiceLabel} (continued)`);
  const L = (text: string, style: TextStyle, width: number, gap?: number) => flow.lines(text, style, width, gap);

  // Header: title on the left, invoice number and date on the right.
  const metaWidth = 40;
  const metaX2 = MARGIN + CONTENT_WIDTH - metaWidth;
  const metaX1 = metaX2 - metaWidth - 6;
  flow.row([
    { x: MARGIN, width: 80, lines: L("Invoice", STYLES.title, 80) },
    {
      x: metaX1,
      width: metaWidth,
      lines: [...L("INVOICE NO.", STYLES.metaLabel, metaWidth, 1), ...L(data.invoiceNumber || "—", STYLES.metaValue, metaWidth)],
    },
    {
      x: metaX2,
      width: metaWidth,
      lines: [...L("ISSUE DATE", STYLES.metaLabel, metaWidth, 1), ...L(formatInvoiceDate(data.invoiceDate) || "—", STYLES.metaValue, metaWidth)],
    },
  ]);
  flow.y += 5;
  flow.rule(flow.y, COLORS.accent, 0.5);
  flow.y += 9;

  // Parties.
  const partyWidth = 80;
  const party = (label: string, name: string, address: string, extras: [string, string][]) => [
    ...L(label, STYLES.label, partyWidth, 1.6),
    ...L(name || "—", STYLES.name, partyWidth, 0.8),
    ...(address.trim() ? L(address, STYLES.body, partyWidth, 1.2) : []),
    ...extras.filter(([, v]) => v.trim()).flatMap(([k, v]) => L(`${k}: ${v}`, STYLES.bodyMuted, partyWidth)),
  ];
  flow.row([
    {
      x: MARGIN,
      width: partyWidth,
      lines: party("BILLED TO", data.billedToCompanyName, data.billedToAddress, [
        ["Company ID", data.billedToCompanyId],
        ["VAT", data.billedToVat],
      ]),
    },
    {
      x: MARGIN + CONTENT_WIDTH - partyWidth,
      width: partyWidth,
      lines: party("FROM", data.fromName, data.fromAddress, [["VAT", data.fromVat]]),
    },
  ]);
  flow.y += 11;

  // Line items.
  const col = {
    index: { x: MARGIN, width: 7 },
    desc: { x: MARGIN + 7, width: 86 },
    qty: { x: MARGIN + 95, width: 17 },
    price: { x: MARGIN + 114, width: 28 },
    amount: { x: MARGIN + 144, width: 30 },
  };
  const header = () =>
    flow.row(
      [
        { ...col.index, lines: L("#", STYLES.th, col.index.width) },
        { ...col.desc, lines: L("DESCRIPTION", STYLES.th, col.desc.width) },
        { ...col.qty, align: "right", lines: L("QTY", STYLES.th, col.qty.width) },
        { ...col.price, align: "right", lines: L("UNIT PRICE", STYLES.th, col.price.width) },
        { ...col.amount, align: "right", lines: L(`AMOUNT (${currency.code})`, STYLES.th, col.amount.width) },
      ],
      { padY: 2.2, after: (y) => flow.rule(y, COLORS.accent, 0.35) }
    );

  flow.ensure(30);
  header();
  flow.repeat = header;

  const items = data.items.filter((item) => !isBlankItem(item));
  const separator = (y: number) => flow.rule(y);
  if (items.length === 0) {
    flow.row([{ ...col.desc, lines: L("No line items yet", STYLES.bodyMuted, col.desc.width) }], { padY: 3.2, after: separator });
  }
  items.forEach((item, i) => {
    const priced = item.quantity.trim() !== "" && item.price.trim() !== "";
    const qty = item.quantity.trim() ? formatQuantity(parseNumber(item.quantity), currency) : "";
    const price = item.price.trim() ? formatNumber(parseNumber(item.price), currency) : "";
    flow.row(
      [
        { ...col.index, lines: L(String(i + 1), STYLES.cellMuted, col.index.width) },
        { ...col.desc, lines: L(item.description || "—", STYLES.body, col.desc.width) },
        { ...col.qty, align: "right", lines: L(qty, STYLES.body, col.qty.width) },
        { ...col.price, align: "right", lines: L(price, STYLES.body, col.price.width) },
        { ...col.amount, align: "right", lines: L(priced ? formatNumber(itemAmount(item), currency) : "", STYLES.body, col.amount.width) },
      ],
      { padY: 3.2, after: separator }
    );
  });
  flow.repeat = null;
  flow.y += 5;

  // Total.
  const totalWidth = 84;
  const totalX = MARGIN + CONTENT_WIDTH - totalWidth;
  flow.row(
    [
      { x: totalX + 5, width: 26, lines: L("TOTAL DUE", STYLES.totalLabel, 26) },
      { x: totalX + 31, width: totalWidth - 36, align: "right", lines: L(formatMoney(invoiceTotal(data), currency), STYLES.totalValue, totalWidth - 36) },
    ],
    {
      padY: 4.5,
      background: (top, h) => flow.ops.push({ kind: "rect", x: totalX, y: top, w: totalWidth, h, color: COLORS.tint, radius: 1.5 }),
    }
  );
  flow.y += 12;

  // Payment details.
  const payment: [string, string][] = (
    [
      ["Bank", data.bankName],
      ["Account name", data.accountName],
      ["Account number", data.accountNumber],
      ["SWIFT / BIC", data.swiftCode],
    ] as [string, string][]
  ).filter(([, v]) => v.trim());

  if (payment.length) {
    flow.ensure(lineHeight(STYLES.label) + 12);
    flow.row([{ x: MARGIN, width: CONTENT_WIDTH, lines: L("PAYMENT DETAILS", STYLES.label, CONTENT_WIDTH, 1.6) }]);
    for (const [label, value] of payment) {
      flow.row(
        [
          { x: MARGIN, width: 34, lines: L(label, STYLES.bodyMuted, 34) },
          { x: MARGIN + 36, width: 100, lines: L(value, STYLES.body, 100) },
        ],
        { padY: 0.9 }
      );
    }
    flow.y += 9;
  }

  // Contact note.
  const contacts = [data.contactEmail, data.contactPhone].map((s) => s.trim()).filter(Boolean);
  if (contacts.length) {
    const note = `For any questions about this invoice, please contact ${contacts.join(" or ")}.`;
    flow.rule(flow.y);
    flow.y += 4;
    flow.row([{ x: MARGIN, width: CONTENT_WIDTH, lines: L(note, STYLES.note, CONTENT_WIDTH) }]);
  }

  // Footer on every page.
  const pages = flow.pages;
  pages.forEach((page, i) => {
    const footerTop = PAGE_HEIGHT - 16;
    page.ops.push({ kind: "line", x1: MARGIN, y1: footerTop, x2: MARGIN + CONTENT_WIDTH, y2: footerTop, color: COLORS.rule, width: 0.2 });
    const style = STYLES.footer;
    const baseline = footerTop + 6;
    const pageLabel = `Page ${i + 1} of ${pages.length}`;
    page.ops.push({ kind: "text", x: MARGIN, y: baseline, text: invoiceLabel, font: style.font, size: style.size, color: style.color });
    page.ops.push({
      kind: "text",
      x: MARGIN + CONTENT_WIDTH - measure(pageLabel, style.font, style.size),
      y: baseline,
      text: pageLabel,
      font: style.font,
      size: style.size,
      color: style.color,
    });
  });

  return pages;
}
