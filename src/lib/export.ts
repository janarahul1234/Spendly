import { formatCurrency, formatMonthLabel } from "@/lib/format";
import type { FormatOptions } from "@/lib/format";
import { getCategory } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsCsv(
  transactions: Transaction[],
  options: { format: FormatOptions; monthKey?: string },
): number {
  if (typeof window === "undefined") return 0;

  const header = ["Date", "Type", "Category", "Amount", "Currency", "Payment method", "Note"];
  const rows = transactions.map((item) => [
    item.date,
    item.type,
    getCategory(item.category).label,
    item.type === "income" ? item.amount : -item.amount,
    options.format.currency,
    item.paymentMethod,
    item.note,
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const suffix = options.monthKey ?? "all";
  triggerDownload(`\uFEFF${csv}`, `spendly-transactions-${suffix}.csv`, "text/csv");
  return transactions.length;
}

export function exportBackupJson(payload: Record<string, unknown>, filename = "spendly-backup.json"): void {
  if (typeof window === "undefined") return;
  triggerDownload(JSON.stringify(payload, null, 2), filename, "application/json");
}

/** Human-readable income/expense lines, handy for a printable report. */
export function buildReportText(
  transactions: Transaction[],
  options: FormatOptions,
  monthKey: string,
): string {
  const lines = transactions.map(
    (item) =>
      `${item.date}  ${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount, options).padStart(12)}  ${
        getCategory(item.category).label
      }${item.note ? `  (${item.note})` : ""}`,
  );
  return `${formatMonthLabel(monthKey, options.locale)}\n\n${lines.join("\n")}`;
}
