"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Pencil, PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { DashboardSkeleton, EmptyState, ErrorState } from "@/components/dashboard/state-views";
import { StatCard } from "@/components/dashboard/transactions/stat-card";
import { BudgetDialog } from "@/components/dashboard/finance/budget-dialog";
import { budgetRows, summarizeMonth, type BudgetRow } from "@/services/supabase/utils/analytics";
import { currentMonthKey, formatCurrency, round2 } from "@/services/supabase/utils/format";
import { useData } from "@/services/supabase/contexts/data-provider";
import { useMonthFilter } from "@/hooks/use-month-filter";
import { cn } from "@/lib/utils";
import type { Budget } from "@/services/supabase/types/budget";  

export default function FinancePage() {
  const { status, error, reload, transactions, budgets, format, settings } = useData();
  const { monthKey, setMonthKey } = useMonthFilter();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);

  const view = useMemo(() => {
    const summary = summarizeMonth(transactions, monthKey);
    const rows = budgetRows(budgets, transactions, monthKey);
    const overall = rows.find((row) => row.budget.category === "overall");
    const categoryRows = rows.filter((row) => row.budget.category !== "overall");
    const budgeted = overall?.budget.amount ?? round2(categoryRows.reduce((sum, row) => sum + row.budget.amount, 0));
    const remaining = round2(budgeted - summary.expense);

    const [year, month] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = monthKey === currentMonthKey();
    const today = new Date().getDate();
    const daysLeft = isCurrentMonth ? Math.max(1, daysInMonth - today + 1) : 0;
    const safePerDay = overall && daysLeft > 0 ? round2(Math.max(0, overall.remaining) / daysLeft) : null;

    return { summary, overall, categoryRows, budgeted, remaining, daysLeft, safePerDay };
  }, [transactions, budgets, monthKey]);

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "error") return <ErrorState message={error} onRetry={reload} />;

  const overall = view.overall;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">Your monthly budget and what is left to spend.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector monthKey={monthKey} onChange={setMonthKey} locale={settings.locale} />
          <Button variant="outline" onClick={() => setCreating(true)}>
            <Plus />
            Add budget
          </Button>
        </div>
      </div>

      <section aria-label="Income and expense summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Income"
          accent="income"
          value={formatCurrency(view.summary.income, format)}
          delta={view.summary.incomeDelta}
        />
        <StatCard
          label="Expenses"
          accent="expense"
          share={view.summary.expenseRate}
          value={formatCurrency(view.summary.expense, format)}
          delta={view.summary.expenseDelta}
        />
        <StatCard
          label="Budgeted"
          accent="goal"
          value={formatCurrency(view.budgeted, format)}
          hint={`${budgets.length} budget${budgets.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Remaining"
          accent={view.remaining >= 0 ? "savings" : "expense"}
          value={formatCurrency(view.remaining, format)}
          hint={view.remaining >= 0 ? "Still within budget" : "Over budget this month"}
        />
      </section>

      {overall ? (
        <Card className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Monthly budget</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatCurrency(overall.spent, format)}
                <span className="ml-1.5 text-base font-normal text-muted-foreground">
                  / {formatCurrency(overall.budget.amount, format)}
                </span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(overall.budget)}>
              <Pencil />
              Edit
            </Button>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500 ease-out",
                overall.over ? "bg-expense" : "bg-income",
              )}
              style={{ width: `${Math.min(100, overall.percent)}%` }}
            />
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Metric
              label={overall.over ? "Over budget" : "Left to spend"}
              value={formatCurrency(Math.abs(overall.remaining), format)}
              tone={overall.over ? "expense" : "income"}
            />
            <Metric label="Of budget used" value={`${overall.percent}%`} />
            <Metric
              label={view.daysLeft > 0 ? "Safe to spend / day" : "Period closed"}
              value={view.safePerDay !== null ? formatCurrency(view.safePerDay, format) : "—"}
              hint={view.daysLeft > 0 ? `${view.daysLeft} days left` : undefined}
            />
          </div>
        </Card>
      ) : (
        <Card className="gap-3">
          <p className="text-sm font-medium">No monthly budget yet</p>
          <p className="text-sm text-muted-foreground">
            Set a total monthly limit to see spent vs remaining and a safe-to-spend figure for each day.
          </p>
          <Button size="sm" className="w-fit" onClick={() => setCreating(true)}>
            <Plus />
            Set a monthly budget
          </Button>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Category budgets</h2>
          <span className="text-xs text-muted-foreground">{view.categoryRows.length} active</span>
        </div>

        {view.categoryRows.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="size-4" />}
            title="No category budgets"
            description="Give groceries, restaurants or subscriptions their own limit to keep spending honest."
            action={
              <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
                <Plus />
                Add a category budget
              </Button>
            }
          />
        ) : (
          <Card>
            <ul className="flex flex-col divide-y divide-border/60">
              {view.categoryRows.map((row) => (
                <BudgetListItem key={row.budget.id} row={row} onEdit={() => setEditing(row.budget)} />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Looking for trends?{" "}
        <Link href="/reports" className="underline underline-offset-4 hover:text-foreground">
          Open reports
        </Link>
      </p>

      <BudgetDialog open={creating} onOpenChange={setCreating} />
      <BudgetDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} budget={editing} />
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "income" | "expense";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular text-base font-medium",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
    </div>
  );
}

function BudgetListItem({ row, onEdit }: { row: BudgetRow; onEdit: () => void }) {
  const { format } = useData();
  const width = Math.min(100, row.percent);

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <span aria-hidden>{row.emoji}</span>
          <span className="truncate font-medium">{row.label}</span>
          {row.over && (
            <span className="inline-flex items-center gap-1 rounded-full bg-expense/10 px-2 py-0.5 text-[0.68rem] font-medium text-expense">
              <AlertCircle className="size-3" />
              over
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className="tabular text-sm">
            {formatCurrency(row.spent, format)}
            <span className="text-xs text-muted-foreground"> / {formatCurrency(row.budget.amount, format)}</span>
          </span>
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${row.label} budget`} onClick={onEdit}>
            <Pencil />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", row.over ? "bg-expense" : "")}
            style={{ width: `${width}%`, backgroundColor: row.over ? undefined : row.color }}
          />
        </div>
        <span
          className={cn(
            "tabular w-24 shrink-0 text-right text-xs",
            row.over ? "text-expense" : "text-muted-foreground",
          )}
        >
          {row.over ? `+${formatCurrency(Math.abs(row.remaining), format)}` : `${formatCurrency(row.remaining, format)} left`}
        </span>
      </div>
    </li>
  );
}
