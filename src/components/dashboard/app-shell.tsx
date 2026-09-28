"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { DataProvider } from "@/providers/data-provider";
import { SiteHeader } from "@/components/app/site-header";
import { DashboardSkeleton } from "@/components/app/state-views";
import { Wordmark } from "@/components/app/site-logo";

/**
 * Auth guard + persistent chrome for every screen inside the app.
 * Data loading states live in the pages so each view owns its skeleton.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuth();
  const router = useRouter();

  // Sessions resolve asynchronously, so "anonymous" is only trustworthy once
  // Supabase has reported back; "loading" keeps the skeleton on screen.
  useEffect(() => {
    if (status === "anonymous") router.replace("/signin");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pt-24 sm:px-6">
        <Wordmark />
        <div className="mt-10">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <DataProvider userId={session?.id ?? "anonymous"}>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
        <footer className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>Spendly — a calm place to track money.</p>
            <p>© {new Date().getFullYear()} Spendly · Secured by Supabase.</p>
          </div>
        </footer>
      </div>
    </DataProvider>
  );
}
