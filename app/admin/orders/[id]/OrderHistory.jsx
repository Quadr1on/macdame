'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, StickyNote, Truck, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminPrimaryButton, adminDangerIconButton } from '@/components/admin/ui'
import { formatOrderDate, orderStatusMeta } from '@/lib/order-status'
import { NOTE_MAX_LENGTH, formatAge } from '@/lib/admin-orders'

// Private notes plus a timeline of what the team did to this order, newest
// first. "Order placed" is derived from the order's own timestamp.
export default function OrderHistory({ orderId, placedAt, events, eventsError, currentEmail, canNote = true }) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')

  const trimmed = note.trim()
  const tooLong = trimmed.length > NOTE_MAX_LENGTH

  async function addNote(event) {
    event?.preventDefault()
    if (!trimmed || tooLong || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: trimmed }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error ?? 'Could not save the note. Try again.')
        return
      }
      setNote('')
      router.refresh()
    } catch {
      setError('Network error. Your note is still here; try again.')
    } finally {
      setSaving(false)
    }
  }

  async function removeNote(eventId) {
    if (!window.confirm("Delete this note? This can't be undone.")) return
    setDeleting(eventId)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes?event=${eventId}`, { method: 'DELETE' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error ?? 'Could not delete the note.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      {canNote && (
      <form onSubmit={addNote} className="space-y-2 border-b border-slate-200 p-4">
        <label htmlFor="order_note" className="sr-only">
          Add a private note
        </label>
        <textarea
          id="order_note"
          rows={2}
          value={note}
          disabled={Boolean(eventsError)}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(e)
          }}
          placeholder={eventsError ? 'Notes are unavailable right now' : 'Add a note for the team, e.g. “Customer asked for gift wrap”'}
          className="block w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200 disabled:bg-slate-50"
        />
        <div className="flex items-center justify-between gap-3">
          <p className={`text-xs ${tooLong ? 'text-red-600' : 'text-slate-400'}`}>
            {tooLong
              ? `${trimmed.length - NOTE_MAX_LENGTH} characters over the limit`
              : 'Only admins can see notes.'}
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={!trimmed || tooLong || saving || Boolean(eventsError)}
            className={adminPrimaryButton}
          >
            {saving ? 'Saving…' : 'Add note'}
          </Button>
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </p>
        )}
      </form>
      )}
      {!canNote && error && (
        <p role="alert" className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</p>
      )}

      {eventsError && (
        <p role="alert" className="px-4 pt-4 text-sm text-red-700">
          Could not load the order history: {eventsError}
        </p>
      )}

      <ol className="px-4 py-3">
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            event={event}
            mine={Boolean(currentEmail) && event.actor_email === currentEmail}
            canDelete={canNote}
            deleting={deleting === event.id}
            onDelete={() => removeNote(event.id)}
          />
        ))}
        <TimelineItem event={{ kind: 'placed', created_at: placedAt }} last />
      </ol>
    </div>
  )
}

const ICONS = {
  status: ArrowRightLeft,
  tracking: Truck,
  note: StickyNote,
  placed: ShoppingBag,
}

function describe(event) {
  const label = (status) => orderStatusMeta(status).label
  switch (event.kind) {
    case 'status':
      return (
        <>
          Status changed from <strong className="font-medium text-slate-900">{label(event.from_value)}</strong> to{' '}
          <strong className="font-medium text-slate-900">{label(event.to_value)}</strong>
        </>
      )
    case 'tracking':
      if (!event.from_value) {
        return (
          <>
            Tracking ID set to <span className="font-mono text-xs text-slate-900">{event.to_value}</span>
          </>
        )
      }
      if (!event.to_value) {
        return (
          <>
            Tracking ID removed (was <span className="font-mono text-xs">{event.from_value}</span>)
          </>
        )
      }
      return (
        <>
          Tracking ID changed from <span className="font-mono text-xs">{event.from_value}</span> to{' '}
          <span className="font-mono text-xs text-slate-900">{event.to_value}</span>
        </>
      )
    case 'placed':
      return <span className="font-medium text-slate-900">Order placed</span>
    default:
      return null
  }
}

function TimelineItem({ event, mine, canDelete, deleting, onDelete, last }) {
  const Icon = ICONS[event.kind] ?? StickyNote
  const when = (
    <time suppressHydrationWarning dateTime={event.created_at} title={formatOrderDate(event.created_at, { withTime: true })}>
      {formatAge(event.created_at)}
    </time>
  )

  return (
    <li className="relative flex gap-3 pb-4 last:pb-1">
      {!last && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-200" aria-hidden="true" />}
      <span
        className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
          event.kind === 'note' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        {event.kind === 'note' ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{event.note}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{describe(event)}</p>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          {event.kind !== 'placed' && (
            <>
              <span className="truncate">{mine ? 'You' : event.actor_email || 'Unknown admin'}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          {when}
          {mine && canDelete && event.kind === 'note' && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className={`ml-auto ${adminDangerIconButton} p-1`}
              aria-label="Delete this note"
              title="Delete this note"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
