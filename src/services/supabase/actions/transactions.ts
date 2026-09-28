import type { Transaction } from "@/services/supabase/types/transaction";
import { requireClient, run, type Row } from "./helpers";

/**
 * `transactions` table: row mapping and queries. RLS guarantees each user
 * only touches their own rows, so every call filters by `user_id` anyway.
 */

export const txFromRow = (row: Row): Transaction => ({
  id: String(row.id),
  category: String(row.category ?? "other"),
  type: row.type === "income" ? "income" : "expense",
  amount: Number(row.amount ?? 0),
  date: String(row.date ?? "").slice(0, 10),
  paymentMethod: (row.payment_method ?? "debit_card") as Transaction["paymentMethod"],
  note: String(row.note ?? ""),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

export const txToRow = (userId: string, item: Transaction): Row => ({
  id: item.id,
  user_id: userId,
  category: item.category,
  type: item.type,
  amount: item.amount,
  date: item.date,
  payment_method: item.paymentMethod,
  note: item.note,
  created_at: item.createdAt,
});

export async function listTransactions(userId: string): Promise<Transaction[]> {
  const { data } = await run(
    requireClient().from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
    "Could not load transactions",
  );
  return (data ?? []).map(txFromRow);
}

export async function saveTransaction(userId: string, item: Transaction): Promise<void> {
  await run(
    requireClient().from("transactions").upsert(txToRow(userId, item)),
    "Could not save transaction",
  );
}

/** Batched upsert of pre-mapped rows — one round-trip for seeding. */
export async function saveTransactionRows(rows: Row[]): Promise<void> {
  await run(
    requireClient().from("transactions").upsert(rows),
    "Could not seed transactions",
  );
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  await run(
    requireClient().from("transactions").delete().eq("user_id", userId).eq("id", id),
    "Could not delete transaction",
  );
}

/**
 * Bulk delete used by `clear`/`seed`. Mirrors the original `clear` semantics:
 * the builder is returned unevaluated so the caller decides how to await it.
 */
export function deleteAllTransactions(userId: string) {
  return requireClient().from("transactions").delete().eq("user_id", userId);
}
