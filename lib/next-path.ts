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

/**
 * Logging in from a guest's finished lesson. Only then does the guest on this device
 * move into an account that already exists, so today's lesson counts toward its streak.
 * A guest left on a shared device is never folded into someone's account unasked.
 */
export const KEEP_TODAY_LOGIN = "/login?keep=today";

/** The `keep` search param asks for today's lesson to come along. */
export function isKeepToday(value: string | string[] | null | undefined): boolean {
  return value === "today";
}

/**
 * The address auth links come back to: the name for a new profile, where to go next,
 * and whether the guest's lesson comes along.
 */
export function callbackPath({
  name,
  next,
  keepToday = false,
}: {
  name?: string | null;
  next?: string | null;
  keepToday?: boolean;
}): string {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  const back = safeNext(next);
  if (back) params.set("next", back);
  if (keepToday) params.set("keep", "today");
  const query = params.toString();
  return `/auth/callback${query ? `?${query}` : ""}`;
}
