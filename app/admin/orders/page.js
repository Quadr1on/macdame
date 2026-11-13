import Link from 'next/link'
import { Search, X, ChevronRight, Clock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { PageHeader, Panel, EmptyState } from '@/components/admin/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatCurrency,
  formatOrderDate,
  orderStatusMeta,
  paymentStatusMeta,
} from '@/lib/order-status'
import { ORDER_VIEWS, cleanSearchTerm, findOrderView, formatAge, orderAge } from '@/lib/admin-orders'

// Everything that shapes the list lives in the URL — tab, search, and the
// status/payment/customer filters other pages link to — so a filtered view is
// shareable and the back button behaves.
function hrefWith(current, changes) {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (value) next.set(key, value)
  }
  if (next.get('view') === 'all') next.delete('view')
  const qs = next.toString()
  return qs ? `/admin/orders?${qs}` : '/admin/orders'
}

/** Customer ids whose name, phone or email contains `term`. */
async function matchingCustomerIds(admin, term) {
  const [profiles, auth] = await Promise.all([
    admin.from('users_profile').select('id').or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`),
    // Emails live on auth.users only, reachable through the admin auth API.
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])
  const ids = new Set((profiles.data ?? []).map((row) => row.id))
  const lower = term.toLowerCase()
  for (const user of auth.data?.users ?? []) {
    if (user.email?.toLowerCase().includes(lower)) ids.add(user.id)
  }
  return [...ids]
}

export default async function AdminOrdersPage({ searchParams }) {
  const params = await searchParams
  const view = findOrderView(params?.view)
  const status = ORDER_STATUSES.includes(params?.status) ? params.status : null
  const payment = PAYMENT_STATUSES.includes(params?.payment) ? params.payment : null
  const customer = typeof params?.customer === 'string' ? params.customer : null
  const q = cleanSearchTerm(params?.q)

  const current = { view: view.key, q, status, payment, customer }
  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select('*, users_profile(full_name, phone), order_items(id, quantity)')
    .order('created_at', { ascending: false })

  if (customer) query = query.eq('user_id', customer)
  if (q) {
    const ids = await matchingCustomerIds(admin, q)
    const clauses = [`order_number.ilike.%${q}%`]
    if (ids.length > 0) clauses.push(`user_id.in.(${ids.join(',')})`)
    query = query.or(clauses.join(','))
  }

  const { data, error } = await query
  // Search and customer narrow the whole set; tabs and the status/payment
  // filters are applied here so every tab can show its own count.
  const base = data ?? []
  const filtered = base.filter(
    (order) =>
      (!status || order.order_status === status) && (!payment || order.payment_status === payment)
  )
  const counts = Object.fromEntries(
    ORDER_VIEWS.map((v) => [v.key, filtered.filter(v.match).length])
  )
  const orders = filtered.filter(view.match)
  const now = new Date()

  const chips = [
    status && { key: 'status', label: `Status: ${orderStatusMeta(status).label}` },
    payment && { key: 'payment', label: paymentStatusMeta(payment).label },
    customer && {
      key: 'customer',
      label: `Customer: ${base[0]?.users_profile?.full_name || 'selected customer'}`,
    },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          error
            ? 'Could not load orders'
            : view.hint ?? `${orders.length} order${orders.length === 1 ? '' : 's'}`
        }
      />

      {/* Plain GET form: search works before (and without) JavaScript. */}
      <form action="/admin/orders" className="mb-4 flex gap-2" role="search">
        {view.key !== 'all' && <input type="hidden" name="view" value={view.key} />}
        {customer && <input type="hidden" name="customer" value={customer} />}
        {status && <input type="hidden" name="status" value={status} />}
        {payment && <input type="hidden" name="payment" value={payment} />}
        <label className="relative flex-1 max-w-md">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order no., name, phone, email"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </label>
        <button
          type="submit"
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          Search
        </button>
      </form>

      <nav aria-label="Order views" className="-mx-4 mb-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-slate-200">
          {ORDER_VIEWS.map((v) => {
            const selected = v.key === view.key
            return (
              <li key={v.key}>
                <Link
                  href={hrefWith(current, { view: v.key })}
                  aria-current={selected ? 'page' : undefined}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap outline-none focus-visible:bg-slate-100 ${
                    selected
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {v.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      selected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {error ? '–' : counts[v.key]}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {(chips.length > 0 || q) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {q && (
            <FilterChip href={hrefWith(current, { q: null })}>Search: &ldquo;{q}&rdquo;</FilterChip>
          )}
          {chips.map((chip) => (
            <FilterChip key={chip.key} href={hrefWith(current, { [chip.key]: null })}>
              {chip.label}
            </FilterChip>
          ))}
        </div>
      )}

      <Panel>
        {error ? (
          <p role="alert" className="px-4 py-10 text-center text-sm text-red-700">
            Failed to load orders: {error.message}
          </p>
        ) : orders.length === 0 ? (
          <EmptyState>
            {base.length === 0 && !q && !customer
              ? 'No orders yet. They will appear here as soon as someone checks out.'
              : `No orders ${q ? `match “${q}”` : 'here'}${view.key !== 'all' ? ` in ${view.label}` : ''}.`}
          </EmptyState>
        ) : (
          <>
            {/* Phones: one card per order instead of a sideways-scrolling table. */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {orders.map((order) => {
                const age = orderAge(order, now)
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 outline-none focus-visible:bg-slate-100"
                    >
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">{order.order_number}</span>
                          <span className="tabular-nums font-medium text-slate-900">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </span>
                        <span className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="truncate">{order.users_profile?.full_name || '—'}</span>
                          <AgeLabel order={order} age={age} now={now} />
                        </span>
                        <span className="flex flex-wrap gap-1.5 pt-0.5">
                          <OrderStatusBadge status={order.order_status} />
                          <PaymentStatusBadge status={order.payment_status} />
                        </span>
                      </span>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="px-4 text-slate-500">Order</TableHead>
                    <TableHead className="text-slate-500">Customer</TableHead>
                    <TableHead className="text-slate-500">Placed</TableHead>
                    <TableHead className="text-slate-500 text-right">Items</TableHead>
                    <TableHead className="text-slate-500 text-right">Total</TableHead>
                    <TableHead className="text-slate-500">Payment</TableHead>
                    <TableHead className="px-4 text-slate-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const itemCount = (order.order_items ?? []).reduce((sum, i) => sum + i.quantity, 0)
                    const age = orderAge(order, now)
                    return (
                      // The order-number link stretches over the whole row, so
                      // a click anywhere opens the order while keyboard users
                      // still get one tab stop per row.
                      <TableRow
                        key={order.id}
                        className="relative border-slate-100 hover:bg-slate-50 focus-within:bg-slate-100"
                      >
                        <TableCell className="px-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-slate-900 outline-none after:absolute after:inset-0 after:content-['']"
                          >
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {order.users_profile?.full_name || '—'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <span className="block">{formatOrderDate(order.created_at)}</span>
                          <AgeLabel order={order} age={age} now={now} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-600">{itemCount}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.payment_status} />
                        </TableCell>
                        <TableCell className="px-4">
                          <OrderStatusBadge status={order.order_status} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Panel>
    </>
  )
}

function AgeLabel({ order, age, now }) {
  if (age.overdue) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"
        title="Paid and still waiting to be packed after a day"
      >
        <Clock className="h-3 w-3" aria-hidden="true" />
        Waiting {formatAge(order.created_at, now).replace(' ago', '')}
      </span>
    )
  }
  // Past two weeks formatAge falls back to a date, which the row already shows.
  if (age.hours >= 14 * 24) return null
  return <span className="text-xs text-slate-400">{formatAge(order.created_at, now)}</span>
}

function FilterChip({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-2 text-xs font-medium text-slate-700 hover:border-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
    >
      {children}
      <X className="h-3 w-3 text-slate-400" aria-label="Remove filter" />
    </Link>
  )
}
