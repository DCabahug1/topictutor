import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { ensureProfileExists } from '@/lib/profiles'
import { adoptAfterSignIn } from '@/lib/almanac/server/adopt'
import { safeNext } from '@/lib/next-path'

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
        await adoptAfterSignIn(userData.user.id, guestId)
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