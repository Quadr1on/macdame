import { NextResponse } from 'next/server'
import { requireAdminApi, isAdminEmail } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageRole, normaliseEmail } from '@/lib/admin-permissions'
import { cleanIds, jsonError, listNames, loadRolesById, logAccessEvent } from '@/lib/admin-access'

// Adds someone to the admin by email. They get in the first time they sign in
// with a Google account on that address; no invite email is sent.
export async function POST(request) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response
  const actor = guard.access

  const body = await request.json().catch(() => ({}))
  const email = normaliseEmail(body.email)
  if (!email) return jsonError('Enter a valid email address', 400)
  if (isAdminEmail(email)) return jsonError('That address is already an owner', 409)

  const roleIds = cleanIds(body.roleIds ?? [])
  if (!roleIds) return jsonError('Invalid roles', 400)
  if (roleIds.length === 0) return jsonError('Pick at least one role, or they will have no access', 400)

  const admin = createAdminClient()
  const { roles, missing, error: rolesError } = await loadRolesById(admin, roleIds)
  if (rolesError) return jsonError(rolesError.message, 500)
  if (missing.length) return jsonError('One of those roles no longer exists. Refresh and try again.', 409)
  if (roles.some((role) => !canManageRole(actor, role))) {
    return jsonError('You can only give roles that are below your own', 403)
  }

  const { data: member, error } = await admin
    .from('admin_members')
    .insert({ email, added_by: guard.user.email ?? null })
    .select('id, email')
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('That person already has access', 409)
    return jsonError(error.message, 500)
  }

  const { error: linkError } = await admin
    .from('admin_member_roles')
    .insert(roles.map((role) => ({ member_id: member.id, role_id: role.id })))

  if (linkError) {
    // Don't leave a member with no roles behind.
    await admin.from('admin_members').delete().eq('id', member.id)
    return jsonError(linkError.message, 500)
  }

  await logAccessEvent(admin, guard.user.email, 'member.add', `Added ${email} as ${listNames(roles)}`)
  return NextResponse.json({ member }, { status: 201 })
}
