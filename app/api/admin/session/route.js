import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'

// Lets the client learn whether the signed-in user is an admin without ever
// shipping the allowlist to the browser. Answers 200 with { isAdmin: false }
// rather than 403 for ordinary customers — the navbar polls this on every
// sign-in, and a 403 there would just litter their console.
export async function GET() {
  const { isAdmin } = await getAdminUser()
  return NextResponse.json({ isAdmin }, { headers: { 'Cache-Control': 'no-store' } })
}
