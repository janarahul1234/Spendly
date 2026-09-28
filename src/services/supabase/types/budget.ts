/**
 * Monthly spending cap for one category. Mirrors the `budgets` table
 * in `supabase/schema.sql`.
 */

export interface Budget {
  id: string;
  /** Category id, or the literal `overall` to cap total monthly spend. */
  category: string;
  amount: number;
}
