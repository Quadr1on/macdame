import { cache } from 'react'
import { NextResponse } from 'next/server'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'
import { can, resolveAccess } from './admin-permissions'

// SERVER ONLY. Never import this into a 'use client' component — ADMIN_EMAILS
// has no NEXT_PUBLIC_ prefix precisely so the allowlist never reaches the
// browser bundle. Clients learn their own admin status from
// GET /api/admin/session instead.
//
// Two kinds of admin:
//   Owners  - emails in ADMIN_EMAILS. Every permission, can't be removed or
//             limited from the Access page, so nobody can lock the shop out.
//   Members - rows in admin_members, with the union of their roles'
//             permissions. A member whose roles grant nothing has no access.

export function ownerEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email) {
  if (!email) return false
  return ownerEmails().includes(email.toLowerCase())
}

const SEEN_INTERVAL_MS = 60 * 60 * 1000

/** Roles for the member with this email, or null if they aren't a member. */
async function loadMembership(email) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_members')
    .select('id, last_seen_at, admin_member_roles(admin_roles(id, name, color, position, permissions))')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  // Fail closed: if the tables are missing or the query fails, a non-owner
  // simply has no access. Owners never reach this.
  if (error) {
    console.error('admin membership lookup failed', error)
    return null
  }
  if (!data) return null

  // Record roughly when they last used the admin, at most once an hour.
  const lastSeen = data.last_seen_at ? new Date(data.last_seen_at).getTime() : 0
  if (Date.now() - lastSeen > SEEN_INTERVAL_MS) {
    await admin.from('admin_members').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id)
  }

  return (data.admin_member_roles ?? []).map((link) => link.admin_roles).filter(Boolean)
}

/**
 * Resolves the signed-in user and what they may do in the admin.
 *
 * Returns { user, isAdmin, access, reason } where access is
 * { isOwner, permissions, position } and reason is:
 *   null              - user may use the admin
 *   'unauthenticated' - nobody is signed in
 *   'forbidden'       - signed in, but not an owner or a member with permissions
 *
 * Cached per request, so the layout, page and sidebar share one lookup.
 * Every /api/admin/* route must still check for itself — the admin layout's
 * gate does not cover route handlers.
 */
export const getAdminUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const none = { isOwner: false, permissions: [], position: -Infinity }
  if (!user) return { user: null, isAdmin: false, access: none, reason: 'unauthenticated' }
  if (!user.email) return { user, isAdmin: false, access: none, reason: 'forbidden' }

  if (isAdminEmail(user.email)) {
    return { user, isAdmin: true, access: resolveAccess({ isOwner: true }), reason: null }
  }

  const roles = await loadMembership(user.email)
  const access = roles ? resolveAccess({ isOwner: false, roles }) : none
  // For display only (e.g. under the email in the sidebar), most senior first.
  access.roleNames = (roles ?? [])
    .slice()
    .sort((a, b) => b.position - a.position)
    .map((role) => role.name)
  if (access.permissions.length === 0) {
    return { user, isAdmin: false, access, reason: 'forbidden' }
  }
  return { user, isAdmin: true, access, reason: null }
})

/**
 * Guard for /api/admin/* route handlers. Pass the permission the action
 * needs; with none, any admin passes.
 *
 * Returns { user, access } when allowed, or { response } holding the
 * 401/403 to return immediately:
 *
 *   const guard = await requireAdminApi('orders.update')
 *   if (guard.response) return guard.response
 */
export async function requireAdminApi(permission) {
  const { user, access, reason } = await getAdminUser()

  if (reason === 'unauthenticated') {
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }
  if (reason === 'forbidden') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  if (permission && !can(access, permission)) {
    return {
      response: NextResponse.json(
        { error: 'Your role does not allow this. Ask an owner for access.' },
        { status: 403 }
      ),
    }
  }

  return { user, access }
}
