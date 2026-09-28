import type { Goal } from "@/services/supabase/types/goal";
import { requireClient, run, type Row } from "./helpers";

/**
 * `goals` table: row mapping and queries.
 */

export const goalFromRow = (row: Row): Goal => ({
  id: String(row.id),
  name: String(row.name ?? "Untitled goal"),
  targetAmount: Number(row.target_amount ?? 0),
  savedAmount: Number(row.saved_amount ?? 0),
  targetDate: String(row.target_date ?? "").slice(0, 10),
  color: (row.color ?? "green") as Goal["color"],
  note: String(row.note ?? ""),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

export const goalToRow = (userId: string, item: Goal): Row => ({
  id: item.id,
  user_id: userId,
  name: item.name,
  target_amount: item.targetAmount,
  saved_amount: item.savedAmount,
  target_date: item.targetDate || null,
  color: item.color,
  note: item.note,
  created_at: item.createdAt,
});

export async function listGoals(userId: string): Promise<Goal[]> {
  const { data } = await run(
    requireClient().from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    "Could not load goals",
  );
  return (data ?? []).map(goalFromRow);
}

export async function saveGoal(userId: string, item: Goal): Promise<void> {
  await run(
    requireClient().from("goals").upsert(goalToRow(userId, item)),
    "Could not save goal",
  );
}

/** Batched upsert of pre-mapped rows — one round-trip for seeding. */
export async function saveGoalRows(rows: Row[]): Promise<void> {
  await run(
    requireClient().from("goals").upsert(rows),
    "Could not seed goals",
  );
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  await run(
    requireClient().from("goals").delete().eq("user_id", userId).eq("id", id),
    "Could not delete goal",
  );
}

/** Bulk delete used by `clear`; builder returned unevaluated (see transactions). */
export function deleteAllGoals(userId: string) {
  return requireClient().from("goals").delete().eq("user_id", userId);
}
