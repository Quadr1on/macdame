'use client'
import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Panel } from '@/components/admin/ui'
import { formatAge } from '@/lib/admin-orders'
import MembersTab from './MembersTab'
import RolesTab from './RolesTab'

export default function AccessManager({ initialTab, roles, members, owners, events, eventsError, viewer }) {
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState(initialTab)
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? null)

  // The same shape lib/admin-permissions.js expects for its rules.
  const actor = useMemo(
    () => ({
      isOwner: viewer.isOwner,
      permissions: viewer.permissions,
      position: viewer.isOwner ? Infinity : viewer.position ?? -Infinity,
    }),
    [viewer]
  )

  function switchTab(next) {
    setTab(next)
    // Keep the tab in the URL so a refresh or a shared link lands on it.
    router.replace(next === 'roles' ? `${pathname}?tab=roles` : pathname, { scroll: false })
  }

  const tabs = [
    { key: 'members', label: 'Members', count: owners.length + members.length },
    { key: 'roles', label: 'Roles', count: roles.length },
  ]

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Access sections" className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => switchTab(t.key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium outline-none focus-visible:bg-slate-100 ${
              tab === t.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                tab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'members' ? (
          <MembersTab roles={roles} members={members} owners={owners} actor={actor} viewerEmail={viewer.email} />
        ) : (
          // Keyed on the saved roles so the editor's local drafts reset after
          // each save; the selected role lives here so it survives that.
          <RolesTab
            key={roles.map((r) => `${r.id}:${r.position}:${r.name}:${r.color}:${r.permissions.join('.')}`).join('|')}
            roles={roles}
            members={members}
            actor={actor}
            selectedId={selectedRoleId}
            onSelect={setSelectedRoleId}
          />
        )}
      </div>

      <Panel title="Recent access changes">
        {eventsError ? (
          <p role="alert" className="px-4 py-6 text-center text-sm text-red-700">
            Could not load the access log: {eventsError}
          </p>
        ) : events.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No changes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((event) => (
              <li key={event.id} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="text-sm text-slate-700">{event.summary}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {event.actor_email === viewer.email ? 'You' : event.actor_email ?? 'Unknown'} ·{' '}
                  <time suppressHydrationWarning dateTime={event.created_at}>
                    {formatAge(event.created_at)}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
