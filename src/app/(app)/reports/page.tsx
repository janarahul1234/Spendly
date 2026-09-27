"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardSkeleton, ErrorState } from "@/components/app/state-views";
import { CategoryBars, SpendingBar } from "@/components/expense/spending-bar";
import {
  CategoryDonut,
  ChartCard,
  IncomeVsExpenseChart,
  SavingsTrendChart,
  SpendingTrendChart,
} from "@/components/reports/charts";
import {
  categoryBreakdown,
  monthlyTrend,
  savingsTrend,
  totalsOf,
} from "@/lib/analytics";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthShort,
  round2,
} from "@/lib/format";
import { exportTransactionsCsv } from "@/lib/export";
import { useData } from "@/providers/data-provider";
import { cn } from "@/lib/utils";

const RANGES = [6, 12] as const;

export default function ReportsPage() {
  const { status, error, reload, transactions, format } = useData();
  const [range, setRange] = useState<(typeof RANGES)[number]>(6);

  const report = useMemo(() => {
    const trend = monthlyTrend(transactions, range);
    const labelled = trend.map((point) => ({
      ...point,
      label: formatMonthShort(point.monthKey, format.locale),
    }));
    const saved = savingsTrend(transactions, range).map((point, index) => ({
      ...point,
      label: labelled[index]?.label ?? point.monthKey,
    }));

    const inRange = new Set(trend.map((point) => point.monthKey));
    const rangeItems = transactions.filter((item) =>
      inRange.has(item.date.slice(0, 7)),
    );
    const totals = totalsOf(rangeItems);

    const expensesInRange = rangeItems.filter(
      (item) => item.type === "expense",
    );
    const slices = categoryBreakdown(expensesInRange);
    const expenseTotal = round2(
      slices.reduce((sum, slice) => sum + slice.total, 0),
    );

    const monthsWithData = labelled.filter(
      (point) => point.income > 0 || point.expense > 0,
    );
    const divisor = Math.max(1, monthsWithData.length);
    const averageIncome = round2(totals.income / divisor);
    const averageExpense = round2(totals.expense / divisor);
    const savingsRate =
      totals.income > 0 ? round2((totals.savings / totals.income) * 100) : 0;
    const best = monthsWithData.reduce<(typeof monthsWithData)[number] | null>(
      (current, point) =>
        current === null || point.net > current.net ? point : current,
      null,
    );

    return {
      labelled,
      saved,
      slices,
      expenseTotal,
      totals,
      averageIncome,
      averageExpense,
      savingsRate,
      best,
      rangeItems,
    };
  }, [transactions, range, format.locale]);

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "error")
    return <ErrorState message={error} onRetry={reload} />;

  const handleExport = () => {
    const count = exportTransactionsCsv(report.rangeItems, { format });
    toast.success(`Exported ${count} transactions`, {
      description: `Last ${range} months as CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {range}-month view of income, spending and savings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/70 p-0.5">
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors duration-200",
                  range === value
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value}M
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={report.rangeItems.length === 0}
          >
            <Download />
            Export
          </Button>
        </div>
      </div>

      <section
        aria-label="Report highlights"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <Highlight
          label="Avg. monthly income"
          value={formatCurrency(report.averageIncome, format)}
          tone="income"
        />
        <Highlight
          label="Avg. monthly spend"
          value={formatCurrency(report.averageExpense, format)}
          tone="expense"
        />
        <Highlight
          label="Savings rate"
          value={`${report.savingsRate}%`}
          tone="savings"
        />
        <Highlight
          label="Best month"
          value={
            report.best ? formatCompactCurrency(report.best.net, format) : "—"
          }
          hint={report.best?.label}
          tone="goal"
        />
      </section>

      <ChartCard
        title="Income vs expenses"
        description="Bars show how much came in and went out each month."
      >
        <IncomeVsExpenseChart
          data={report.labelled.map((point) => ({
            label: point.label,
            income: point.income,
            expense: point.expense,
          }))}
          format={format}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Monthly spending trend"
          description="Total expenses per month."
        >
          <SpendingTrendChart data={report.labelled} format={format} />
        </ChartCard>

        <ChartCard
          title="Savings trend"
          description="Money kept each month and the running total."
        >
          <SavingsTrendChart data={report.saved} format={format} />
        </ChartCard>
      </div>

      <ChartCard
        title="Category breakdown"
        description={`Where the ${formatCurrency(report.expenseTotal, format)} went over ${range} months.`}
      >
        {report.slices.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No expenses recorded in this period.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <CategoryDonut
              slices={report.slices}
              total={report.expenseTotal}
              format={format}
            />
            <div className="flex flex-col gap-4">
              <SpendingBar
                slices={report.slices}
                total={report.expenseTotal}
                format={format}
              />
              <CategoryBars
                slices={report.slices}
                total={report.expenseTotal}
                format={format}
                limit={7}
              />
            </div>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="Month by month"
        description="The numbers behind the charts."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-lg text-sm">
            <caption className="sr-only">
              Monthly income, expenses and net savings
            </caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="pb-2 font-medium">
                  Month
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Income
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Expenses
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Net
                </th>
                <th scope="col" className="pb-2 pl-6 font-medium">
                  Share of income spent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[...report.labelled].reverse().map((point) => {
                const rate =
                  point.income > 0
                    ? round2((point.expense / point.income) * 100)
                    : 0;
                return (
                  <tr
                    key={point.monthKey}
                    className="transition-colors duration-200 hover:bg-muted/50"
                  >
                    <th scope="row" className="py-2.5 text-left font-medium">
                      {formatMonthShort(point.monthKey, format.locale)}{" "}
                      {point.monthKey.slice(0, 4)}
                    </th>
                    <td className="tabular py-2.5 text-right text-income">
                      {formatCurrency(point.income, format)}
                    </td>
                    <td className="tabular py-2.5 text-right text-expense">
                      {formatCurrency(point.expense, format)}
                    </td>
                    <td
                      className={cn(
                        "tabular py-2.5 text-right font-medium",
                        point.net >= 0 ? "text-foreground" : "text-expense",
                      )}
                    >
                      {formatCurrency(point.net, format)}
                    </td>
                    <td className="py-2.5 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full max-w-32 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              rate > 100 ? "bg-expense" : "bg-goal",
                            )}
                            style={{ width: `${Math.min(100, rate)}%` }}
                          />
                        </div>
                        <span className="tabular w-10 text-right text-xs text-muted-foreground">
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function Highlight({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "income" | "expense" | "savings" | "goal";
}) {
  const toneClass = {
    income: "text-income",
    expense: "text-expense",
    savings: "text-savings",
    goal: "text-goal",
  }[tone];
  return (
    <Card className="gap-1 transition-shadow duration-200 hover:shadow-raised">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular truncate text-xl font-semibold tracking-tight",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
    </Card>
  );
}
