/**
 * Origin + landing route for the OAuth redirect.
 *
 * Supabase only honours a `redirectTo` that also appears in
 * Authentication → URL Configuration → Redirect URLs; anything else is
 * silently swapped for the project's Site URL, which strands the browser on
 * another host with no session and no PKCE code verifier. We therefore return
 * to the dashboard root (`/`) on the SAME origin the flow started from, so
 * local dev, Vercel previews and production each land back where they began —
 * no environment-specific constant is needed.
 *
 * Called only from client event handlers, so `window` is always defined here.
 */
export function getOAuthRedirectUrl(): string {
  return `${window.location.origin}/`;
}
