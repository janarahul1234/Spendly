/**
 * Core domain types for the expense tracker.
 * The shape mirrors the Supabase tables in `supabase/schema.sql`.
 */

export type TransactionType = "income" | "expense";

export type PaymentMethod =
  | "debit_card"
  | "credit_card"
  | "bank_transfer"
  | "cash"
  | "paypal"
  | "upi";

export interface Transaction {
  id: string;
  /** Stable category id, see `lib/categories.ts`. */
  category: string;
  type: TransactionType;
  /** Always stored as a positive amount; `type` decides the sign. */
  amount: number;
  /** ISO date, `yyyy-MM-dd`. */
  date: string;
  paymentMethod: PaymentMethod;
  note: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  /** ISO date, `yyyy-MM-dd`. Empty string when the goal is open-ended. */
  targetDate: string;
  color: GoalColor;
  note: string;
  createdAt: string;
}

export type GoalColor = "green" | "purple" | "yellow" | "red" | "blue";

/** Monthly money set aside for a category. `overall` caps total spend. */
export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  tone: "info" | "success" | "warning" | "danger";
  read: boolean;
  createdAt: string;
}

export interface Settings {
  displayName: string;
  email: string;
  currency: CurrencyCode;
  locale: string;
  /** Day of month the budget period starts (1-28). */
  weekStartsOn: 0 | 1;
  reminders: {
    dailyLogging: boolean;
    budgetAlerts: boolean;
    goalUpdates: boolean;
  };
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "JPY" | "SGD";

/** Draft used by the create/edit dialogs before an id exists. */
export type TransactionDraft = Omit<Transaction, "id" | "createdAt">;
export type GoalDraft = Omit<Goal, "id" | "createdAt">;

export interface AppData {
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  notifications: AppNotification[];
  settings: Settings;
}
