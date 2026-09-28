"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/services/supabase/client";
import { getOAuthRedirectUrl, isLocalOrigin } from "@/services/supabase/utils/app-url";

/** How long to wait for the PKCE exchange before giving up. */
const SETTLE_MS = 8000;

/**
 * OAuth landing page. The browser Supabase client picks the `code` up from the
 * URL and exchanges it for a session; this route waits for that to land before
 * handing the user to the app, and surfaces the reason instead of bouncing
 * silently when it doesn't.
 *
 * Failure detail: Supabase sends `error` / `error_description` back as query
 * params, and an unrecognised provider error usually means the redirect URL we
 * asked for is missing from Authentication → URL Configuration.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusLabel, setStatusLabel] = useState("Finishing sign in…");

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      router.replace("/signin");
      return;
    }

    // Provider rejections arrive as query params on this same URL.
    const params = new URLSearchParams(window.location.search);
    const oauthError =
      params.get("error_description") ?? params.get("error_code");

    let settled = false;
    let timer = 0;

    const fail = (description: string) => {
      if (settled) return;
      settled = true;
      setStatusLabel("Sign-in did not complete");
      // Stable id: StrictMode runs the effect twice on mount, and a repeated
      // toast would otherwise stack.
      toast.error("Sign-in did not complete", {
        id: "oauth-callback-failed",
        description,
      });
      window.setTimeout(() => router.replace("/signin"), 1200);
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      router.replace("/");
    };

    if (oauthError) {
      fail(oauthError);
      return () => window.clearTimeout(timer);
    }

    // `onAuthStateChange` fires for the exchange that <AuthProvider> started, so
    // the session never depends on who subscribed first.
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) succeed();
    });

    // Resolves once the in-flight code exchange settles. A null session here is
    // only conclusive if the exchange actually ran, so the timer is the backstop.
    void client.auth.getSession().then(({ data: { session } }) => {
      if (session) succeed();
    });

    timer = window.setTimeout(() => {
      void client.auth.getSession().then(({ data: { session } }) => {
        if (session) succeed();
        else fail("Please try again.");
      });
    }, SETTLE_MS);

    return () => {
      settled = true;
      data.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      {statusLabel}
    </div>
  );
}
