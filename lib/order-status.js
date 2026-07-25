// Single source of truth for order/payment status vocabulary, shared by the
// customer-facing order pages and the admin dashboard so the two can't drift.
//
// These string values mirror the CHECK constraints on public.orders exactly —
// order_status in (pending, confirmed, processing, shipped, delivered, cancelled)
// and payment_status in (pending, paid, failed). Any value not in these lists
// is rejected by Postgres, so the admin PATCH route validates against them.

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed']

// The happy path a parcel walks, in order. 'cancelled' is deliberately absent:
// it's a terminal branch off the timeline, not a step along it, so the UI swaps
// the stepper for a cancelled notice instead of trying to place it.
export const FULFILMENT_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const ORDER_STATUS_META = {
  pending: {
    label: 'Pending',
    description: 'Waiting for payment to complete',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Payment received, order accepted',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  processing: {
    label: 'Processing',
    description: 'Being packed for dispatch',
    badgeClass: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  },
  shipped: {
    label: 'Shipped',
    description: 'On its way to you',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  delivered: {
    label: 'Delivered',
    description: 'Handed over successfully',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order was cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
}

const PAYMENT_STATUS_META = {
  pending: { label: 'Payment pending', badgeClass: 'bg-amber-50 text-amber-700 ring-amber-200' },
  paid: { label: 'Paid', badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  failed: { label: 'Payment failed', badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

const UNKNOWN = {
  label: 'Unknown',
  description: '',
  badgeClass: 'bg-gray-100 text-gray-600 ring-gray-200',
}

export function orderStatusMeta(status) {
  return ORDER_STATUS_META[status] ?? { ...UNKNOWN, label: status ?? 'Unknown' }
}

export function paymentStatusMeta(status) {
  return PAYMENT_STATUS_META[status] ?? { ...UNKNOWN, label: status ?? 'Unknown' }
}

export function isValidOrderStatus(status) {
  return ORDER_STATUSES.includes(status)
}

/** Index of `status` within FULFILMENT_STEPS, or -1 for cancelled/unknown. */
export function fulfilmentStepIndex(status) {
  return FULFILMENT_STEPS.indexOf(status)
}

export function formatOrderDate(iso, { withTime = false } = {}) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  })
}

export function formatCurrency(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '₹0'

  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  })
}

/** Turns a variant_details jsonb blob into "Red · M" for display. */
export function formatVariantDetails(details) {
  if (!details) return null
  const parts = [details.color, details.size].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}
