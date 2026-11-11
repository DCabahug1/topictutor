import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Guests can read today's lesson, start one series and open the sample series.
// Series pages are open: a guest's own series lives in their browser until they sign up.
const PUBLIC_EXACT = ["/", "/today/lesson", "/login", "/register", "/reset"];
const PUBLIC_PREFIXES = ["/auth/", "/welcome/", "/series/"];

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

  const user = data?.claims;

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectKeepingCookies(url, supabaseResponse);
  }

  if (user && SIGNED_OUT_ONLY.some((path) => pathname === path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
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
