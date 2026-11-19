'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, GripVertical, Lock, Plus, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel, adminPrimaryButton } from '@/components/admin/ui'
import { PERMISSION_GROUPS, ROLE_COLOURS, canManageRole } from '@/lib/admin-permissions'
import { accessApi } from './shared'

const sameList = (a, b) => a.length === b.length && a.every((value, i) => value === b[i])
const sameSet = (a, b) => a.length === b.length && a.every((value) => b.includes(value))

function Switch({ checked, onChange, disabled, labelledBy, describedBy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[1.15rem]' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function RolesTab({ roles, members, actor, selectedId, onSelect }) {
  const router = useRouter()
  const savedOrder = roles.map((role) => role.id)
  const byId = new Map(roles.map((role) => [role.id, role]))

  const [order, setOrder] = useState(savedOrder)
  const [dragId, setDragId] = useState(null)
  const selected = byId.get(selectedId) ?? roles[0] ?? null
  const fromRole = (role) =>
    role ? { roleId: role.id, name: role.name, color: role.color, permissions: role.permissions } : null
  const [rawDraft, setRawDraft] = useState(() => fromRole(selected))
  // A draft only counts for the role it was made for; if the selection moved
  // (e.g. a role was just created or deleted) start from the saved role.
  const draft = rawDraft && rawDraft.roleId === selected?.id ? rawDraft : fromRole(selected)
  const updateDraft = (changes) => setRawDraft({ ...draft, ...changes })
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Roles at or above the actor sit at the top and can't move; the
  // manageable ones below them can be reordered among themselves.
  const lockedCount = order.filter((id) => !canManageRole(actor, byId.get(id))).length
  const orderDirty = !sameList(order, savedOrder)
  const editable = selected ? canManageRole(actor, selected) : false
  const draftDirty =
    selected && draft
      ? draft.name !== selected.name || draft.color !== selected.color || !sameSet(draft.permissions, selected.permissions)
      : false
  const dirty = orderDirty || draftDirty

  const memberCount = (roleId) => members.filter((member) => member.roleIds.includes(roleId)).length
  const membersWith = (roleId) => members.filter((member) => member.roleIds.includes(roleId))

  function select(role) {
    if (role.id === selected?.id) return
    if (draftDirty && !window.confirm('Discard your unsaved changes to this role?')) return
    onSelect(role.id)
    setRawDraft(fromRole(role))
    setError('')
  }

  function move(id, toIndex) {
    const from = order.indexOf(id)
    if (from === -1 || toIndex < lockedCount || toIndex >= order.length || toIndex === from) return
    const next = order.filter((x) => x !== id)
    next.splice(toIndex, 0, id)
    setOrder(next)
  }

  function reset() {
    setOrder(savedOrder)
    setRawDraft(fromRole(selected))
    setError('')
  }

  async function save() {
    setSaving(true)
    setError('')
    if (draftDirty) {
      const { name, color, permissions } = draft
      const result = await accessApi('PATCH', `/api/admin/access/roles/${selected.id}`, { name, color, permissions })
      if (!result.ok) {
        setSaving(false)
        return setError(result.error)
      }
    }
    if (orderDirty) {
      const result = await accessApi('PUT', '/api/admin/access/roles/order', { order: order.slice(lockedCount) })
      if (!result.ok) {
        setSaving(false)
        return setError(result.error)
      }
    }
    setSaving(false)
    router.refresh()
  }

  async function createRole() {
    if (dirty && !window.confirm('Discard your unsaved changes and create a new role?')) return
    setCreating(true)
    setError('')
    const color = ROLE_COLOURS[(roles.length + 3) % ROLE_COLOURS.length]
    const result = await accessApi('POST', '/api/admin/access/roles', { name: 'New role', color, permissions: [] })
    setCreating(false)
    if (!result.ok) return setError(result.error)
    onSelect(result.data.role.id)
    router.refresh()
  }

  async function deleteRole() {
    const count = memberCount(selected.id)
    const warning = count
      ? ` ${count} ${count === 1 ? 'person has' : 'people have'} it; anyone left with no roles loses access.`
      : ''
    if (!window.confirm(`Delete the ${selected.name} role?${warning}`)) return
    setSaving(true)
    setError('')
    const result = await accessApi('DELETE', `/api/admin/access/roles/${selected.id}`)
    setSaving(false)
    if (!result.ok) return setError(result.error)
    onSelect(roles.find((role) => role.id !== selected.id)?.id ?? null)
    router.refresh()
  }

  function togglePermission(key, on) {
    updateDraft({
      permissions: on ? [...draft.permissions, key] : draft.permissions.filter((p) => p !== key),
    })
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr] items-start">
        <Panel
          title="Roles"
          description="Higher roles can manage the ones below them. Drag to reorder."
        >
          <div className="border-b border-slate-100 p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={createRole}
              disabled={creating}
              className="w-full gap-1.5"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {creating ? 'Creating…' : 'Create role'}
            </Button>
          </div>
          {order.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No roles yet.</p>
          ) : (
            <ol className="p-2" aria-label="Roles, most senior first">
              {order.map((id, index) => {
                const role = byId.get(id)
                const locked = index < lockedCount
                const isSelected = role.id === selected?.id
                return (
                  <li
                    key={id}
                    draggable={!locked}
                    onDragStart={(e) => {
                      setDragId(id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      if (!dragId || locked) return
                      e.preventDefault()
                      move(dragId, index)
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={`group flex items-center gap-1 rounded-md ${dragId === id ? 'opacity-50' : ''} ${
                      isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`pl-1 ${locked ? 'text-slate-300' : 'cursor-grab text-slate-400'}`}
                      aria-hidden="true"
                    >
                      {locked ? <Lock className="h-3.5 w-3.5" /> : <GripVertical className="h-4 w-4" />}
                    </span>
                    <button
                      type="button"
                      onClick={() => select(role)}
                      aria-current={isSelected ? 'true' : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: role.color }} aria-hidden="true" />
                      <span className={`truncate ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {role.name}
                      </span>
                      <span className="ml-auto text-xs tabular-nums text-slate-400">{memberCount(role.id)}</span>
                    </button>
                    {!locked && (
                      <span className="flex shrink-0 flex-col pr-1">
                        <button
                          type="button"
                          onClick={() => move(id, index - 1)}
                          disabled={index - 1 < lockedCount}
                          aria-label={`Move ${role.name} up`}
                          className="rounded text-slate-400 hover:text-slate-900 disabled:opacity-20 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(id, index + 1)}
                          disabled={index + 1 >= order.length}
                          aria-label={`Move ${role.name} down`}
                          className="rounded text-slate-400 hover:text-slate-900 disabled:opacity-20 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
          {!actor.isOwner && lockedCount > 0 && (
            <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              <Lock className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Locked roles are at or above your own.
            </p>
          )}
        </Panel>

        {selected && draft ? (
          <Panel title={`Edit role · ${selected.name}`}>
            <div className="space-y-6 p-4">
              {!editable && (
                <p className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  This role is at or above your own, so you can see it but not change it.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="role_name" className="text-sm font-medium text-slate-900">
                    Role name
                  </label>
                  <input
                    id="role_name"
                    value={draft.name}
                    maxLength={40}
                    disabled={!editable}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200 disabled:bg-slate-50"
                  />
                </div>
                <fieldset className="space-y-1.5" disabled={!editable}>
                  <legend className="text-sm font-medium text-slate-900">Colour</legend>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ROLE_COLOURS.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => updateDraft({ color: colour })}
                        aria-label={`Colour ${colour}`}
                        aria-pressed={draft.color === colour}
                        className={`h-6 w-6 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed ${
                          draft.color === colour ? 'ring-2 ring-slate-900' : ''
                        }`}
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                    <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-dashed border-slate-300" title="Custom colour">
                      <span className="sr-only">Custom colour</span>
                      <input
                        type="color"
                        value={draft.color}
                        onChange={(e) => updateDraft({ color: e.target.value })}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                      <Plus className="absolute inset-0 m-auto h-3 w-3 text-slate-400" aria-hidden="true" />
                    </label>
                  </div>
                </fieldset>
              </div>

              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-slate-900">Permissions</h3>
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.key}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
                    <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                      {group.permissions.map((permission) => {
                        const on = draft.permissions.includes(permission.key)
                        const held = actor.permissions.includes(permission.key)
                        // You can always switch something off, but only switch on
                        // what you hold yourself (the API enforces the same).
                        const canToggle = editable && (on || held)
                        const id = `perm-${permission.key.replace('.', '-')}`
                        return (
                          <li key={permission.key} className="flex items-center justify-between gap-4 px-3 py-2.5">
                            <div className="min-w-0">
                              <p id={`${id}-label`} className="flex items-center gap-1.5 text-sm text-slate-900">
                                {permission.label}
                                {permission.dangerous && (
                                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" aria-label="Powerful permission" />
                                )}
                              </p>
                              {(permission.hint || (editable && !held && !on)) && (
                                <p id={`${id}-hint`} className="text-xs text-slate-500">
                                  {editable && !held && !on ? 'You don’t have this permission, so you can’t give it.' : permission.hint}
                                </p>
                              )}
                            </div>
                            <Switch
                              checked={on}
                              disabled={!canToggle}
                              onChange={(next) => togglePermission(permission.key, next)}
                              labelledBy={`${id}-label`}
                              describedBy={permission.hint ? `${id}-hint` : undefined}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  Members with this role <span className="font-normal text-slate-400">({memberCount(selected.id)})</span>
                </h3>
                {membersWith(selected.id).length === 0 ? (
                  <p className="text-sm text-slate-500">Nobody yet. Give it to people on the Members tab.</p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {membersWith(selected.id).map((member) => (
                      <li key={member.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                        {member.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {editable && (
                <div className="border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={deleteRole}
                    className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  >
                    Delete role
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        ) : (
          <Panel>
            <p className="px-4 py-10 text-center text-sm text-slate-500">Create a role to get started.</p>
          </Panel>
        )}
      </div>

      {error && !dirty && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Discord-style "unsaved changes" bar: edits to the role and to the
          order are held locally until saved together. */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur md:left-60">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">You have unsaved changes</p>
              {error && (
                <p role="alert" className="text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={reset} disabled={saving}>
                Reset
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={saving} className={adminPrimaryButton}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
