/**
 * In-app alert shown in the notification bell. Mirrors the `notifications`
 * table in `supabase/schema.sql`. Some rows are generated on load from the
 * user's data (see `services/supabase/data/reminders.ts`).
 */

/** Visual severity of a notification. */
export type NotificationTone = "info" | "success" | "warning" | "danger";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  tone: NotificationTone;
  read: boolean;
  createdAt: string;
}
