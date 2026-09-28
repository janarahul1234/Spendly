/**
 * Savings goal — a named target amount with a deadline and accent color.
 * Mirrors the `goals` table in `supabase/schema.sql`.
 */

export type GoalColor = "green" | "purple" | "yellow" | "red" | "blue";

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

/** Draft used by the create/edit dialog before an id exists. */
export type GoalDraft = Omit<Goal, "id" | "createdAt">;
