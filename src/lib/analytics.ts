import { accentHex, getCategory } from "@/lib/categories";
import { addMonthsToKey, monthKeyOf, round2 } from "@/lib/format";
import type { Budget, Transaction } from "@/lib/types";

/** Aggregations that power the dashboard, finance and report views. */

export function transactionsOfMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter((item) => monthKeyOf(item.date) === monthKey);
}

export interface Totals {
  income: number;
  expense: number;
  savings: number;
}

export function totalsOf(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const item of transactions) {
    if (item.type === "income") income += item.amount;
    else expense += item.amount;
  }
  return { income: round2(income), expense: round2(expense), savings: round2(income - expense) };
}

/** Running balance for every transaction dated on or before `monthKey`. */
export function balanceThrough(transactions: Transaction[], monthKey: string): number {
  return round2(
    transactions
      .filter((item) => monthKeyOf(item.date) <= monthKey)
      .reduce((sum, item) => sum + (item.type === "income" ? item.amount : -item.amount), 0),
  );
}

export interface MonthSummary extends Totals {
  balance: number;
  previous: Totals;
  incomeDelta: number;
  expenseDelta: number;
  savingsDelta: number;
  /** Share of income that was spent, 0-100. */
  expenseRate: number;
  /** Share of income that was kept, 0-100. */
  savingsRate: number;
  count: number;
}

export function summarizeMonth(transactions: Transaction[], monthKey: string): MonthSummary {
  const current = transactionsOfMonth(transactions, monthKey);
  const previousKey = addMonthsToKey(monthKey, -1);
  const totals = totalsOf(current);
  const previous = totalsOf(transactionsOfMonth(transactions, previousKey));

  const delta = (now: number, before: number) =>
    before === 0 ? (now === 0 ? 0 : 100) : round2(((now - before) / Math.abs(before)) * 100);

  return {
    ...totals,
    balance: balanceThrough(transactions, monthKey),
    previous,
    incomeDelta: delta(totals.income, previous.income),
    expenseDelta: delta(totals.expense, previous.expense),
    savingsDelta: delta(totals.savings, previous.savings),
    expenseRate: totals.income > 0 ? round2((totals.expense / totals.income) * 100) : 0,
    savingsRate: totals.income > 0 ? round2((totals.savings / totals.income) * 100) : 0,
    count: current.length,
  };
}

export interface CategorySlice {
  id: string;
  label: string;
  emoji: string;
  color: string;
  total: number;
  /** Percentage of the whole breakdown, 0-100. */
  share: number;
  count: number;
}

