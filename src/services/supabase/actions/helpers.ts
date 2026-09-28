import { getSupabase } from "@/services/supabase/client";

/**
 * Shared plumbing for the Supabase data actions: the client guards, a helper
 * that turns Supabase query builders into awaited results with consistent
 * error handling, and the camelCase ↔ snake_case row type every table
 * mapping works against.
 */

/** Loose shape of a Postgres row as returned by the Supabase JS client. */
export type Row = Record<string, unknown>;

/** Anything the Supabase JS client returns from `.then()` — query, upsert, delete… */
type Query<R extends { error: { message: string } | null }> = PromiseLike<R>;

/** Minimum shape every Supabase query result carries; `data` is optional. */
type QueryResult = { error: { message: string } | null; data?: unknown };

/** Throws a descriptive error when the app runs without Supabase env vars. */
export function requireClient() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured — add your project keys to .env.local.");
  return client;
}

/** Returns the client when configured, or `null` — for best-effort calls. */
export function maybeClient() {
  return getSupabase();
}

function fail(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context} — ${error.message}`);
}

/** Await a query, throwing `${context} — <db message>` on failure. */
export async function run<R extends QueryResult>(query: Query<R>, context: string): Promise<R> {
  const result = await query;
  fail(result.error, context);
  return result;
}

/** Await a query and swallow any failure (used by the best-effort `clear` path). */
export async function runQuietly(query: Query<QueryResult>) {
  try {
    await query;
  } catch {
    /* best effort */
  }
}
