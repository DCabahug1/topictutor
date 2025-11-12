import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { ensureProfileExists } from '@/lib/profiles'

export async function GET(request: Request) {
  console.log("callback", request.url )
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get the user after successful session exchange
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (!userError && userData?.user) {
        // Create profile before redirect
        try {
          const profileResult = await ensureProfileExists(userData.user, supabase)
          if (!profileResult.success) {
            console.error("Failed to create profile during OAuth callback:", profileResult.error)
            // Continue with redirect even if profile creation fails
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
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}