export function categoryBreakdown(transactions: Transaction[]): CategorySlice[] {
  const buckets = new Map<string, { total: number; count: number }>();
  let sum = 0;

  for (const item of transactions) {
    const bucket = buckets.get(item.category) ?? { total: 0, count: 0 };
    bucket.total += item.amount;
    bucket.count += 1;
    buckets.set(item.category, bucket);
    sum += item.amount;
  }

  return [...buckets.entries()]
    .map(([id, bucket]) => {
      const category = getCategory(id);
      return {
        id,
        label: category.label,
        emoji: category.emoji,
        color: accentHex(category.accent),
        total: round2(bucket.total),
        share: sum > 0 ? round2((bucket.total / sum) * 100) : 0,
        count: bucket.count,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Top slices plus an "Other" remainder — perfect for a distribution bar. */
export function distribution(
  transactions: Transaction[],
  limit = 5,
): { slices: CategorySlice[]; total: number } {
  const slices = categoryBreakdown(transactions);
  const total = round2(slices.reduce((sum, slice) => sum + slice.total, 0));
  if (slices.length <= limit) return { slices, total };

  const head = slices.slice(0, limit);
  const tail = slices.slice(limit);
  const tailTotal = round2(tail.reduce((sum, slice) => sum + slice.total, 0));
  head.push({
    id: "__other",
    label: "Other",
    emoji: "✨",
    color: accentHex("gray"),
    total: tailTotal,
    share: total > 0 ? round2((tailTotal / total) * 100) : 0,
    count: tail.reduce((sum, slice) => sum + slice.count, 0),
  });
  return { slices: head, total };
}

export interface TrendPoint extends Totals {
  monthKey: string;
  net: number;
}

export function monthlyTrend(transactions: Transaction[], months: number): TrendPoint[] {
  const now = new Date();
  const latestKey = monthKeyOf(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const points: TrendPoint[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const key = addMonthsToKey(latestKey, -offset);
    const totals = totalsOf(transactionsOfMonth(transactions, key));
    points.push({ monthKey: key, ...totals, net: totals.savings });
  }
  return points;
}

export interface SavingsPoint {
  monthKey: string;
  saved: number;
  cumulative: number;
}

export function savingsTrend(transactions: Transaction[], months: number): SavingsPoint[] {
  let cumulative = 0;
  return monthlyTrend(transactions, months).map((point) => {
    cumulative = round2(cumulative + point.savings);
    return { monthKey: point.monthKey, saved: point.savings, cumulative };
  });
}

export interface BudgetRow {
  budget: Budget;
  label: string;
  emoji: string;
  color: string;
  spent: number;
  remaining: number;
  /** Can exceed 100 when overspent. */
  percent: number;
  over: boolean;
}

export function budgetRows(budgets: Budget[], transactions: Transaction[], monthKey: string): BudgetRow[] {
  const monthly = transactionsOfMonth(transactions, monthKey).filter((item) => item.type === "expense");
  const totals = totalsOf(monthly);

  return budgets
    .map((budget) => {
      const isOverall = budget.category === "overall";
      const spent = round2(
        isOverall
          ? totals.expense
          : monthly.filter((item) => item.category === budget.category).reduce((sum, item) => sum + item.amount, 0),
      );
      const category = getCategory(budget.category);
      return {
        budget,
        label: isOverall ? "Monthly budget" : category.label,
        emoji: isOverall ? "💰" : category.emoji,
        color: isOverall ? accentHex("purple") : accentHex(category.accent),
        spent,
        remaining: round2(budget.amount - spent),
        percent: budget.amount > 0 ? round2((spent / budget.amount) * 100) : 0,
        over: spent > budget.amount,
      };
    })
    .sort((a, b) => (a.budget.category === "overall" ? -1 : b.budget.category === "overall" ? 1 : b.percent - a.percent));
}

export interface DateGroup {
  key: string;
  label: string;
  items: Transaction[];
}

/** Groups transactions by day, newest first, keeping insertion order. */
export function groupByDate(
  transactions: Transaction[],
  labelFor: (iso: string) => string,
): DateGroup[] {
  const groups: DateGroup[] = [];
  const index = new Map<string, DateGroup>();

  for (const item of transactions) {
    let group = index.get(item.date);
    if (!group) {
      group = { key: item.date, label: labelFor(item.date), items: [] };
      index.set(item.date, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export interface TransactionQuery {
  search: string;
  type: "all" | "income" | "expense";
  categories: string[];
  monthKey?: string;
}

export function filterTransactions(transactions: Transaction[], query: TransactionQuery): Transaction[] {
  const search = query.search.trim().toLowerCase();

  return transactions.filter((item) => {
    if (query.monthKey && monthKeyOf(item.date) !== query.monthKey) return false;
    if (query.type !== "all" && item.type !== query.type) return false;
    if (query.categories.length > 0 && !query.categories.includes(item.category)) return false;
    if (search) {
      const haystack = `${item.note} ${getCategory(item.category).label} ${item.amount} ${item.paymentMethod}`;
      if (!haystack.toLowerCase().includes(search)) return false;
    }
    return true;
  });
}

export function sortNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/** Distinct month keys present in the data, newest first. */
export function availableMonths(transactions: Transaction[]): string[] {
  const keys = new Set(transactions.map((item) => monthKeyOf(item.date)));
  const now = new Date();
  keys.add(monthKeyOf(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`));
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}
