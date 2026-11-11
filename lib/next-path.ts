// Where to send a learner after logging in or signing up: the `next` search param.
// Shared by the middleware, the auth callback and both forms.

/**
 * A same-site path to go to, or null. Only paths on this site pass, so a link
 * can't send someone elsewhere: "//evil.com" and "/\evil.com" are refused.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Series need an account, so a learner sent to sign up from one is told why. */
export function isSeriesPath(path: string | null): boolean {
  return Boolean(path && (path === "/series" || path.startsWith("/series/") || path.startsWith("/series?")));
}

/** Adds `next` to an auth page's address, when there is one. */
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

/** The address auth links come back to: the name for a new profile, and where to go next. */
export function callbackPath({ name, next }: { name?: string | null; next?: string | null }): string {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  const back = safeNext(next);
  if (back) params.set("next", back);
  const query = params.toString();
  return `/auth/callback${query ? `?${query}` : ""}`;
}
