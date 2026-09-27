import { getSupabase } from "@/lib/supabase/client";
import { createId } from "@/lib/id";
import { createSampleData, DEFAULT_SETTINGS } from "@/lib/sample-data";
import type {
  AppData,
  AppNotification,
  Budget,
  Goal,
  Settings,
  Transaction,
} from "@/lib/types";

/**
 * Persistence contract for the whole app, backed by Postgres through Supabase
 * (see `supabase/schema.sql`). Every method is async so callers never block
 * the UI, and RLS guarantees each user only touches their own rows.
 */
export interface DataRepo {
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

function withIds(data: AppData): AppData {
  return {
    transactions: data.transactions.map((item) => ({ ...item, id: item.id || createId("tx") })),
    goals: data.goals.map((item) => ({ ...item, id: item.id || createId("goal") })),
    budgets: data.budgets.map((item) => ({ ...item, id: item.id || createId("bud") })),
    notifications: data.notifications.map((item) => ({ ...item, id: item.id || createId("ntf") })),
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
  };
}

/* ------------------------------------------------------------------ */
/* Row mapping (camelCase ↔ snake_case)                                */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

const txFromRow = (row: Row): Transaction => ({
  id: String(row.id),
  category: String(row.category ?? "other"),
  type: row.type === "income" ? "income" : "expense",
  amount: Number(row.amount ?? 0),
  date: String(row.date ?? "").slice(0, 10),
  paymentMethod: (row.payment_method ?? "debit_card") as Transaction["paymentMethod"],
  note: String(row.note ?? ""),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

const goalFromRow = (row: Row): Goal => ({
  id: String(row.id),
  name: String(row.name ?? "Untitled goal"),
  targetAmount: Number(row.target_amount ?? 0),
  savedAmount: Number(row.saved_amount ?? 0),
  targetDate: String(row.target_date ?? "").slice(0, 10),
  color: (row.color ?? "green") as Goal["color"],
  note: String(row.note ?? ""),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

const budgetFromRow = (row: Row): Budget => ({
  id: String(row.id),
  category: String(row.category ?? "overall"),
  amount: Number(row.amount ?? 0),
});

const notificationFromRow = (row: Row): AppNotification => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  body: String(row.body ?? ""),
  tone: (row.tone ?? "info") as AppNotification["tone"],
  read: Boolean(row.read),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

const txToRow = (userId: string, item: Transaction): Row => ({
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

const goalToRow = (userId: string, item: Goal): Row => ({
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

const budgetToRow = (userId: string, item: Budget): Row => ({
  id: item.id,
  user_id: userId,
  category: item.category,
  amount: item.amount,
});

const notificationToRow = (userId: string, item: AppNotification): Row => ({
  id: item.id,
  user_id: userId,
  title: item.title,
  body: item.body,
  tone: item.tone,
  read: item.read,
  created_at: item.createdAt,
});

function fail(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context} — ${error.message}`);
}

/** Throws a descriptive error when the app runs without Supabase env vars. */
function requireClient() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured — add your project keys to .env.local.");
  return client;
}

export const repo: DataRepo = {
  async load(userId: string): Promise<AppData> {
    const client = requireClient();

    const [transactions, goals, budgets, notifications, profile] = await Promise.all([
      client.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      client.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      client.from("budgets").select("*").eq("user_id", userId).order("category", { ascending: true }),
      client.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
      client.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);

    fail(transactions.error, "Could not load transactions");
    fail(goals.error, "Could not load goals");
    fail(budgets.error, "Could not load budgets");
    fail(notifications.error, "Could not load notifications");

    const profileData = (profile.data ?? {}) as Row;
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      displayName: String(profileData.display_name ?? DEFAULT_SETTINGS.displayName),
      email: String(profileData.email ?? DEFAULT_SETTINGS.email),
      currency: (profileData.currency ?? DEFAULT_SETTINGS.currency) as Settings["currency"],
      locale: String(profileData.locale ?? DEFAULT_SETTINGS.locale),
      weekStartsOn: (profileData.week_starts_on ?? DEFAULT_SETTINGS.weekStartsOn) as Settings["weekStartsOn"],
      reminders: { ...DEFAULT_SETTINGS.reminders, ...(profileData.reminders as object ?? {}) },
    };

    return {
      transactions: (transactions.data ?? []).map(txFromRow),
      goals: (goals.data ?? []).map(goalFromRow),
      budgets: (budgets.data ?? []).map(budgetFromRow),
      notifications: (notifications.data ?? []).map(notificationFromRow),
      settings,
    };
  },

  async saveTransaction(userId, item) {
    const { error } = await requireClient().from("transactions").upsert(txToRow(userId, item));
    fail(error, "Could not save transaction");
  },

  async deleteTransaction(userId, id) {
    const { error } = await requireClient().from("transactions").delete().eq("user_id", userId).eq("id", id);
    fail(error, "Could not delete transaction");
  },

  async saveGoal(userId, item) {
    const { error } = await requireClient().from("goals").upsert(goalToRow(userId, item));
    fail(error, "Could not save goal");
  },

  async deleteGoal(userId, id) {
    const { error } = await requireClient().from("goals").delete().eq("user_id", userId).eq("id", id);
    fail(error, "Could not delete goal");
  },

  async saveBudget(userId, item) {
    const { error } = await requireClient().from("budgets").upsert(budgetToRow(userId, item));
    fail(error, "Could not save budget");
  },

  async deleteBudget(userId, id) {
    const { error } = await requireClient().from("budgets").delete().eq("user_id", userId).eq("id", id);
    fail(error, "Could not delete budget");
  },

  async saveNotification(userId, item) {
    const { error } = await requireClient().from("notifications").upsert(notificationToRow(userId, item));
    fail(error, "Could not save notification");
  },

  async deleteNotification(userId, id) {
    const { error } = await requireClient().from("notifications").delete().eq("user_id", userId).eq("id", id);
    fail(error, "Could not delete notification");
  },

  async saveSettings(userId, settings) {
    const { error } = await requireClient().from("profiles").upsert({
      id: userId,
      display_name: settings.displayName,
      email: settings.email,
      currency: settings.currency,
      locale: settings.locale,
      week_starts_on: settings.weekStartsOn,
      reminders: settings.reminders,
    });
    fail(error, "Could not save settings");
  },

  async seedSampleData(userId) {
    const client = requireClient();
    await this.clear(userId);
    const data = withIds(createSampleData());
    // One batched upsert per table instead of hundreds of round-trips.
    const [transactions, goals, budgets, notifications] = await Promise.all([
      client.from("transactions").upsert(data.transactions.map((item) => txToRow(userId, item))),
      client.from("goals").upsert(data.goals.map((item) => goalToRow(userId, item))),
      client.from("budgets").upsert(data.budgets.map((item) => budgetToRow(userId, item))),
      client.from("notifications").upsert(data.notifications.map((item) => notificationToRow(userId, item))),
    ]);
    fail(transactions.error, "Could not seed transactions");
    fail(goals.error, "Could not seed goals");
    fail(budgets.error, "Could not seed budgets");
    fail(notifications.error, "Could not seed notifications");
    return data;
  },

  async clear(userId) {
    const client = getSupabase();
    if (!client) return;
    await Promise.all([
      client.from("transactions").delete().eq("user_id", userId),
      client.from("goals").delete().eq("user_id", userId),
      client.from("budgets").delete().eq("user_id", userId),
      client.from("notifications").delete().eq("user_id", userId),
    ]);
  },
};

/** Returns the Supabase-backed repo; throws early if env vars are missing. */
export function getRepo(): DataRepo {
  return repo;
}
