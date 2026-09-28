"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createId } from "@/services/supabase/utils/id";
import { getPersistence, type DataPersistence } from "@/services/supabase/data/persistence";
import { round2 } from "@/services/supabase/utils/format";
import { DEFAULT_SETTINGS } from "@/services/supabase/data/sample";
import { buildReminders } from "@/services/supabase/data/reminders";
import { getCategory } from "@/services/supabase/data/categories";
import type { FormatOptions } from "@/services/supabase/utils/format";
import type { AppData } from "@/services/supabase/types/app-data";
import type { AppNotification } from "@/services/supabase/types/notification";
import type { Goal, GoalDraft } from "@/services/supabase/types/goal";
import type { Settings } from "@/services/supabase/types/settings";
import type { Transaction, TransactionDraft } from "@/services/supabase/types/transaction";

type Status = "loading" | "ready" | "error";

interface DataValue {
  status: Status;
  error: string | null;
  transactions: Transaction[];
  goals: Goal[];
  budgets: AppData["budgets"];
  notifications: AppNotification[];
  settings: Settings;
  format: FormatOptions;
  reload: () => void;
  addTransaction: (draft: TransactionDraft) => Promise<void>;
  updateTransaction: (id: string, draft: TransactionDraft) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (draft: GoalDraft) => Promise<void>;
  updateGoal: (id: string, draft: GoalDraft) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  setBudget: (category: string, amount: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  loadSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const EMPTY: AppData = {
  transactions: [],
  goals: [],
  budgets: [],
  notifications: [],
  settings: DEFAULT_SETTINGS,
};

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const persistence = getPersistence();

  const [data, setData] = useState<AppData>(EMPTY);
  /** Which user id the loaded data belongs to; drives the loading state. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    persistence
      .load(userId)
      .then((next) => {
        if (cancelled) return;
        setData(withReminders(next, persistence, userId));
        setLoadedFor(userId);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Something went wrong while loading your data.");
        setLoadedFor(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [persistence, userId, nonce]);

  const status: Status = loadedFor !== userId ? "loading" : error ? "error" : "ready";

  const reportFailure = useCallback((cause: unknown, fallback: string) => {
    const message = cause instanceof Error ? cause.message : fallback;
    toast.error(fallback, { description: message });
  }, []);

  /* ---------------------------- transactions ---------------------------- */

  const addTransaction = useCallback(
    async (draft: TransactionDraft) => {
      const item: Transaction = { ...draft, id: createId("tx"), createdAt: new Date().toISOString() };
      const alert = buildBudgetAlert(data, item);
      setData((prev) => ({
        ...prev,
        transactions: [item, ...prev.transactions],
        notifications: alert ? [alert, ...prev.notifications] : prev.notifications,
      }));
      try {
        await persistence.saveTransaction(userId, item);
        if (alert) await persistence.saveNotification(userId, alert).catch(() => undefined);
      } catch (cause) {
        setData((prev) => ({ ...prev, transactions: prev.transactions.filter((entry) => entry.id !== item.id) }));
        reportFailure(cause, "Could not save transaction");
      }
    },
    [data, persistence, userId, reportFailure],
  );

  const updateTransaction = useCallback(
    async (id: string, draft: TransactionDraft) => {
      const previous = data.transactions.find((entry) => entry.id === id);
      if (!previous) return;
      const next: Transaction = { ...previous, ...draft };
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((entry) => (entry.id === id ? next : entry)),
      }));
      try {
        await persistence.saveTransaction(userId, next);
      } catch (cause) {
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.map((entry) => (entry.id === id ? previous : entry)),
        }));
        reportFailure(cause, "Could not update transaction");
      }
    },
    [data.transactions, persistence, userId, reportFailure],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const previous = data.transactions.find((entry) => entry.id === id);
      if (!previous) return;
      setData((prev) => ({ ...prev, transactions: prev.transactions.filter((entry) => entry.id !== id) }));
      try {
        await persistence.deleteTransaction(userId, id);
      } catch (cause) {
        setData((prev) => ({ ...prev, transactions: [previous, ...prev.transactions] }));
        reportFailure(cause, "Could not delete transaction");
      }
    },
    [data.transactions, persistence, userId, reportFailure],
  );

  /* -------------------------------- goals ------------------------------- */

  const saveGoal = useCallback(
    async (goal: Goal) => {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.some((entry) => entry.id === goal.id)
          ? prev.goals.map((entry) => (entry.id === goal.id ? goal : entry))
          : [...prev.goals, goal],
      }));
      try {
        await persistence.saveGoal(userId, goal);
      } catch (cause) {
        reportFailure(cause, "Could not save goal");
      }
    },
    [persistence, userId, reportFailure],
  );

  const addGoal = useCallback(
    async (draft: GoalDraft) => {
      await saveGoal({ ...draft, id: createId("goal"), createdAt: new Date().toISOString() });
    },
    [saveGoal],
  );

  const updateGoal = useCallback(
    async (id: string, draft: GoalDraft) => {
      const existing = data.goals.find((entry) => entry.id === id);
      if (!existing) return;
      await saveGoal({ ...existing, ...draft });
    },
    [data.goals, saveGoal],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, goals: prev.goals.filter((entry) => entry.id !== id) }));
      try {
        await persistence.deleteGoal(userId, id);
      } catch (cause) {
        reportFailure(cause, "Could not delete goal");
      }
    },
    [persistence, userId, reportFailure],
  );

  const contributeToGoal = useCallback(
    async (id: string, amount: number) => {
      const goal = data.goals.find((entry) => entry.id === id);
      if (!goal) return;
      await saveGoal({ ...goal, savedAmount: Math.max(0, round2(goal.savedAmount + amount)) });
    },
    [data.goals, saveGoal],
  );

  /* ------------------------------- budgets ------------------------------ */

  const setBudget = useCallback(
    async (category: string, amount: number) => {
      const existing = data.budgets.find((entry) => entry.category === category);
      const budget = { id: existing?.id ?? createId("bud"), category, amount: round2(amount) };
      setData((prev) => ({
        ...prev,
        budgets: existing
          ? prev.budgets.map((entry) => (entry.id === existing.id ? budget : entry))
          : [...prev.budgets, budget],
      }));
      try {
        await persistence.saveBudget(userId, budget);
      } catch (cause) {
        reportFailure(cause, "Could not save budget");
      }
    },
    [data.budgets, persistence, userId, reportFailure],
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, budgets: prev.budgets.filter((entry) => entry.id !== id) }));
      try {
        await persistence.deleteBudget(userId, id);
      } catch (cause) {
        reportFailure(cause, "Could not delete budget");
      }
    },
    [persistence, userId, reportFailure],
  );

  /* ---------------------------- notifications --------------------------- */

  const patchNotification = useCallback(
    (id: string, patch: Partial<AppNotification>) => {
      const existing = data.notifications.find((entry) => entry.id === id);
      if (!existing) return;
      const next: AppNotification = { ...existing, ...patch };
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((entry) => (entry.id === id ? next : entry)),
      }));
      void persistence.saveNotification(userId, next).catch(() => undefined);
    },
    [data.notifications, persistence, userId],
  );

  const markNotificationRead = useCallback(
    (id: string, read = true) => patchNotification(id, { read }),
    [patchNotification],
  );

  const markAllNotificationsRead = useCallback(() => {
    const unread = data.notifications.filter((entry) => !entry.read);
    if (unread.length === 0) return;
    setData((prev) => ({ ...prev, notifications: prev.notifications.map((entry) => ({ ...entry, read: true })) }));
    void Promise.all(unread.map((entry) => persistence.saveNotification(userId, { ...entry, read: true }))).catch(
      () => undefined,
    );
  }, [data.notifications, persistence, userId]);

  const deleteNotification = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, notifications: prev.notifications.filter((entry) => entry.id !== id) }));
      void persistence.deleteNotification(userId, id).catch(() => undefined);
    },
    [persistence, userId],
  );

  /* ------------------------------- settings ----------------------------- */

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const settings: Settings = { ...data.settings, ...patch };
      setData((prev) => ({ ...prev, settings }));
      void persistence.saveSettings(userId, settings).catch(() => undefined);
    },
    [data.settings, persistence, userId],
  );

  /* ----------------------------- sample data ---------------------------- */

  const loadSampleData = useCallback(async () => {
    setLoadedFor(null);
    try {
      const next = await persistence.seedSampleData(userId);
      setData(next);
      setLoadedFor(userId);
      toast.success("Sample data restored");
    } catch (cause) {
      reportFailure(cause, "Could not restore sample data");
      setLoadedFor(userId);
    }
  }, [persistence, userId, reportFailure]);

  const clearAllData = useCallback(async () => {
    setLoadedFor(null);
    try {
      await persistence.clear(userId);
      const blank: AppData = { transactions: [], goals: [], budgets: [], notifications: [], settings: data.settings };
      await persistence.saveSettings(userId, data.settings).catch(() => undefined);
      setData(blank);
      setLoadedFor(userId);
      toast.success("All records cleared");
    } catch (cause) {
      reportFailure(cause, "Could not clear data");
      setLoadedFor(userId);
    }
  }, [persistence, userId, data.settings, reportFailure]);

  const reload = useCallback(() => {
    setError(null);
    setLoadedFor(null);
    setNonce((value) => value + 1);
  }, []);

  const format = useMemo<FormatOptions>(
    () => ({ currency: data.settings.currency, locale: data.settings.locale }),
    [data.settings.currency, data.settings.locale],
  );

  const value = useMemo<DataValue>(
    () => ({
      status,
      error,
      transactions: data.transactions,
      goals: data.goals,
      budgets: data.budgets,
      notifications: data.notifications,
      settings: data.settings,
      format,
      reload,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      setBudget,
      deleteBudget,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      updateSettings,
      loadSampleData,
      clearAllData,
    }),
    [
      status,
      error,
      data,
      format,
      reload,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      setBudget,
      deleteBudget,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      updateSettings,
      loadSampleData,
      clearAllData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/**
 * Builds a budget alert when an expense pushes a category past its monthly
 * limit. Pure, so the caller decides when to store it. No background jobs —
 * reminders are derived from the data on demand.
 */
function buildBudgetAlert(data: AppData, item: Transaction): AppNotification | null {
  if (item.type !== "expense") return null;

  const monthKey = item.date.slice(0, 7);
  const budget = data.budgets.find((entry) => entry.category === item.category);
  if (!budget) return null;

  const spent =
    item.amount +
    data.transactions
      .filter(
        (entry) =>
          entry.type === "expense" && entry.category === item.category && entry.date.startsWith(monthKey),
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

  if (spent <= budget.amount) return null;

  const title = `Budget alert: ${getCategory(item.category).label}`;
  const alreadyNotified = data.notifications.some(
    (entry) => entry.title === title && entry.createdAt.startsWith(monthKey),
  );
  if (alreadyNotified) return null;

  return {
    id: createId("ntf"),
    title,
    body: `You have spent ${Math.round((spent / budget.amount) * 100)}% of this month's budget.`,
    tone: spent > budget.amount * 1.15 ? "danger" : "warning",
    read: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Adds today's reminders (goal nudges, budget alerts, logging prompt) on top of
 * whatever the workspace already stores, and persists the new ones.
 */
function withReminders(loaded: AppData, persistence: DataPersistence, userId: string): AppData {
  const reminders = buildReminders(loaded);
  if (reminders.length === 0) return loaded;
  for (const reminder of reminders) {
    void persistence.saveNotification(userId, reminder).catch(() => undefined);
  }
  return { ...loaded, notifications: [...reminders, ...loaded.notifications] };
}

export function useData(): DataValue {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside <DataProvider>");
  return context;
}
