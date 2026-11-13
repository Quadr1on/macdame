import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { permissionLabel, ungrantable } from '@/lib/admin-permissions'
import {
  ROLE_SELECT,
  cleanColour,
  cleanPermissions,
  cleanRoleName,
  jsonError,
  logAccessEvent,
} from '@/lib/admin-access'

// Creates a role. As in Discord, a new role starts at the bottom of the list,
// below everyone's roles, so whoever made it can manage it straight away.
export async function POST(request) {
  const guard = await requireAdminApi('access.manage')
  if (guard.response) return guard.response

  const body = await request.json().catch(() => ({}))
  const name = cleanRoleName(body.name)
  if (!name) return jsonError('Give the role a name (up to 40 characters)', 400)
  const color = cleanColour(body.color ?? '#64748b')
  if (!color) return jsonError('Invalid colour', 400)
  const permissions = cleanPermissions(body.permissions ?? [])
  if (!permissions) return jsonError('Unknown permission', 400)

  const missing = ungrantable(guard.access, permissions)
  if (missing.length) {
    return jsonError(`You can't give a permission you don't have: ${missing.map(permissionLabel).join(', ')}`, 403)
  }

  const admin = createAdminClient()
  const { data: lowest, error: lowestError } = await admin
    .from('admin_roles')
    .select('position')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (lowestError) return jsonError(lowestError.message, 500)

  const { data: role, error } = await admin
    .from('admin_roles')
    .insert({ name, color, permissions, position: lowest ? lowest.position - 10 : 0 })
    .select(ROLE_SELECT)
    .single()
  if (error) return jsonError(error.message, 500)

  await logAccessEvent(admin, guard.user.email, 'role.create', `Created role ${name}`)
  return NextResponse.json({ role }, { status: 201 })
}
