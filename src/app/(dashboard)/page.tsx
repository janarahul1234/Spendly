"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "@/components/app/month-selector";
import { DashboardSkeleton, ErrorState } from "@/components/app/state-views";
import { AddTransactionButton } from "@/components/expense/add-transaction-button";
import { StatCard } from "@/components/expense/stat-card";
import { SpendingBar } from "@/components/expense/spending-bar";
import { TransactionList } from "@/components/expense/transaction-list";
import {
  EMPTY_FILTERS,
  TransactionFilters,
  type TransactionFilterValue,
} from "@/components/expense/transaction-filters";
import {
  balanceThrough,
  distribution,
  filterTransactions,
  sortNewestFirst,
  summarizeMonth,
  transactionsOfMonth,
} from "@/lib/analytics";
import {
  addMonthsToKey,
  currentMonthKey,
  formatCurrency,
  formatMonthLabel,
  round2,
} from "@/lib/format";
import { useData } from "@/providers/data-provider";
import { useMonthFilter } from "@/hooks/use-month-filter";

export default function HomePage() {
  const { status, error, reload, transactions, format, settings } = useData();
  const { monthKey, setMonthKey } = useMonthFilter();
  const [filters, setFilters] = useState<TransactionFilterValue>(EMPTY_FILTERS);

  const view = useMemo(() => {
    const summary = summarizeMonth(transactions, monthKey);
    const monthly = transactionsOfMonth(transactions, monthKey);
    const expenses = monthly.filter((item) => item.type === "expense");
    const incomes = monthly.filter((item) => item.type === "income");
    const { slices, total } = distribution(expenses, 5);

    const lastYearKey = addMonthsToKey(monthKey, -12);
    const balanceYearAgo = balanceThrough(transactions, lastYearKey);

    // A year-on-year balance change is only meaningful once there is a full
    // extra year before the comparison point; otherwise the "before" figure is
    // an artefact of when logging started and produces absurd percentages.
    const earliest = transactions.reduce(
      (min, item) => (min === "" || item.date < min ? item.date : min),
      "",
    );
    const hasBaseline =
      earliest !== "" && earliest <= `${addMonthsToKey(monthKey, -24)}-01`;
    const balanceDelta =
      !hasBaseline || balanceYearAgo === 0
        ? null
        : round2(
            ((summary.balance - balanceYearAgo) / Math.abs(balanceYearAgo)) *
              100,
          );

    const [year, month] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = monthKey === currentMonthKey();
    const elapsedDays = isCurrentMonth ? new Date().getDate() : daysInMonth;
    const averageDailySpend = round2(
      summary.expense / Math.max(1, elapsedDays),
    );

    // Compare like with like: a per-day rate, not two month totals.
    const previousKey = addMonthsToKey(monthKey, -1);
    const [prevYear, prevMonth] = previousKey.split("-").map(Number);
    const previousDaily = round2(
      transactionsOfMonth(transactions, previousKey)
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0) /
        Math.max(1, new Date(prevYear, prevMonth, 0).getDate()),
    );
    const dailyDelta =
      previousDaily === 0
        ? null
        : round2(((averageDailySpend - previousDaily) / previousDaily) * 100);

    return {
      summary,
      expenses,
      incomes,
      slices,
      total,
      balanceDelta,
      averageDailySpend,
      dailyDelta,
    };
  }, [transactions, monthKey]);

  const visible = useMemo(
    () =>
      sortNewestFirst(
        filterTransactions(transactions, { ...filters, monthKey }),
      ),
    [transactions, filters, monthKey],
  );

  const isFiltered =
    filters.search.trim() !== "" ||
    filters.type !== "all" ||
    filters.categories.length > 0;

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "error")
    return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Summary
        </h1>
        <MonthSelector
          monthKey={monthKey}
          onChange={setMonthKey}
          locale={settings.locale}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 sm:gap-4">
          <p className="text-sm text-muted-foreground">Total balance</p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="tabular text-3xl font-semibold tracking-tight sm:text-4xl">
              {formatCurrency(view.summary.balance, format)}
            </p>
            {view.balanceDelta !== null && (
              <span
                className={`tabular flex items-center gap-0.5 text-xs font-medium ${
                  view.balanceDelta >= 0 ? "text-income" : "text-expense"
                }`}
              >
                {view.balanceDelta >= 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {Math.abs(view.balanceDelta).toFixed(1)}% vs last year
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Everything you have logged up to{" "}
            {formatMonthLabel(monthKey, settings.locale)}.
          </p>
        </Card>

        <Card className="gap-4 sm:gap-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Spending distribution
            </p>
            <p className="tabular text-sm font-medium">
              {formatCurrency(view.total, format)}
            </p>
          </div>
          {view.slices.length > 0 ? (
            <SpendingBar
              slices={view.slices}
              total={view.total}
              format={format}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No expenses logged in{" "}
              {formatMonthLabel(monthKey, settings.locale)} yet.
            </p>
          )}
        </Card>
      </section>

      <section
        aria-label="Monthly totals"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
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
          label="Savings"
          accent="savings"
          share={view.summary.savingsRate}
          value={formatCurrency(view.summary.savings, format)}
          delta={view.summary.savingsDelta}
        />
        <StatCard
          label="Avg. daily spend"
          accent="goal"
          value={formatCurrency(view.averageDailySpend, format)}
          delta={view.dailyDelta}
          hint={`${view.summary.count} transactions`}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Transactions
            </h2>
            <p className="text-sm text-muted-foreground">
              You had {view.incomes.length} income
              {view.incomes.length === 1 ? "" : "s"} and {view.expenses.length}{" "}
              expense{view.expenses.length === 1 ? "" : "s"} this month.
            </p>
          </div>
          <AddTransactionButton />
        </div>

        <TransactionFilters value={filters} onChange={setFilters} />

        <Card>
          <TransactionList
            transactions={visible}
            pageSize={8}
            empty={{
              title: isFiltered
                ? "No transactions match your filters"
                : "Nothing logged yet",
              description: isFiltered
                ? "Try a different search term or clear the filters."
                : "Add your first income or expense to see your monthly summary.",
              action: isFiltered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Clear filters
                </Button>
              ) : (
                <AddTransactionButton size="sm" />
              ),
            }}
          />
        </Card>
      </section>
    </div>
  );
}
