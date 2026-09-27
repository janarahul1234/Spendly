import type { GoalColor } from "@/lib/types";

export const GOAL_COLORS: { id: GoalColor; label: string }[] = [
  { id: "green", label: "Green" },
  { id: "purple", label: "Purple" },
  { id: "yellow", label: "Yellow" },
  { id: "red", label: "Red" },
  { id: "blue", label: "Blue" },
];

/** Static class maps so Tailwind can see every utility at build time. */
export const GOAL_COLOR_CLASS: Record<GoalColor, { bar: string; text: string; soft: string; hex: string }> = {
  green: { bar: "bg-income", text: "text-income", soft: "bg-income/10", hex: "#067d4d" },
  purple: { bar: "bg-goal", text: "text-goal", soft: "bg-goal/10", hex: "#5d4dbe" },
  yellow: { bar: "bg-savings", text: "text-savings", soft: "bg-savings/15", hex: "#986603" },
  red: { bar: "bg-expense", text: "text-expense", soft: "bg-expense/10", hex: "#c52b30" },
  blue: { bar: "bg-chart-5", text: "text-chart-5", soft: "bg-chart-5/10", hex: "#006aa0" },
};

export function goalColorClasses(color: GoalColor) {
  return GOAL_COLOR_CLASS[color] ?? GOAL_COLOR_CLASS.green;
}
