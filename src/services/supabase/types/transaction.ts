/**
 * Money movement: what came in, what went out.
 * Mirrors the `transactions` table in `supabase/schema.sql`.
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
  /** Stable category id, see `services/supabase/data/categories.ts`. */
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

/** Draft used by the create/edit dialog before an id exists. */
export type TransactionDraft = Omit<Transaction, "id" | "createdAt">;
