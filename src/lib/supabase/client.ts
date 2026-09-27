"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Accepts the new publishable keys (`sb_publishable_…`) and legacy anon JWTs. */
const key = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** True when the Supabase env vars are present and plausible. */
export function isSupabaseConfigured(): boolean {
  return url().startsWith("http") && key().length > 20;
}

let cached: SupabaseClient | null = null;

/** Singleton browser client — safe to call from any client component. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) cached = createBrowserClient(url(), key());
  return cached;
}
