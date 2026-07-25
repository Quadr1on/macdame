import { NextResponse } from 'next/server'
import { createClient } from './supabase/server'

// SERVER ONLY. Never import this into a 'use client' component — ADMIN_EMAILS
// has no NEXT_PUBLIC_ prefix precisely so the allowlist never reaches the
// browser bundle. Clients learn their own admin status from
// GET /api/admin/session instead.

export function isAdminEmail(email) {
  if (!email) return false

  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase())
}

/**
 * Resolves the signed-in user and whether they're an admin.
 *
 * Returns { user, isAdmin, reason } where reason is:
 *   null              - user is an admin
 *   'unauthenticated' - nobody is signed in
 *   'forbidden'       - signed in, but not on the allowlist
 *
 * Every /api/admin/* route must call this itself. The admin layout's gate does
 * not cover route handlers — layouts only wrap page renders.
 */
export async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, isAdmin: false, reason: 'unauthenticated' }
  if (!isAdminEmail(user.email)) return { user, isAdmin: false, reason: 'forbidden' }

  return { user, isAdmin: true, reason: null }
}

/**
 * Guard for /api/admin/* route handlers.
 *
 * Returns { user } when the caller is an admin, or { response } holding the
 * 401/403 to return immediately. Usage:
 *
 *   const guard = await requireAdminApi()
 *   if (guard.response) return guard.response
 */
export async function requireAdminApi() {
  const { user, reason } = await getAdminUser()

  if (reason === 'unauthenticated') {
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }
  if (reason === 'forbidden') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user }
}
