import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { ensureProfileExists } from '@/lib/profiles'
import type { User } from '@supabase/supabase-js'
import { adoptGuest, adoptPending, hasOwnProgress } from '@/lib/almanac/server/adopt'
import { safeNext } from '@/lib/next-path'

const SIGN_UP_MS = 10 * 60 * 1000

const isRecent = (at: string | undefined) => {
  const made = at ? Date.parse(at) : NaN
  return Number.isFinite(made) && Date.now() - made < SIGN_UP_MS
}

/**
 * This sign-in signed the learner up: it made the account, or it is their first
 * Google sign-in, which Supabase attaches to an older account with the same
 * email (often one made by email long ago and never used here).
 */
function isSignUp(user: User): boolean {
  return isRecent(user.created_at) || Boolean(user.identities?.some((identity) => isRecent(identity.created_at)))
}

export async function GET(request: Request) {
  console.log("callback", request.url )
  const { searchParams, origin } = new URL(request.url)
  const name = searchParams.get('name')
  const code = searchParams.get('code')
  // Where the learner was headed before signing in, if it's a path on this site.
  const next = safeNext(searchParams.get('next')) ?? '/today'

  if (code) {
    const supabase = await createClient()
    // The guest signed in on this device, read before the exchange replaces their session.
    const { data: before } = await supabase.auth.getClaims()
    const guestId =
      before?.claims?.is_anonymous && typeof before.claims.sub === 'string' ? before.claims.sub : null
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get the user after successful session exchange
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!userError && userData?.user && !userData.user.is_anonymous) {
        // The guest on this device moves in only when this sign-in signed the learner up and
        // the account has no progress of its own yet. Folding a guest into an account someone
        // already uses would mark a lesson as done in it that they never did.
        const user = userData.user
        if (guestId && isSignUp(user) && !(await hasOwnProgress(user.id))) await adoptGuest(guestId, user.id)
        // The guest recorded when this account was made by email, if any.
        await adoptPending(userData.user.id)
      }

      if (!userError && userData?.user) {
        // Create profile before redirect
        try {
          console.log("Attempting to ensure profile exists for user:", userData.user.email)
          const profileResult = await ensureProfileExists(userData.user, supabase, name)
          if (!profileResult.success) {
            console.error("Failed to create profile during OAuth callback:", profileResult.error)
            // Continue with redirect even if profile creation fails
          } else {
            console.log("Profile handling successful:", profileResult.profileExists ? "existed" : "created")
          }
        } catch (error) {
          console.error("Error creating profile during OAuth callback:", error)
          // Continue with redirect even if profile creation fails
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/reset?state=link-failed`)
}