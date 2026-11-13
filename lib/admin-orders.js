// Admin-side order helpers: the workflow tabs on the orders list, the
// next-step actions on an order, and small formatting bits. The raw status
// vocabulary itself lives in lib/order-status.js.

const isCod = (order) => order.payment_method === 'cod'
const isPaidOrCod = (order) => order.payment_status === 'paid' || isCod(order)

/**
 * Tabs on the orders list, in the order a parcel moves through them. Each one
 * is a predicate rather than a single status because "what needs doing" cuts
 * across both columns: a pending order is work only once it has been paid for
 * (or is cash on delivery), and an unpaid one is a payment problem instead.
 */
export const ORDER_VIEWS = [
  { key: 'all', label: 'All', match: () => true },
  {
    key: 'to_pack',
    label: 'To pack',
    hint: 'Paid (or cash on delivery) and not yet being packed',
    match: (o) => ['pending', 'confirmed'].includes(o.order_status) && isPaidOrCod(o),
  },
  { key: 'to_ship', label: 'To ship', hint: 'Packed, waiting for the courier', match: (o) => o.order_status === 'processing' },
  { key: 'in_transit', label: 'In transit', hint: 'Shipped, not yet delivered', match: (o) => o.order_status === 'shipped' },
  {
    key: 'unpaid',
    label: 'Unpaid',
    hint: 'Online payment pending or failed',
    match: (o) => !isCod(o) && o.payment_status !== 'paid' && o.order_status !== 'cancelled',
  },
  { key: 'done', label: 'Delivered', match: (o) => o.order_status === 'delivered' },
  { key: 'cancelled', label: 'Cancelled', match: (o) => o.order_status === 'cancelled' },
]

export function findOrderView(key) {
  return ORDER_VIEWS.find((view) => view.key === key) ?? ORDER_VIEWS[0]
}

/**
 * The single forward step for an order in a given status, or null when it has
 * reached the end of the line. `needsTracking` asks the UI to collect a
 * tracking ID alongside the move.
 */
const NEXT_STEPS = {
  pending: { to: 'confirmed', label: 'Confirm order' },
  confirmed: { to: 'processing', label: 'Start packing' },
  processing: { to: 'shipped', label: 'Mark as shipped', needsTracking: true },
  shipped: { to: 'delivered', label: 'Mark as delivered' },
}

export function nextOrderStep(status) {
  return NEXT_STEPS[status] ?? null
}

/**
 * Hours an order has been sitting since it was placed, and whether that is
 * long enough to flag: a paid order still waiting to be packed after a day.
 */
export function orderAge(order, now = new Date()) {
  const placed = new Date(order.created_at)
  const hours = (now.getTime() - placed.getTime()) / 36e5
  const waiting = findOrderView('to_pack').match(order)
  return { hours, overdue: waiting && hours >= 24 }
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function formatAge(iso, now = new Date()) {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return '—'
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Strips characters that carry meaning in a PostgREST filter string
 * (commas, brackets, wildcards, quotes) so a search box can't break or widen
 * the query, then caps the length.
 */
export function cleanSearchTerm(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[,()*%\\"':]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

/** Digits for wa.me / tel: links, assuming an Indian number when there is no country code. */
export function phoneDigits(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return digits.length >= 10 ? digits : null
}

export function formatAddress(address) {
  if (!address) return ''
  return [
    address.full_name,
    address.phone,
    [address.address_line1, address.address_line2].filter(Boolean).join(', '),
    `${address.city}, ${address.state} - ${address.pincode}`,
  ]
    .filter(Boolean)
    .join('\n')
}
