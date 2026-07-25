import Link from 'next/link'
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

// Filters live in the URL rather than client state so a filtered view is
// shareable and the back button behaves.
function FilterPills({ label, options, active, paramKey, searchParams }) {
  const hrefFor = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(paramKey, value)
    else next.delete(paramKey)
    const qs = next.toString()
    return qs ? `/admin/orders?${qs}` : '/admin/orders'
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mr-1">
        {label}
      </span>
      {[{ value: '', label: 'All' }, ...options].map((option) => {
        const selected = (active ?? '') === option.value
        return (
          <Link
            key={option.value || 'all'}
            href={hrefFor(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selected
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}

export default async function AdminOrdersPage({ searchParams }) {
  const params = await searchParams
  const status = ORDER_STATUSES.includes(params?.status) ? params.status : null
  const payment = PAYMENT_STATUSES.includes(params?.payment) ? params.payment : null
  const customer = params?.customer ?? null

  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select('*, users_profile(full_name), order_items(id, quantity)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('order_status', status)
  if (payment) query = query.eq('payment_status', payment)
  if (customer) query = query.eq('user_id', customer)

  const { data: orders, error } = await query

  const activeParams = Object.fromEntries(
    Object.entries({ status, payment, customer }).filter(([, v]) => v)
  )

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          error
            ? 'Could not load orders'
            : `${orders.length} order${orders.length === 1 ? '' : 's'}${customer ? ' from this customer' : ''}`
        }
      >
        {customer && (
          <Link
            href="/admin/orders"
            className="text-sm text-slate-500 hover:text-slate-900 underline"
          >
            Clear customer filter
          </Link>
        )}
      </PageHeader>

      <div className="space-y-3 mb-5">
        <FilterPills
          label="Status"
          paramKey="status"
          active={status}
          searchParams={activeParams}
          options={ORDER_STATUSES.map((value) => ({ value, label: orderStatusMeta(value).label }))}
        />
        <FilterPills
          label="Payment"
          paramKey="payment"
          active={payment}
          searchParams={activeParams}
          options={PAYMENT_STATUSES.map((value) => ({
            value,
            label: paymentStatusMeta(value).label,
          }))}
        />
      </div>

      <Panel>
        {error ? (
          <EmptyState>Failed to load orders: {error.message}</EmptyState>
        ) : orders.length === 0 ? (
          <EmptyState>No orders match these filters.</EmptyState>
        ) : (
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
                return (
                  <TableRow key={order.id} className="border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {order.users_profile?.full_name || '—'}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatOrderDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">
                      {itemCount}
                    </TableCell>
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
        )}
      </Panel>
    </>
  )
}
