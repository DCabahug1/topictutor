import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSeriesPath, safeNext } from "@/lib/next-path";

// Guests get today's lesson only. Series, the sample series included, need an account:
// a guest who opens one is sent to sign up, then on to the series they asked for.
const PUBLIC_EXACT = ["/", "/today/lesson", "/login", "/register", "/reset"];
const PUBLIC_PREFIXES = ["/auth/", "/welcome/"];

// Signed-in learners never see these.
const SIGNED_OUT_ONLY = ["/login", "/register", "/auth/login", "/auth/register"];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  if (process.env.NODE_ENV !== "production" && pathname.startsWith("/dev/")) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
  );
}

// A redirect is a new response, so the refreshed session cookies are copied over.
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const response = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.cookies.set(name, value)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Don't remove getClaims()
  const { data } = await supabase.auth.getClaims();

  // An anonymous guest has a session but no account: treat them as signed out here.
  const user = data?.claims && !data.claims.is_anonymous ? data.claims : null;

  const { pathname } = request.nextUrl;

  // The data layer's routes answer with their own errors instead of a redirect.
  if (pathname.startsWith("/api/almanac/")) return supabaseResponse;

  if (!user && !isPublicPath(pathname)) {
    // Sign up for a series, log in for anything else, and come back here afterwards.
    const url = request.nextUrl.clone();
    const back = `${pathname}${request.nextUrl.search}`;
    url.pathname = isSeriesPath(pathname) ? "/register" : "/login";
    url.search = "";
    url.searchParams.set("next", back);
    return redirectKeepingCookies(url, supabaseResponse);
  }

  if (user && SIGNED_OUT_ONLY.some((path) => pathname === path)) {
    // Already signed in: go where the link was headed, or to Today.
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = next ? next.split("?")[0] : "/today";
    url.search = next?.includes("?") ? next.slice(next.indexOf("?")) : "";
    return redirectKeepingCookies(url, supabaseResponse);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
