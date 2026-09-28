import type { CurrencyCode } from "@/services/supabase/types/settings";

export const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: "USD", label: "US Dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "GBP", label: "British Pound", locale: "en-GB" },
  { code: "INR", label: "Indian Rupee", locale: "en-IN" },
  { code: "JPY", label: "Japanese Yen", locale: "ja-JP" },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG" },
];

/** Parse `yyyy-MM-dd` as a *local* date so days never shift across timezones. */
export function parseDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** `yyyy-MM` key for a `yyyy-MM-dd` date string. */
export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKeyOf(todayISO());
}

export function monthKeyToDate(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function addMonthsToKey(key: string, amount: number): string {
  const date = monthKeyToDate(key);
  date.setMonth(date.getMonth() + amount);
  return monthKeyOf(toISODate(date));
}

export function formatMonthLabel(key: string, locale = "en-US", style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(locale, { month: style, year: "numeric" }).format(monthKeyToDate(key));
}

export function formatMonthShort(key: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(monthKeyToDate(key));
}

export function formatDayLabel(iso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(parseDate(iso));
}

export function formatFullDate(iso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parseDate(iso));
}

/** "Today" / "Yesterday" / "Monday" / "12 Mar 2024" grouping label. */
export function relativeDayLabel(iso: string, locale = "en-US"): string {
  const date = parseDate(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startOfToday.getTime() - date.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
  }
  if (diffDays < 365) return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(date);
  return formatFullDate(iso, locale);
}

export interface FormatOptions {
  currency: CurrencyCode;
  locale: string;
}

export function formatCurrency(amount: number, options: FormatOptions): string {
  // No explicit fraction digits: Intl applies each currency's own convention,
  // so USD/EUR get two decimals while JPY gets none.
  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
  }).format(amount);
}

/** Signed currency, e.g. `+1.234,00 €` / `-89,00 €`. */
export function formatSignedCurrency(amount: number, type: "income" | "expense", options: FormatOptions) {
  const signed = type === "income" ? Math.abs(amount) : -Math.abs(amount);
  const formatted = formatCurrency(Math.abs(signed), options);
  return `${signed >= 0 ? "+" : "-"}${formatted}`;
}

export function formatCompactCurrency(amount: number, options: FormatOptions): string {
  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value >= 0 ? "" : "-"}${Math.abs(value).toFixed(digits)}%`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Days left until an ISO date, negative when overdue. */
export function daysUntil(iso: string): number {
  const target = parseDate(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
}
