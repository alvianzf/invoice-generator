export interface Currency {
  code: string;
  label: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: "IDR", label: "Indonesian Rupiah", locale: "id-ID", decimals: 0 },
  { code: "USD", label: "US Dollar", locale: "en-US", decimals: 2 },
  { code: "EUR", label: "Euro", locale: "de-DE", decimals: 2 },
  { code: "GBP", label: "British Pound", locale: "en-GB", decimals: 2 },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG", decimals: 2 },
  { code: "AUD", label: "Australian Dollar", locale: "en-AU", decimals: 2 },
  { code: "MYR", label: "Malaysian Ringgit", locale: "ms-MY", decimals: 2 },
  { code: "JPY", label: "Japanese Yen", locale: "ja-JP", decimals: 0 },
];

export const getCurrency = (code: string): Currency =>
  CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

/**
 * Leniently parses a number typed in either convention ("27.500.000",
 * "27,500,000", "1.5", "1,5", "IDR 1.000"). When both separators appear the
 * last one is the decimal point. A single separator followed by exactly three
 * digits is treated as a thousands separator, unless the integer part is 0.
 */
export function parseNumber(input: string): number {
  const cleaned = input.replace(/[^0-9.,-]/g, "");
  if (!/\d/.test(cleaned)) return 0;

  const negative = cleaned.startsWith("-");
  const body = cleaned.replace(/-/g, "");
  const lastDot = body.lastIndexOf(".");
  const lastComma = body.lastIndexOf(",");

  let decimalSep: "." | "," | null = null;
  if (lastDot !== -1 && lastComma !== -1) {
    decimalSep = lastDot > lastComma ? "." : ",";
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? "." : ",";
    const occurrences = body.split(sep).length - 1;
    const digitsAfter = body.length - body.lastIndexOf(sep) - 1;
    const integerPart = body.slice(0, body.indexOf(sep));
    if (occurrences === 1 && (digitsAfter !== 3 || /^0?$/.test(integerPart))) decimalSep = sep;
  }

  let normalized: string;
  if (decimalSep) {
    const i = body.lastIndexOf(decimalSep);
    normalized = body.slice(0, i).replace(/[.,]/g, "") + "." + body.slice(i + 1);
  } else {
    normalized = body.replace(/[.,]/g, "");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return negative ? -value : value;
}

export function formatNumber(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(value);
}

export function formatMoney(value: number, currency: Currency): string {
  return `${currency.code} ${formatNumber(value, currency)}`;
}

/** Quantities keep whatever precision was typed, up to 3 decimals. */
export function formatQuantity(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    maximumFractionDigits: 3,
  }).format(value);
}
