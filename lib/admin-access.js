// SERVER ONLY. Reads and writes for the Access page (members and roles).
// Who may do what is decided in lib/admin-permissions.js; this file only
// loads state and records what changed.

import { NextResponse } from 'next/server'
import { isPermission } from './admin-permissions'

export const ROLE_SELECT = 'id, name, color, position, permissions, created_at'

export async function loadRoles(admin) {
  return admin.from('admin_roles').select(ROLE_SELECT).order('position', { ascending: false })
}

export async function loadMembers(admin) {
  return admin
    .from('admin_members')
    .select('id, email, added_by, last_seen_at, created_at, admin_member_roles(role_id)')
    .order('created_at', { ascending: true })
}

/** One member with the full role rows they hold, or null. */
export async function loadMember(admin, id) {
  const { data, error } = await admin
    .from('admin_members')
    .select(`id, email, admin_member_roles(admin_roles(${ROLE_SELECT}))`)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return { member: null, error }
  return {
    member: {
      id: data.id,
      email: data.email,
      roles: (data.admin_member_roles ?? []).map((link) => link.admin_roles).filter(Boolean),
    },
    error: null,
  }
}

/** Role rows for these ids; `missing` lists ids that don't exist. */
export async function loadRolesById(admin, ids) {
  if (ids.length === 0) return { roles: [], missing: [], error: null }
  const { data, error } = await admin.from('admin_roles').select(ROLE_SELECT).in('id', ids)
  if (error) return { roles: [], missing: [], error }
  const found = new Set((data ?? []).map((role) => role.id))
  return { roles: data ?? [], missing: ids.filter((id) => !found.has(id)), error: null }
}

/** Writes a line to the access log. Failures are logged, never thrown. */
export async function logAccessEvent(admin, actorEmail, action, summary) {
  const { error } = await admin
    .from('admin_access_events')
    .insert({ actor_email: actorEmail ?? null, action, summary })
  if (error) console.error('admin_access_events insert failed', error)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Unique, well-formed uuids from an untrusted array, or null if it isn't one. */
export function cleanIds(value) {
  if (!Array.isArray(value)) return null
  const ids = [...new Set(value.filter((v) => typeof v === 'string' && UUID.test(v)))]
  return ids.length === value.length ? ids : null
}

export function isUuid(value) {
  return typeof value === 'string' && UUID.test(value)
}

/** Known permission keys from an untrusted array, or null if any are unknown. */
export function cleanPermissions(value) {
  if (!Array.isArray(value)) return null
  const keys = [...new Set(value)]
  return keys.every((key) => typeof key === 'string' && isPermission(key)) ? keys : null
}

export function cleanRoleName(value) {
  if (typeof value !== 'string') return null
  const name = value.trim().replace(/\s+/g, ' ')
  return name.length >= 1 && name.length <= 40 ? name : null
}

export function cleanColour(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null
}

export function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status })
}

export function listNames(roles) {
  return roles.length ? roles.map((role) => role.name).join(', ') : 'no roles'
}
