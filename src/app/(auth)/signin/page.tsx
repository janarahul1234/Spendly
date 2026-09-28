"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Loader2, ShieldCheck, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wordmark } from "@/components/dashboard/site-logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useAuth } from "@/services/supabase/contexts/auth-provider";

const HIGHLIGHTS = [
  { icon: BarChart3, title: "See where it goes", text: "A distribution bar and reports that stay readable." },
  { icon: Target, title: "Save on purpose", text: "Goals with progress, deadlines and one-tap top-ups." },
  { icon: ShieldCheck, title: "Your data, your rules", text: "Export or wipe everything at any time." },
];

/**
 * Unified Sign In & Sign Up entry point. Google OAuth doubles as
 * registration: first-time users get an account (and a profile row via the
 * schema trigger) automatically, returning users just sign back in.
 */
export default function AuthPage() {
  const { status, signInWithGoogle, googleEnabled } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (cause) {
      toast.error("Could not start Google sign-in", {
        description: cause instanceof Error ? cause.message : "Check your Supabase OAuth settings.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark />
        <ThemeToggle />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
              One account · every device
            </span>
            <h1 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              Track spending without the noise.
            </h1>
            <p className="max-w-md text-sm text-muted-foreground sm:text-base">
              Log income and expenses in seconds, watch your savings goals fill up, and keep a calm overview of every
              month.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full justify-self-center">
          <Card className="w-full max-w-md mx-auto gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">Sign in or sign up</h2>
              <p className="text-sm text-muted-foreground">
                Continue with Google — new accounts are created automatically, existing ones just open back up.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={handleGoogle} disabled={busy || !googleEnabled}>
                {busy ? <Loader2 className="animate-spin" /> : <GoogleMark />}
                Continue with Google
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              We only read your name, email and profile picture.
            </p>

            {!googleEnabled && (
              <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                Google sign-in needs a Supabase project. Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                and <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
                <code className="font-mono">.env.local</code>, then restart the dev server.
              </p>
            )}
          </Card>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Spendly · A calm place to track money.
      </footer>
    </div>
  );
}

/** Minimal inline Google glyph — avoids shipping an extra asset. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.8h5.35c-.5 2.5-2.6 3.9-5.35 3.9a6.8 6.8 0 1 1 0-13.6c1.7 0 3.2.6 4.35 1.75l2.7-2.7A10.4 10.4 0 0 0 12 1.6a10.4 10.4 0 1 0 0 20.8c6 0 9.95-4.2 9.95-10.15 0-.45-.05-.85-.6-1.15Z"
      />
    </svg>
  );
}
