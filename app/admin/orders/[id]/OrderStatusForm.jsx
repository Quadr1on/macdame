'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { AlertTriangle, Check } from 'lucide-react'
import { ORDER_STATUSES, orderStatusMeta } from '@/lib/order-status'

export default function OrderStatusForm({ orderId, initialStatus, initialTracking }) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [tracking, setTracking] = useState(initialTracking ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty = status !== initialStatus || (tracking ?? '') !== (initialTracking ?? '')

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: status, tracking_number: tracking }),
    })

    const payload = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(payload.error ?? 'Failed to update the order')
      return
    }

    setSaved(true)
    // Re-render the server component so the badges above reflect the new state.
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="order_status">Order status</Label>
        <Select value={status} onValueChange={(value) => { setStatus(value); setSaved(false) }}>
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
        <p className="text-xs text-slate-500">{orderStatusMeta(status).description}</p>
      </div>

      {status === 'cancelled' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Cancelling here only changes the status the customer sees. It does{' '}
            <strong>not</strong> issue a Razorpay refund — refund the payment manually in the
            Razorpay dashboard if money was taken.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tracking_number">Tracking ID</Label>
        <Input
          id="tracking_number"
          value={tracking}
          onChange={(event) => { setTracking(event.target.value); setSaved(false) }}
          placeholder="e.g. BLUEDART1234567890"
        />
        <p className="text-xs text-slate-500">
          Leave blank and the customer sees &ldquo;To be decided&rdquo; on their order page.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !dirty} className="bg-slate-900 hover:bg-slate-800">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && !dirty && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
