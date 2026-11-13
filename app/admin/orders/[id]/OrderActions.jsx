'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, Check, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminPrimaryButton } from '@/components/admin/ui'
import { FULFILMENT_STEPS, ORDER_STATUSES, orderStatusMeta } from '@/lib/order-status'
import { nextOrderStep } from '@/lib/admin-orders'

// Fulfilment controls for one order. The forward path is a single button for
// the next step, so the everyday flow can't accidentally jump backwards;
// cancelling and correcting a mistake are kept apart from it.
export default function OrderActions({ order }) {
  const router = useRouter()
  const status = order.order_status
  const step = nextOrderStep(status)
  const paid = order.payment_status === 'paid'
  const cod = order.payment_method === 'cod'

  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [correction, setCorrection] = useState(status)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function update(changes, label) {
    setBusy(label)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error ?? 'Could not update the order. Try again.')
        return
      }
      // The order saved even if its history entry didn't; say so rather than fail.
      if (payload.historyError) setError(payload.historyError)
      else setNotice('Saved')
      setConfirmingCancel(false)
      // Re-render the server component so badges and buttons reflect the change.
      router.refresh()
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }

  const trackingDirty = (tracking ?? '').trim() !== (order.tracking_number ?? '')
  const showTracking = ['processing', 'shipped', 'delivered'].includes(status)
  const stepIndex = FULFILMENT_STEPS.indexOf(status)

  return (
    <div className="p-4 space-y-5">
      {/* Where the order is on its way to the customer. */}
      {status === 'cancelled' ? (
        <p className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
          This order was cancelled.
        </p>
      ) : (
        <ol className="flex items-center gap-1" aria-label="Fulfilment progress">
          {FULFILMENT_STEPS.map((s, i) => (
            <li key={s} className="flex-1" title={orderStatusMeta(s).label}>
              <span
                className={`block h-1.5 rounded-full ${i <= stepIndex ? 'bg-slate-900' : 'bg-slate-200'}`}
              />
              <span className="sr-only">
                {orderStatusMeta(s).label}
                {i < stepIndex ? ' (done)' : i === stepIndex ? ' (current)' : ''}
              </span>
            </li>
          ))}
        </ol>
      )}
      {status !== 'cancelled' && (
        <p className="-mt-3 text-xs text-slate-500">
          <span className="font-medium text-slate-900">{orderStatusMeta(status).label}</span>
          {' · '}
          {orderStatusMeta(status).description}
        </p>
      )}

      {step && (
        <div className="space-y-3">
          {status === 'pending' && !paid && !cod && (
            <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              The online payment has not come through. Only confirm if you have been paid another way.
            </p>
          )}
          {step.needsTracking && (
            <div className="space-y-1.5">
              <Label htmlFor="ship_tracking">Tracking ID</Label>
              <Input
                id="ship_tracking"
                value={tracking}
                onChange={(event) => setTracking(event.target.value)}
                placeholder="e.g. BLUEDART1234567890"
              />
              <p className="text-xs text-slate-500">
                Optional. Without one the customer sees &ldquo;To be decided&rdquo;.
              </p>
            </div>
          )}
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              update(
                step.needsTracking
                  ? { order_status: step.to, tracking_number: tracking }
                  : { order_status: step.to },
                'step'
              )
            }
            className={`w-full ${adminPrimaryButton}`}
          >
            {busy === 'step' ? 'Saving…' : step.label}
            {busy !== 'step' && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      )}

      {showTracking && !step?.needsTracking && (
        <form
          className="space-y-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            update({ tracking_number: tracking }, 'tracking')
          }}
        >
          <Label htmlFor="tracking_number">Tracking ID</Label>
          <div className="flex gap-2">
            <Input
              id="tracking_number"
              value={tracking}
              onChange={(event) => setTracking(event.target.value)}
              placeholder="e.g. BLUEDART1234567890"
            />
            <Button type="submit" variant="outline" disabled={busy !== null || !trackingDirty}>
              {busy === 'tracking' ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {notice}
        </p>
      )}

      {!['delivered', 'cancelled'].includes(status) && (
        <div className="border-t border-slate-100 pt-4">
          {confirmingCancel ? (
            <div className="space-y-3 rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-medium text-rose-900">Cancel this order?</p>
              {paid && (
                <p className="text-xs text-rose-800">
                  This only changes the status the customer sees. It does <strong>not</strong> refund
                  the payment. Refund it in the Razorpay dashboard.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => update({ order_status: 'cancelled' }, 'cancel')}
                  className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-400"
                >
                  {busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel order'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmingCancel(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="text-sm font-medium text-rose-700 hover:text-rose-900 rounded outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Cancel order…
            </button>
          )}
        </div>
      )}

      {/* Escape hatch for mistakes, e.g. marked delivered too early. */}
      <details className="group border-t border-slate-100 pt-4">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-900 rounded outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
          Correct the status manually
        </summary>
        <div className="mt-3 space-y-2">
          <Label htmlFor="order_status" className="sr-only">
            Order status
          </Label>
          <div className="flex gap-2">
            <Select value={correction} onValueChange={setCorrection}>
              <SelectTrigger id="order_status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {orderStatusMeta(value).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null || correction === status}
              onClick={() => update({ order_status: correction }, 'correct')}
            >
              {busy === 'correct' ? 'Saving…' : 'Set'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">Use this only to fix a mistake. The customer sees the new status.</p>
        </div>
      </details>
    </div>
  )
}
