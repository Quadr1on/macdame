import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageRole } from '@/lib/admin-permissions'
import { cleanIds, jsonError, loadRoles, logAccessEvent } from '@/lib/admin-access'

/**
 * Reorders the roles the caller can manage. `order` lists exactly those
 * roles' ids, most senior first. They are handed back the same position
 * values they had between them, so they can be shuffled among themselves but
 * never moved above the caller's own highest role.
 */
export async function PUT(request) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response

  const body = await request.json().catch(() => ({}))
  const order = cleanIds(body.order)
  if (!order) return jsonError('Invalid order', 400)

  const admin = createAdminClient()
  const { data: roles, error } = await loadRoles(admin)
  if (error) return jsonError(error.message, 500)

  const manageable = roles.filter((role) => canManageRole(guard.access, role))
  const manageableIds = new Set(manageable.map((role) => role.id))
  if (order.length !== manageable.length || order.some((id) => !manageableIds.has(id))) {
    return jsonError('The role list changed while you were editing. Refresh and try again.', 409)
  }

  // Owners renumber everything evenly, which also clears any ties. Members
  // reuse the slots their manageable roles already occupy.
  const slots = guard.access.isOwner
    ? order.map((_, index) => (order.length - index) * 10)
    : manageable.map((role) => role.position).sort((a, b) => b - a)

  const results = await Promise.all(
    order.map((id, index) =>
      admin
        .from('admin_roles')
        .update({ position: slots[index], updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  )
  const failed = results.find((result) => result.error)
  if (failed) return jsonError(failed.error.message, 500)

  const byId = new Map(roles.map((role) => [role.id, role.name]))
  await logAccessEvent(admin, guard.user.email, 'role.order', `Reordered roles: ${order.map((id) => byId.get(id)).join(' > ')}`)
  return NextResponse.json({ ok: true })
}
