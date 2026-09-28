import type { AppNotification } from "@/services/supabase/types/notification";
import { requireClient, run, type Row } from "./helpers";

/**
 * `notifications` table: row mapping and queries. Rows are either seeded
 * informational items or derived reminders rebuilt on load (see
 * `data/reminders.ts`).
 */

/** Only the newest rows are shown in the bell. */
const NOTIFICATION_LIMIT = 40;

export const notificationFromRow = (row: Row): AppNotification => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  body: String(row.body ?? ""),
  tone: (row.tone ?? "info") as AppNotification["tone"],
  read: Boolean(row.read),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

export const notificationToRow = (userId: string, item: AppNotification): Row => ({
  id: item.id,
  user_id: userId,
  title: item.title,
  body: item.body,
  tone: item.tone,
  read: item.read,
  created_at: item.createdAt,
});

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const { data } = await run(
    requireClient()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIMIT),
    "Could not load notifications",
  );
  return (data ?? []).map(notificationFromRow);
}

export async function saveNotification(userId: string, item: AppNotification): Promise<void> {
  await run(
    requireClient().from("notifications").upsert(notificationToRow(userId, item)),
    "Could not save notification",
  );
}

/** Batched upsert of pre-mapped rows — one round-trip for seeding. */
export async function saveNotificationRows(rows: Row[]): Promise<void> {
  await run(
    requireClient().from("notifications").upsert(rows),
    "Could not seed notifications",
  );
}

export async function deleteNotification(userId: string, id: string): Promise<void> {
  await run(
    requireClient().from("notifications").delete().eq("user_id", userId).eq("id", id),
    "Could not delete notification",
  );
}

/** Bulk delete used by `clear`; builder returned unevaluated (see transactions). */
export function deleteAllNotifications(userId: string) {
  return requireClient().from("notifications").delete().eq("user_id", userId);
}
