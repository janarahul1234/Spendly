/**
 * Per-user preferences. Mirrors the `profiles` table in `supabase/schema.sql`.
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "JPY" | "SGD";

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
