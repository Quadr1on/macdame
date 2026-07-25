import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { PageHeader, Panel, StatTile, EmptyState } from '@/components/admin/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ORDER_STATUSES, formatCurrency, formatOrderDate } from '@/lib/order-status'

export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  const [ordersResult, productsResult, customersResult] = await Promise.all([
    admin
      .from('orders')
      .select('id, order_number, created_at, total_amount, order_status, payment_status, users_profile(full_name)')
      .order('created_at', { ascending: false }),
    admin.from('products').select('id', { count: 'exact', head: true }),
    admin.from('users_profile').select('id', { count: 'exact', head: true }),
  ])

  const orders = ordersResult.data ?? []
  const paidOrders = orders.filter((order) => order.payment_status === 'paid')
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)

  const statusCounts = ORDER_STATUSES.reduce((counts, status) => {
    counts[status] = orders.filter((order) => order.order_status === status).length
    return counts
  }, {})

  // Paid for, but not yet moved past acceptance — the queue that actually needs
  // someone to do something today.
  const needsAttention = paidOrders.filter((order) =>
    ['pending', 'confirmed'].includes(order.order_status)
  )

  const recent = orders.slice(0, 10)

  return (
    <>
      <PageHeader title="Dashboard" description="Everything happening in the shop right now" />

      {ordersResult.error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load orders: {ordersResult.error.message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatTile
          label="Revenue"
          value={formatCurrency(revenue)}
          hint={`${paidOrders.length} paid order${paidOrders.length === 1 ? '' : 's'}`}
        />
        <StatTile
          label="Orders"
          value={orders.length}
          hint={`${statusCounts.delivered} delivered · ${statusCounts.cancelled} cancelled`}
        />
        <StatTile label="Products" value={productsResult.count ?? 0} hint="In the catalog" />
        <StatTile label="Customers" value={customersResult.count ?? 0} hint="Registered accounts" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Recent orders">
            {recent.length === 0 ? (
              <EmptyState>No orders yet.</EmptyState>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200">
                      <TableHead className="px-4 text-slate-500">Order</TableHead>
                      <TableHead className="text-slate-500">Customer</TableHead>
                      <TableHead className="text-slate-500">Placed</TableHead>
                      <TableHead className="text-slate-500 text-right">Total</TableHead>
                      <TableHead className="px-4 text-slate-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((order) => (
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
                        <TableCell className="text-right tabular-nums text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell className="px-4">
                          <OrderStatusBadge status={order.order_status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-t border-slate-200 px-4 py-2.5">
                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    All orders
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Needs attention"
            description="Paid orders still waiting to be packed"
          >
            {needsAttention.length === 0 ? (
              <EmptyState>Nothing waiting. All paid orders are moving.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {needsAttention.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">
                          {order.order_number}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {formatOrderDate(order.created_at)} · {formatCurrency(order.total_amount)}
                        </span>
                      </span>
                      <PaymentStatusBadge status={order.payment_status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Orders by status">
            <ul className="divide-y divide-slate-100">
              {ORDER_STATUSES.map((status) => (
                <li key={status}>
                  <Link
                    href={`/admin/orders?status=${status}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <OrderStatusBadge status={status} />
                    <span className="tabular-nums font-medium text-slate-900">
                      {statusCounts[status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  )
}
