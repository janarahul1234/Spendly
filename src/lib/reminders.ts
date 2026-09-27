import { createId } from "@/lib/id";
import { budgetRows } from "@/lib/analytics";
import { currentMonthKey, daysUntil, todayISO } from "@/lib/format";
import type { AppData, AppNotification } from "@/lib/types";

/**
 * Builds the in-app reminders shown in the notification tray. Runs once after
 * data loads, respects the user's toggles, and never duplicates a reminder
 * that already exists for today.
 */
export function buildReminders(data: AppData): AppNotification[] {
  const today = todayISO();
  const monthKey = currentMonthKey();
  const seen = new Set(
    data.notifications
      // `createdAt` is a full timestamp; compare the date part only.
      .filter((item) => item.createdAt.slice(0, 10) === today)
      .map((item) => item.title),
  );

  const created: AppNotification[] = [];
  const add = (input: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    if (seen.has(input.title) || created.some((item) => item.title === input.title)) return;
    created.push({ ...input, id: createId("ntf"), read: false, createdAt: new Date().toISOString() });
  };

  const { settings, goals, budgets, transactions } = data;

  if (settings.reminders.goalUpdates) {
    for (const goal of goals) {
      const percent = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
      const days = goal.targetDate ? daysUntil(goal.targetDate) : null;

      if (percent >= 100) {
        add({ title: `Goal reached: ${goal.name}`, body: "Nice work — this goal is fully funded.", tone: "success" });
      } else if (days !== null && days < 0) {
        add({
          title: `${goal.name} is overdue`,
          body: `The target date passed with ${Math.round(percent)}% saved. Adjust the date or top up.`,
          tone: "danger",
        });
      } else if (days !== null && days <= 30 && percent < 60) {
        add({
          title: `${goal.name} needs a push`,
          body: `${Math.round(percent)}% saved with ${days} days to go.`,
          tone: "warning",
        });
      } else if (percent >= 80) {
        add({
          title: `Almost there: ${goal.name}`,
          body: `${Math.round(percent)}% of the target is already in.`,
          tone: "info",
        });
      }
    }
  }

  if (settings.reminders.budgetAlerts) {
    for (const row of budgetRows(budgets, transactions, monthKey)) {
      if (row.percent < 100) continue;
      add({
        title: `Budget alert: ${row.label}`,
        body: `You have spent ${Math.round(row.percent)}% of this month's budget.`,
        tone: row.percent > 115 ? "danger" : "warning",
      });
    }
  }

  if (settings.reminders.dailyLogging) {
    const loggedToday = transactions.some((item) => item.date === today);
    if (!loggedToday) {
      add({
        title: "Nothing logged today",
        body: "A 10-second entry keeps your reports accurate.",
        tone: "info",
      });
    }
  }

  return created.slice(0, 6);
}
