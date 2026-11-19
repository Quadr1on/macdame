import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageMember, canManageRole } from '@/lib/admin-permissions'
import {
  cleanIds,
  isUuid,
  jsonError,
  listNames,
  loadMember,
  loadRolesById,
  logAccessEvent,
} from '@/lib/admin-access'

async function loadManageable(guard, id) {
  if (!isUuid(id)) return { response: jsonError('Member not found', 404) }
  const admin = createAdminClient()
  const { member, error } = await loadMember(admin, id)
  if (error) return { response: jsonError(error.message, 500) }
  if (!member) return { response: jsonError('Member not found', 404) }
  if (!canManageMember(guard.access, member.roles)) {
    return { response: jsonError('You can only manage people whose roles are all below yours', 403) }
  }
  return { admin, member }
}

// Replaces a member's roles.
export async function PATCH(request, { params }) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response

  const { id } = await params
  const loaded = await loadManageable(guard, id)
  if (loaded.response) return loaded.response
  const { admin, member } = loaded

  const body = await request.json().catch(() => ({}))
  const roleIds = cleanIds(body.roleIds)
  if (!roleIds) return jsonError('Invalid roles', 400)
  if (roleIds.length === 0) {
    return jsonError('Pick at least one role. To take away all access, remove them instead.', 400)
  }

  const { roles, missing, error: rolesError } = await loadRolesById(admin, roleIds)
  if (rolesError) return jsonError(rolesError.message, 500)
  if (missing.length) return jsonError('One of those roles no longer exists. Refresh and try again.', 409)
  if (roles.some((role) => !canManageRole(guard.access, role))) {
    return jsonError('You can only give roles that are below your own', 403)
  }

  const { error: deleteError } = await admin.from('admin_member_roles').delete().eq('member_id', member.id)
  if (deleteError) return jsonError(deleteError.message, 500)
  const { error: insertError } = await admin
    .from('admin_member_roles')
    .insert(roles.map((role) => ({ member_id: member.id, role_id: role.id })))
  if (insertError) {
    // Put the old roles back rather than leaving them with none.
    await admin
      .from('admin_member_roles')
      .insert(member.roles.map((role) => ({ member_id: member.id, role_id: role.id })))
    return jsonError(insertError.message, 500)
  }

  await logAccessEvent(
    admin,
    guard.user.email,
    'member.roles',
    `Changed ${member.email} from ${listNames(member.roles)} to ${listNames(roles)}`
  )
  return NextResponse.json({ ok: true })
}

// Removes someone's access entirely.
export async function DELETE(_request, { params }) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response

  const { id } = await params
  const loaded = await loadManageable(guard, id)
  if (loaded.response) return loaded.response
  const { admin, member } = loaded

  const { error } = await admin.from('admin_members').delete().eq('id', member.id)
  if (error) return jsonError(error.message, 500)

  await logAccessEvent(admin, guard.user.email, 'member.remove', `Removed ${member.email} (${listNames(member.roles)})`)
  return NextResponse.json({ ok: true })
}
