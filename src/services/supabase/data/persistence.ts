import { createId } from "@/services/supabase/utils/id";
import { createSampleData, DEFAULT_SETTINGS } from "@/services/supabase/data/sample";
import { maybeClient, requireClient, runQuietly } from "@/services/supabase/actions/helpers";
import {
  deleteAllTransactions,
  deleteTransaction,
  listTransactions,
  saveTransaction,
  saveTransactionRows,
  txToRow,
} from "@/services/supabase/actions/transactions";
import {
  deleteAllGoals,
  deleteGoal,
  listGoals,
  saveGoal,
  saveGoalRows,
  goalToRow,
} from "@/services/supabase/actions/goals";
import {
  deleteAllBudgets,
  deleteBudget,
  listBudgets,
  saveBudget,
  saveBudgetRows,
  budgetToRow,
} from "@/services/supabase/actions/budgets";
import {
  deleteAllNotifications,
  deleteNotification,
  listNotifications,
  saveNotification,
  saveNotificationRows,
  notificationToRow,
} from "@/services/supabase/actions/notifications";
import { fetchSettings, saveSettings } from "@/services/supabase/actions/settings";
import type { AppData } from "@/services/supabase/types/app-data";
import type { AppNotification } from "@/services/supabase/types/notification";
import type { Budget } from "@/services/supabase/types/budget";
import type { Goal } from "@/services/supabase/types/goal";
import type { Settings } from "@/services/supabase/types/settings";
import type { Transaction } from "@/services/supabase/types/transaction";

/**
 * Persistence contract for the whole app, backed by Postgres through Supabase
 * (see `supabase/schema.sql`). Every method is async so callers never block
 * the UI, and RLS guarantees each user only touches their own rows.
 *
 * This module is a thin facade: the per-table queries and row mapping live
 * in `services/supabase/actions/*`; only cross-table orchestration
 * (aggregate load, batched seeding, bulk clear) is done here.
 */
export interface DataPersistence {
  load(userId: string): Promise<AppData>;
  saveTransaction(userId: string, item: Transaction): Promise<void>;
  deleteTransaction(userId: string, id: string): Promise<void>;
  saveGoal(userId: string, item: Goal): Promise<void>;
  deleteGoal(userId: string, id: string): Promise<void>;
  saveBudget(userId: string, item: Budget): Promise<void>;
  deleteBudget(userId: string, id: string): Promise<void>;
  saveNotification(userId: string, item: AppNotification): Promise<void>;
  deleteNotification(userId: string, id: string): Promise<void>;
  saveSettings(userId: string, settings: Settings): Promise<void>;
  seedSampleData(userId: string): Promise<AppData>;
  clear(userId: string): Promise<void>;
}

/** Fill in any missing ids so a freshly generated sample dataset is storable. */
function withIds(data: AppData): AppData {
  return {
    transactions: data.transactions.map((item) => ({ ...item, id: item.id || createId("tx") })),
    goals: data.goals.map((item) => ({ ...item, id: item.id || createId("goal") })),
    budgets: data.budgets.map((item) => ({ ...item, id: item.id || createId("bud") })),
    notifications: data.notifications.map((item) => ({ ...item, id: item.id || createId("ntf") })),
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
  };
}

export const dataPersistence: DataPersistence = {
  async load(userId: string): Promise<AppData> {
    const [transactions, goals, budgets, notifications, settings] = await Promise.all([
      listTransactions(userId),
      listGoals(userId),
      listBudgets(userId),
      listNotifications(userId),
      fetchSettings(userId),
    ]);

    return { transactions, goals, budgets, notifications, settings };
  },

  saveTransaction: saveTransaction,
  deleteTransaction: deleteTransaction,
  saveGoal: saveGoal,
  deleteGoal: deleteGoal,
  saveBudget: saveBudget,
  deleteBudget: deleteBudget,
  saveNotification: saveNotification,
  deleteNotification: deleteNotification,
  saveSettings: saveSettings,

  async seedSampleData(userId) {
    requireClient(); // fail fast when Supabase is not configured
    // Wipe existing rows best-effort, exactly as `clear` does.
    await Promise.all([
      runQuietly(deleteAllTransactions(userId)),
      runQuietly(deleteAllGoals(userId)),
      runQuietly(deleteAllBudgets(userId)),
      runQuietly(deleteAllNotifications(userId)),
    ]);
    const data = withIds(createSampleData());
    // One batched upsert per table instead of hundreds of round-trips.
    await Promise.all([
      saveTransactionRows(data.transactions.map((item) => txToRow(userId, item))),
      saveGoalRows(data.goals.map((item) => goalToRow(userId, item))),
      saveBudgetRows(data.budgets.map((item) => budgetToRow(userId, item))),
      saveNotificationRows(data.notifications.map((item) => notificationToRow(userId, item))),
    ]);
    return data;
  },

  async clear(userId) {
    const client = maybeClient();
    if (!client) return;
    // Fires each delete without awaiting errors, matching the original
    // best-effort semantics — a partially cleared table must not block reset.
    await Promise.all([
      runQuietly(deleteAllTransactions(userId)),
      runQuietly(deleteAllGoals(userId)),
      runQuietly(deleteAllBudgets(userId)),
      runQuietly(deleteAllNotifications(userId)),
    ]);
  },
};

/** Returns the Supabase-backed persistence facade; throws early if env vars are missing. */
export function getPersistence(): DataPersistence {
  return dataPersistence;
}
