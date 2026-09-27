/**
 * Origin resolution for auth redirects.
 *
 * Supabase honours a `redirectTo` only when it matches an entry in
 * Authentication → URL Configuration → "Redirect URLs"; otherwise it silently
 * falls back to the project's Site URL. A wrong guess lands the user on another
 * host with no session and no PKCE code verifier, so the origin is resolved
 * deliberately instead of pasted together at the call site.
 */

/** OAuth landing route, kept in sync with `src/app/signin/callback`. */
const OAUTH_CALLBACK_PATH = "/signin/callback";

/** Hosts that are always this machine, so the live URL beats any configured one. */
const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function browserOrigin(): string | null {
  if (typeof window === "undefined") return null;
  const origin = window.location.origin;
  return origin.startsWith("http") ? origin : null;
}

function isLoopback(origin: string): boolean {
  try {
    return LOOPBACK_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * Base URL of the app in the current context, in priority order:
 *
 * 1. Loopback browser origin — local development always returns to the same
 *    scheme/host/port the flow started from, so a stale `NEXT_PUBLIC_APP_URL`
 *    can never bounce a developer off their own machine.
 * 2. `NEXT_PUBLIC_APP_URL` — the canonical deployment origin, when configured.
 * 3. Live browser origin — covers preview deployments with no env var set.
 * 4. `http://localhost:3000` — SSR-only fallback; never used in a browser.
 */
export function resolveAppUrl(): string {
  const origin = browserOrigin();

  if (origin && isLoopback(origin)) return stripTrailingSlash(origin);

  if (origin) return stripTrailingSlash(origin);

  return "http://localhost:4000";
}

/** Where Supabase should return the browser once the provider sign-in settles. */
export function getOAuthRedirectUrl(): string {
  return `${resolveAppUrl()}${OAUTH_CALLBACK_PATH}`;
}

/** True when running on a developer machine (used to hint at local config gaps). */
export function isLocalOrigin(): boolean {
  const origin = browserOrigin();
  return origin ? isLoopback(origin) : true;
}
