'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Lock, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel, adminPrimaryButton } from '@/components/admin/ui'
import CopyButton from '@/components/admin/CopyButton'
import { canManageMember, canManageRole, normaliseEmail } from '@/lib/admin-permissions'
import { formatAge } from '@/lib/admin-orders'
import { RolePill, accessApi } from './shared'

/** Toggle chips for picking roles; roles above the actor are shown but locked. */
function RolePicker({ roles, selected, onChange, actor, idPrefix }) {
  if (roles.length === 0) {
    return <p className="text-xs text-slate-500">There are no roles yet. Create one on the Roles tab first.</p>
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Roles">
      {roles.map((role) => {
        const allowed = canManageRole(actor, role)
        const on = selected.includes(role.id)
        return (
          <button
            key={role.id}
            id={`${idPrefix}-${role.id}`}
            type="button"
            aria-pressed={on}
            disabled={!allowed}
            title={allowed ? undefined : 'This role is at or above your own, so you cannot give it'}
            onClick={() => onChange(on ? selected.filter((id) => id !== role.id) : [...selected, role.id])}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 ${
              on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} aria-hidden="true" />
            {role.name}
            {!allowed && <Lock className="h-3 w-3" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

function Avatar({ email }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-600"
      aria-hidden="true"
    >
      {email.slice(0, 1)}
    </span>
  )
}

export default function MembersTab({ roles, members, owners, actor, viewerEmail }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newRoles, setNewRoles] = useState([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const rolesById = new Map(roles.map((role) => [role.id, role]))
  const manageableRoles = roles.filter((role) => canManageRole(actor, role))

  async function add(event) {
    event.preventDefault()
    setAddError('')
    const clean = normaliseEmail(email)
    if (!clean) return setAddError('Enter a valid email address')
    if (newRoles.length === 0) return setAddError('Pick at least one role')
    setAdding(true)
    const result = await accessApi('POST', '/api/admin/access/members', { email: clean, roleIds: newRoles })
    setAdding(false)
    if (!result.ok) return setAddError(result.error)
    setEmail('')
    setNewRoles([])
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Panel title="Give someone access" description="Add their Google account email and choose what they can do">
        {manageableRoles.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            There are no roles below yours to give. {actor.isOwner ? 'Create one on the Roles tab first.' : ''}
          </p>
        ) : (
          <form onSubmit={add} className="space-y-4 p-4">
            <div className="space-y-1.5">
              <label htmlFor="member_email" className="text-sm font-medium text-slate-900">
                Email
              </label>
              <input
                id="member_email"
                type="email"
                inputMode="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="h-9 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-900" id="new_member_roles">
                Roles
              </p>
              <RolePicker roles={roles} selected={newRoles} onChange={setNewRoles} actor={actor} idPrefix="new" />
            </div>
            {addError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {addError}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={adding} className={`gap-1.5 ${adminPrimaryButton}`}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {adding ? 'Adding…' : 'Give access'}
              </Button>
              <span className="text-xs text-slate-500">
                No email is sent. Send them the sign-in link:
              </span>
              <CopyButton text={() => `${window.location.origin}/login?next=/admin`} label="Copy sign-in link" />
            </div>
          </form>
        )}
      </Panel>

      <Panel title="People with access">
        <ul className="divide-y divide-slate-100">
          {owners.map((owner) => (
            <li key={owner} className="flex items-center gap-3 px-4 py-3">
              <Avatar email={owner} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {owner}
                  {owner === viewerEmail?.toLowerCase() && <span className="font-normal text-slate-400"> (you)</span>}
                </p>
                <p className="text-xs text-slate-500">Every permission · set in the server&apos;s ADMIN_EMAILS</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                <Crown className="h-3 w-3" aria-hidden="true" />
                Owner
              </span>
            </li>
          ))}
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              roles={roles}
              rolesById={rolesById}
              actor={actor}
              isViewer={member.email === viewerEmail?.toLowerCase()}
            />
          ))}
        </ul>
        {members.length === 0 && (
          <p className="border-t border-slate-100 px-4 py-6 text-center text-sm text-slate-500">
            Only owners have access so far.
          </p>
        )}
      </Panel>
    </div>
  )
}

function MemberRow({ member, roles, rolesById, actor, isViewer }) {
  const router = useRouter()
  const memberRoles = member.roleIds
    .map((id) => rolesById.get(id))
    .filter(Boolean)
    .sort((a, b) => b.position - a.position)
  const manageable = canManageMember(actor, memberRoles)

  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(member.roleIds)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const dirty =
    selected.length !== member.roleIds.length || selected.some((id) => !member.roleIds.includes(id))

  async function save() {
    if (selected.length === 0) return setError('Pick at least one role, or remove them instead')
    setBusy(true)
    setError('')
    const result = await accessApi('PATCH', `/api/admin/access/members/${member.id}`, { roleIds: selected })
    setBusy(false)
    if (!result.ok) return setError(result.error)
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    if (!window.confirm(`Remove ${member.email}? They lose access to the admin straight away.`)) return
    setBusy(true)
    setError('')
    const result = await accessApi('DELETE', `/api/admin/access/members/${member.id}`)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    router.refresh()
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar email={member.email} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {member.email}
            {isViewer && <span className="font-normal text-slate-400"> (you)</span>}
          </p>
          <p className="text-xs text-slate-500">
            {member.lastSeenAt ? (
              <>
                Last active <time suppressHydrationWarning>{formatAge(member.lastSeenAt)}</time>
              </>
            ) : (
              'Invited · hasn’t signed in yet'
            )}
            {member.addedBy && ` · added by ${member.addedBy}`}
          </p>
        </div>
        {!editing && (
          <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:justify-end">
            {memberRoles.length ? (
              memberRoles.map((role) => <RolePill key={role.id} role={role} />)
            ) : (
              <span className="text-xs font-medium text-red-600">No roles · no access</span>
            )}
          </div>
        )}
        {manageable ? (
          !editing && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit roles
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={remove}
                className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                Remove
              </Button>
            </div>
          )
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400" title="Their roles are at or above yours">
            <Lock className="h-3 w-3" aria-hidden="true" />
            {isViewer ? 'You' : 'Above your role'}
          </span>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:ml-11">
          <RolePicker roles={roles} selected={selected} onChange={setSelected} actor={actor} idPrefix={member.id} />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy || !dirty} onClick={save} className={adminPrimaryButton}>
              {busy ? 'Saving…' : 'Save roles'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false)
                setSelected(member.roleIds)
                setError('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 sm:ml-11">
          {error}
        </p>
      )}
    </li>
  )
}
