import type { LucideIcon } from "lucide-react";
import { ChartColumn, House, LayoutDashboard, PiggyBank, Target, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/** Primary navigation, shared by the desktop header and the mobile sheet. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House, description: "Monthly summary" },
  { href: "/transactions", label: "Transactions", icon: LayoutDashboard, description: "All income & expenses" },
  { href: "/goals", label: "Goals", icon: Target, description: "Save for what matters" },
  { href: "/finance", label: "Finance", icon: PiggyBank, description: "Budgets & remaining" },
  { href: "/reports", label: "Reports", icon: ChartColumn, description: "Trends & breakdowns" },
  { href: "/profile", label: "Profile", icon: User, description: "Account & settings" },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
