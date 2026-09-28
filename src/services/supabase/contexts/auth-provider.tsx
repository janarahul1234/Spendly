"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/services/supabase/client";

export interface Session {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthValue {
  session: Session | null;
  status: AuthStatus;
  /** Whether Google OAuth is wired up (Supabase env vars present). */
  googleEnabled: boolean;
  /** Starts the Google OAuth flow; the same call signs users in and up. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function mapSession(supabaseSession: SupabaseSession | null): Session | null {
  const user = supabaseSession?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    name: String(
      meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "You",
    ),
    email: String(user.email ?? ""),
    avatarUrl:
      typeof meta.avatar_url === "string" ? meta.avatar_url : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const googleEnabled = isSupabaseConfigured();

  const [session, setSession] = useState<Session | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let active = true;

    const apply = (next: SupabaseSession | null) => {
      if (!active) return;
      setSession(mapSession(next));
      setResolved(true);
    };

    // Subscription callbacks and promise results are outside the effect body,
    // so React never renders synchronously from here.
    const { data } = client.auth.onAuthStateChange((_event, next) =>
      apply(next),
    );
    void client.auth
      .getSession()
      .then(({ data: { session } }) => apply(session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [googleEnabled]);

  const status: AuthStatus =
    !googleEnabled || resolved
      ? session
        ? "authenticated"
        : "anonymous"
      : "loading";

  const signInWithGoogle = useCallback(async () => {
    const client = getSupabase();
    if (!client)
      throw new Error(
        "Supabase is not configured. Add your project keys to .env.local.",
      );
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "/signin/callback",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabase();
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
    setSession(null);
    setResolved(true);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ session, status, googleEnabled, signInWithGoogle, signOut }),
    [session, status, googleEnabled, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
