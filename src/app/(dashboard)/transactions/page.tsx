"use client";

import { useMemo, useState } from "react";
import { Download, LayoutList, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { DashboardSkeleton, ErrorState } from "@/components/dashboard/state-views";
import { AddTransactionButton } from "@/components/dashboard/transactions/add-transaction-button";
import {
  EMPTY_FILTERS,
  TransactionFilters,
  type TransactionFilterValue,
} from "@/components/dashboard/transactions/transaction-filters";
import { TransactionList } from "@/components/dashboard/transactions/transaction-list";
import { filterTransactions, sortNewestFirst, totalsOf } from "@/services/supabase/utils/analytics";
import { formatCurrency } from "@/services/supabase/utils/format";
import { exportTransactionsCsv } from "@/services/supabase/utils/export";
import { useData } from "@/services/supabase/contexts/data-provider";
import { useMonthFilter } from "@/hooks/use-month-filter";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const { status, error, reload, transactions, format, settings } = useData();
  const { monthKey, setMonthKey } = useMonthFilter();
  const [filters, setFilters] = useState<TransactionFilterValue>(EMPTY_FILTERS);
  const [grouped, setGrouped] = useState(true);
  const [scope, setScope] = useState<"month" | "all">("month");

  const filtered = useMemo(() => {
    const list = filterTransactions(transactions, {
      ...filters,
      monthKey: scope === "month" ? monthKey : undefined,
    });
    return sortNewestFirst(list);
  }, [transactions, filters, monthKey, scope]);

  const totals = useMemo(() => totalsOf(filtered), [filtered]);
  const isFiltered =
    filters.search.trim() !== "" || filters.type !== "all" || filters.categories.length > 0;

  const handleExport = () => {
    const count = exportTransactionsCsv(filtered, {
      format,
      monthKey: scope === "month" ? monthKey : undefined,
    });
    toast.success(`Exported ${count} transactions`, { description: "CSV saved to your downloads." });
  };

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "error") return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
            {scope === "month" ? " in this month" : " across all months"}
            {isFiltered ? " matching your filters" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download />
            Export
          </Button>
          <AddTransactionButton />
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-3">
          <SummaryCell label="Income" value={formatCurrency(totals.income, format)} tone="income" />
          <SummaryCell label="Expenses" value={formatCurrency(totals.expense, format)} tone="expense" />
          <SummaryCell
            label="Net"
            value={formatCurrency(totals.savings, format)}
            tone={totals.savings >= 0 ? "goal" : "expense"}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <TransactionFilters
          value={filters}
          onChange={setFilters}
          extraActive={scope !== "month"}
          onReset={() => setScope("month")}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border/70 p-0.5">
            {(["month", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                aria-pressed={scope === value}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors duration-200",
                  scope === value ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "month" ? "This month" : "All time"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Label
              htmlFor="group-by-date"
              className="flex cursor-pointer items-center gap-2 text-xs font-normal text-muted-foreground"
            >
              {grouped ? <Rows3 className="size-3.5" /> : <LayoutList className="size-3.5" />}
              Group by date
              <Switch id="group-by-date" checked={grouped} onCheckedChange={setGrouped} size="sm" />
            </Label>
            {scope === "month" && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <MonthSelector monthKey={monthKey} onChange={setMonthKey} locale={settings.locale} />
              </>
            )}
          </div>
        </div>
      </div>

      <Card>
        <TransactionList
          transactions={filtered}
          grouped={grouped}
          pageSize={15}
          empty={{
            title: isFiltered ? "No matching transactions" : "No transactions yet",
            description: isFiltered
              ? "Adjust the search, type or category filters to see more records."
              : "Log an income or expense and it will show up here, grouped by day.",
            action: isFiltered ? (
              <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            ) : (
              <AddTransactionButton size="sm" />
            ),
          }}
        />
      </Card>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "goal";
}) {
  const toneClass = { income: "text-income", expense: "text-expense", goal: "text-goal" }[tone];
  return (
    <div className="flex min-w-0 flex-col gap-1 border-l border-border/60 pl-3 first:border-0 first:pl-0 sm:pl-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("tabular truncate text-base font-semibold sm:text-lg", toneClass)}>{value}</span>
    </div>
  );
}
