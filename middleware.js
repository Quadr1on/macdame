import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session token; required so server components see a valid session.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip static assets AND the public catalog routes (/shop, /products,
    // /collections): those pages read no session server-side (they use the
    // cookie-free catalog client), so paying a Supabase auth round trip on
    // every navigation there only added latency. Any other route (home, cart,
    // login, auth callback) still refreshes the session as before. If a
    // catalog page ever needs the server session, re-include it here.
    '/((?!_next/static|_next/image|favicon.ico|shop|products/|collections/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
