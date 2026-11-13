import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageRole, permissionLabel, ungrantable } from '@/lib/admin-permissions'
import {
  ROLE_SELECT,
  cleanColour,
  cleanPermissions,
  cleanRoleName,
  isUuid,
  jsonError,
  logAccessEvent,
} from '@/lib/admin-access'

async function loadManageableRole(guard, id) {
  if (!isUuid(id)) return { response: jsonError('Role not found', 404) }
  const admin = createAdminClient()
  const { data: role, error } = await admin.from('admin_roles').select(ROLE_SELECT).eq('id', id).maybeSingle()
  if (error) return { response: jsonError(error.message, 500) }
  if (!role) return { response: jsonError('Role not found', 404) }
  if (!canManageRole(guard.access, role)) {
    return { response: jsonError('You can only change roles that are below your own', 403) }
  }
  return { admin, role }
}

// Renames, recolours or changes the permissions of a role.
export async function PATCH(request, { params }) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response

  const { id } = await params
  const loaded = await loadManageableRole(guard, id)
  if (loaded.response) return loaded.response
  const { admin, role } = loaded

  const body = await request.json().catch(() => ({}))
  const updates = {}

  if (body.name !== undefined) {
    const name = cleanRoleName(body.name)
    if (!name) return jsonError('Give the role a name (up to 40 characters)', 400)
    updates.name = name
  }
  if (body.color !== undefined) {
    const color = cleanColour(body.color)
    if (!color) return jsonError('Invalid colour', 400)
    updates.color = color
  }
  if (body.permissions !== undefined) {
    const permissions = cleanPermissions(body.permissions)
    if (!permissions) return jsonError('Unknown permission', 400)
    // Discord's rule: you can't add a permission you don't hold yourself, but
    // a permission already on the role (set by an owner) can stay.
    const added = permissions.filter((key) => !role.permissions.includes(key))
    const missing = ungrantable(guard.access, added)
    if (missing.length) {
      return jsonError(`You can't give a permission you don't have: ${missing.map(permissionLabel).join(', ')}`, 403)
    }
    updates.permissions = permissions
  }

  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400)
  updates.updated_at = new Date().toISOString()

  const { data, error } = await admin.from('admin_roles').update(updates).eq('id', role.id).select(ROLE_SELECT).single()
  if (error) return jsonError(error.message, 500)

  const changes = []
  if (updates.name && updates.name !== role.name) changes.push(`renamed to ${updates.name}`)
  if (updates.color && updates.color !== role.color) changes.push('changed colour')
  if (updates.permissions) {
    const added = updates.permissions.filter((key) => !role.permissions.includes(key))
    const removed = role.permissions.filter((key) => !updates.permissions.includes(key))
    if (added.length) changes.push(`allowed ${added.map(permissionLabel).join(', ')}`)
    if (removed.length) changes.push(`removed ${removed.map(permissionLabel).join(', ')}`)
  }
  if (changes.length) {
    await logAccessEvent(admin, guard.user.email, 'role.update', `Role ${role.name}: ${changes.join('; ')}`)
  }

  return NextResponse.json({ role: data })
}

// Deletes a role. Members keep their other roles; anyone left with no roles
// loses access until they are given one.
export async function DELETE(_request, { params }) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response

  const { id } = await params
  const loaded = await loadManageableRole(guard, id)
  if (loaded.response) return loaded.response
  const { admin, role } = loaded

  const { error } = await admin.from('admin_roles').delete().eq('id', role.id)
  if (error) return jsonError(error.message, 500)

  await logAccessEvent(admin, guard.user.email, 'role.delete', `Deleted role ${role.name}`)
  return NextResponse.json({ ok: true })
}
