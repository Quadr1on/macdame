// Pure helpers that turn raw order / item / variant rows into the numbers the
// admin dashboard shows. Kept free of Supabase and React so they are easy to
// reason about and every one of them copes with empty input — the shop can
// legitimately have no orders or no products at all.
//
// Revenue rule, shared with the rest of the admin: an order counts as revenue
// when payment_status is 'paid', dated by when it was placed (created_at).

// The shop trades in India, so "today" and the daily chart buckets follow IST
// regardless of which timezone the server happens to run in.
export const SHOP_TIME_ZONE = 'Asia/Kolkata'

export const LOW_STOCK_THRESHOLD = 3

const DAY_MS = 24 * 60 * 60 * 1000

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "2026-11-13" for the shop-local calendar day containing `date`. */
export function shopDayKey(date) {
  return dayKeyFormatter.format(date)
}

/**
 * The last `days` shop-local calendar days, oldest first, ending today.
 * Stepping back in whole days from noon-ish UTC keeps clear of DST edges
 * (IST has none, but the server might).
 */
export function lastShopDays(days, now = new Date()) {
  const keys = []
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(shopDayKey(new Date(now.getTime() - i * DAY_MS)))
  }
  return keys
}

const isPaid = (order) => order.payment_status === 'paid'
const amountOf = (order) => {
  const value = Number(order.total_amount)
  return Number.isFinite(value) ? value : 0
}

function sumRevenue(orders) {
  return orders.reduce((sum, order) => sum + amountOf(order), 0)
}

/**
 * Paid revenue and order count for a window of `days` shop-local days ending
 * today, plus the same figures for the window immediately before it.
 */
export function revenueWindow(orders, days, now = new Date()) {
  const keys = lastShopDays(days * 2, now)
  const previousKeys = new Set(keys.slice(0, days))
  const currentKeys = new Set(keys.slice(days))

  const paid = orders.filter(isPaid)
  const current = paid.filter((order) => currentKeys.has(shopDayKey(new Date(order.created_at))))
  const previous = paid.filter((order) => previousKeys.has(shopDayKey(new Date(order.created_at))))

  return {
    days,
    revenue: sumRevenue(current),
    orders: current.length,
    previousRevenue: sumRevenue(previous),
    previousOrders: previous.length,
  }
}

/**
 * Percentage change from `previous` to `current`, or null when there is no
 * meaningful base to compare against (previous period had nothing).
 */
export function percentChange(current, previous) {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

/** One bucket per shop-local day for the last `days` days, oldest first. */
export function dailyRevenue(orders, days, now = new Date()) {
  const buckets = new Map(lastShopDays(days, now).map((key) => [key, { day: key, revenue: 0, orders: 0 }]))

  for (const order of orders) {
    if (!isPaid(order)) continue
    const bucket = buckets.get(shopDayKey(new Date(order.created_at)))
    if (!bucket) continue
    bucket.revenue += amountOf(order)
    bucket.orders += 1
  }

  return [...buckets.values()]
}

/** Count and amount for each payment status, in PAYMENT_STATUSES order. */
export function paymentBreakdown(orders, statuses) {
  return statuses.map((status) => {
    const matching = orders.filter((order) => order.payment_status === status)
    return { status, count: matching.length, amount: sumRevenue(matching) }
  })
}

export function averageOrderValue(orders) {
  const paid = orders.filter(isPaid)
  return paid.length === 0 ? null : sumRevenue(paid) / paid.length
}

/**
 * Best sellers from paid order items. Items are grouped by the product their
 * variant belongs to; items whose variant has since been deleted fall back to
 * the product name captured on the order, so history is not lost.
 */
export function topProducts(items, limit = 5) {
  const groups = new Map()

  for (const item of items) {
    const productId = item.product_variants?.product_id ?? null
    const key = productId ? `id:${productId}` : `name:${item.product_name}`
    const quantity = Number(item.quantity) || 0
    const price = Number(item.price) || 0

    const group = groups.get(key) ?? {
      key,
      productId,
      name: item.product_name || 'Unnamed product',
      units: 0,
      revenue: 0,
    }
    group.units += quantity
    group.revenue += quantity * price
    groups.set(key, group)
  }

  return [...groups.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit)
}

/** Shortens "2026-11-13" to "13 Nov" for chart labels. */
export function formatShopDay(key, options = { day: 'numeric', month: 'short' }) {
  // Noon UTC on that date is the same calendar day in IST, so formatting it in
  // the shop timezone cannot roll it into a neighbouring day.
  return new Date(`${key}T12:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: SHOP_TIME_ZONE,
    ...options,
  })
}
