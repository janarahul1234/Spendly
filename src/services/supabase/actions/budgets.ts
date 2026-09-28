import type { Budget } from "@/services/supabase/types/budget";
import { requireClient, run, type Row } from "./helpers";

/**
 * `budgets` table: row mapping and queries.
 */

export const budgetFromRow = (row: Row): Budget => ({
  id: String(row.id),
  category: String(row.category ?? "overall"),
  amount: Number(row.amount ?? 0),
});

export const budgetToRow = (userId: string, item: Budget): Row => ({
  id: item.id,
  user_id: userId,
  category: item.category,
  amount: item.amount,
});

export async function listBudgets(userId: string): Promise<Budget[]> {
  const { data } = await run(
    requireClient().from("budgets").select("*").eq("user_id", userId).order("category", { ascending: true }),
    "Could not load budgets",
  );
  return (data ?? []).map(budgetFromRow);
}

export async function saveBudget(userId: string, item: Budget): Promise<void> {
  await run(
    requireClient().from("budgets").upsert(budgetToRow(userId, item)),
    "Could not save budget",
  );
}

/** Batched upsert of pre-mapped rows — one round-trip for seeding. */
export async function saveBudgetRows(rows: Row[]): Promise<void> {
  await run(
    requireClient().from("budgets").upsert(rows),
    "Could not seed budgets",
  );
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  await run(
    requireClient().from("budgets").delete().eq("user_id", userId).eq("id", id),
    "Could not delete budget",
  );
}

/** Bulk delete used by `clear`; builder returned unevaluated (see transactions). */
export function deleteAllBudgets(userId: string) {
  return requireClient().from("budgets").delete().eq("user_id", userId);
}
