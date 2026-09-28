import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = {
  // Re-declaring the template here is what lets nested segments inherit
  // "Reports · Spendly"; a plain string would opt the subtree out of it.
  title: { default: "Overview", template: "%s · Spendly" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
