"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/supabase/contexts/auth-provider";
import { DataProvider } from "@/services/supabase/contexts/data-provider";
import { SiteHeader } from "@/components/dashboard/site-header";
import { DashboardSkeleton } from "@/components/dashboard/state-views";
import { Wordmark } from "@/components/dashboard/site-logo";

/**
 * Auth guard + persistent chrome for every screen inside the app.
 * Data loading states live in the pages so each view owns its skeleton.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, session, googleEnabled } = useAuth();
  const router = useRouter();

  // Sessions resolve asynchronously, so "anonymous" is only trustworthy once
  // Supabase has reported back; "loading" keeps the skeleton on screen.
  // When Supabase isn't configured there is no way to authenticate, so staying
  // put avoids a bounce loop between this guard and the /signin page.
  useEffect(() => {
    if (googleEnabled && status === "anonymous") router.replace("/signin");
  }, [googleEnabled, status, router]);

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
