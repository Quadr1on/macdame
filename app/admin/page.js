import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import { can, firstAllowedSection } from '@/lib/admin-permissions'
import Link from 'next/link'
import { AlertCircle, ArrowRight, PackageX, PackageMinus, EyeOff } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { PageHeader, Panel, StatTile, EmptyState, NoAccess } from '@/components/admin/ui'
import RevenueChart from '@/components/admin/RevenueChart'
import DashboardSkeleton from '@/components/admin/DashboardSkeleton'
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
} from '@/lib/order-status'
import {
  LOW_STOCK_THRESHOLD,
  averageOrderValue,
  dailyRevenue,
  lastShopDays,
  paymentBreakdown,
  percentChange,
  revenueWindow,
  shopDayKey,
  topProducts,
} from '@/lib/admin-metrics'

const DAY_MS = 24 * 60 * 60 * 1000

// The header paints straight away; the data-heavy body streams in behind a
// skeleton so the admin never stares at a blank page while Supabase answers.
export default async function AdminDashboardPage() {
  // /admin is where everyone lands after sign-in; send people without the
  // dashboard to the first section they can use instead of a dead end.
  const { access } = await getAdminUser()
  if (!can(access, 'dashboard.view')) {
    const section = firstAllowedSection(access.permissions)
    if (section && section.href !== '/admin') redirect(section.href)
    return <NoAccess what="the dashboard" />
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Everything happening in the shop right now" />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  )
}

async function DashboardContent() {
  const admin = createAdminClient()
  const now = new Date()
  // A day of slack either side of the 30-day window; exact IST-day filtering
  // happens in JS so the window matches the chart buckets precisely.
  const itemsSince = new Date(now.getTime() - 31 * DAY_MS).toISOString()

  const [ordersResult, itemsResult, productsResult, customersResult] = await Promise.all([
    admin
      .from('orders')
      .select('id, order_number, created_at, total_amount, order_status, payment_status, users_profile(full_name)')
      .order('created_at', { ascending: false }),
    admin
      .from('order_items')
      .select('product_name, price, quantity, product_variants(product_id), orders!inner(payment_status, created_at)')
      .eq('orders.payment_status', 'paid')
      .gte('orders.created_at', itemsSince),
    admin
      .from('products')
      .select('id, name, is_active, product_variants(id, color, size, stock_quantity)')
      .order('name'),
    admin
      .from('users_profile')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false }),
  ])

  const ordersError = ordersResult.error
  const orders = ordersResult.data ?? []
  const paidOrders = orders.filter((order) => order.payment_status === 'paid')

  // --- Revenue -------------------------------------------------------------
  const today = revenueWindow(orders, 1, now)
  const week = revenueWindow(orders, 7, now)
  const month = revenueWindow(orders, 30, now)
  const chartDays = dailyRevenue(orders, 30, now)
  const allTimeRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

  const monthKeys = new Set(lastShopDays(30, now))
  const inMonth = (iso) => monthKeys.has(shopDayKey(new Date(iso)))
  const ordersThisMonth = orders.filter((order) => inMonth(order.created_at))
  const aovMonth = averageOrderValue(ordersThisMonth)
  const aovAllTime = averageOrderValue(orders)

  // --- Orders --------------------------------------------------------------
  const statusCounts = ORDER_STATUSES.reduce((counts, status) => {
    counts[status] = orders.filter((order) => order.order_status === status).length
    return counts
  }, {})
  // Paid for, but not yet moved past acceptance — the queue that actually needs
  // someone to do something today.
  const needsAttention = paidOrders.filter((order) =>
    ['pending', 'confirmed'].includes(order.order_status)
  )
  const payments = paymentBreakdown(orders, PAYMENT_STATUSES)
  const recent = orders.slice(0, 8)

  // --- Products ------------------------------------------------------------
  const items = (itemsResult.data ?? []).filter((item) => item.orders && inMonth(item.orders.created_at))
  const best = topProducts(items, 5)

  const products = productsResult.data ?? []
  const activeProducts = products.filter((product) => product.is_active)
  const inactiveProducts = products.filter((product) => !product.is_active)
  const variantsOf = (product) =>
    (product.product_variants ?? []).map((variant) => ({ ...variant, product }))
  // Only active products matter for stock alerts: a hidden product being out
  // of stock is not something a customer can run into.
  const activeVariants = activeProducts.flatMap(variantsOf)
  const outOfStock = activeVariants.filter((v) => (v.stock_quantity ?? 0) <= 0)
  const lowStock = activeVariants
    .filter((v) => v.stock_quantity > 0 && v.stock_quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)

  // --- Customers -----------------------------------------------------------
  const customers = customersResult.data ?? []
  const newCustomers = customers.filter((profile) => inMonth(profile.created_at))
  const newestCustomers = customers.slice(0, 5)

  const dash = '—'

  return (
    <>
      {ordersError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Could not load orders, so revenue and order figures are unavailable: {ordersError.message}
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
        <StatTile
          label="Revenue · 30 days"
          value={ordersError ? dash : formatCurrency(month.revenue)}
          hint={ordersError ? 'Unavailable' : <ChangeHint current={month.revenue} previous={month.previousRevenue} period="the previous 30 days" />}
        />
        <StatTile
          label="Orders · 30 days"
          value={ordersError ? dash : ordersThisMonth.length}
          hint={ordersError ? 'Unavailable' : `${month.orders} paid · ${orders.length} all time`}
        />
        <StatTile
          label="Avg order value"
          value={ordersError || aovMonth === null ? dash : formatCurrency(Math.round(aovMonth))}
          hint={
            ordersError
              ? 'Unavailable'
              : aovMonth === null
                ? 'No paid orders in 30 days'
                : `Last 30 days${aovAllTime !== null ? ` · ${formatCurrency(Math.round(aovAllTime))} all time` : ''}`
          }
        />
        <StatTile
          label="New customers · 30 days"
          value={customersResult.error ? dash : newCustomers.length}
          hint={customersResult.error ? 'Unavailable' : `${customers.length} account${customers.length === 1 ? '' : 's'} in total`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <Panel title="Revenue" description="Paid orders, by the day they were placed (India time)">
            {ordersError ? (
              <PanelError what="revenue" error={ordersError} />
            ) : (
              <div className="p-4 space-y-5">
                <dl className="grid grid-cols-3 gap-3 sm:gap-6">
                  <RevenueFigure label="Today" window={today} period="yesterday" />
                  <RevenueFigure label="Last 7 days" window={week} period="the previous 7 days" />
                  <RevenueFigure label="Last 30 days" window={month} period="the previous 30 days" />
                </dl>
                <RevenueChart days={chartDays} />
                <p className="text-xs text-slate-500">
                  All time: <span className="font-medium text-slate-700 tabular-nums">{formatCurrency(allTimeRevenue)}</span>{' '}
                  from {paidOrders.length} paid order{paidOrders.length === 1 ? '' : 's'}
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Recent orders">
            {ordersError ? (
              <PanelError what="orders" error={ordersError} />
            ) : recent.length === 0 ? (
              <EmptyState>No orders yet. They will appear here as soon as someone checks out.</EmptyState>
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
                          {order.users_profile?.full_name || dash}
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
                <PanelFooterLink href="/admin/orders">All orders</PanelFooterLink>
              </>
            )}
          </Panel>

          <Panel title="Top-selling products" description="By units sold in paid orders, last 30 days">
            {itemsResult.error ? (
              <PanelError what="sales" error={itemsResult.error} />
            ) : best.length === 0 ? (
              <EmptyState>No paid sales in the last 30 days yet.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="px-4 text-slate-500 w-10">#</TableHead>
                    <TableHead className="text-slate-500">Product</TableHead>
                    <TableHead className="text-slate-500 text-right">Units</TableHead>
                    <TableHead className="px-4 text-slate-500 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {best.map((product, index) => (
                    <TableRow key={product.key} className="border-slate-100 hover:bg-slate-50">
                      <TableCell className="px-4 tabular-nums text-slate-400">{index + 1}</TableCell>
                      <TableCell className="max-w-[16rem] truncate">
                        {product.productId ? (
                          <Link
                            href={`/admin/products/${product.productId}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="text-slate-600" title="This product has since been deleted">
                            {product.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-900">{product.units}</TableCell>
                      <TableCell className="px-4 text-right tabular-nums text-slate-600">
                        {formatCurrency(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </div>

        <div className="space-y-4 min-w-0">
          <Panel title="Needs attention" description="Paid orders still waiting to be packed">
            {ordersError ? (
              <PanelError what="orders" error={ordersError} />
            ) : needsAttention.length === 0 ? (
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
                      <OrderStatusBadge status={order.order_status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Payments" description="Every order, by payment outcome">
            {ordersError ? (
              <PanelError what="payments" error={ordersError} />
            ) : orders.length === 0 ? (
              <EmptyState>No payments yet.</EmptyState>
            ) : (
              <>
                <PaymentBar payments={payments} total={orders.length} />
                <ul className="divide-y divide-slate-100">
                  {payments.map(({ status, count, amount }) => (
                    <li key={status}>
                      <Link
                        href={`/admin/orders?payment=${status}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <PaymentStatusBadge status={status} />
                        <span className="text-right">
                          <span className="block tabular-nums font-medium text-slate-900">{count}</span>
                          <span className="block text-xs tabular-nums text-slate-500">{formatCurrency(amount)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel
            title="Inventory alerts"
            description={
              productsResult.error
                ? undefined
                : `${products.length} product${products.length === 1 ? '' : 's'} · ${activeProducts.length} live · low stock is ${LOW_STOCK_THRESHOLD} or fewer`
            }
          >
            {productsResult.error ? (
              <PanelError what="products" error={productsResult.error} />
            ) : products.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No products in the catalogue yet.</p>
                <Link
                  href="/admin/products/new"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline"
                >
                  Add a product <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : outOfStock.length + lowStock.length + inactiveProducts.length === 0 ? (
              <EmptyState>Stock looks healthy. Nothing is low, sold out or hidden.</EmptyState>
            ) : (
              <div className="divide-y divide-slate-100">
                <AlertGroup
                  icon={PackageX}
                  tone="text-red-600"
                  title="Out of stock"
                  rows={outOfStock.map((v) => ({
                    key: v.id,
                    href: `/admin/products/${v.product.id}`,
                    name: v.product.name,
                    detail: variantLabel(v),
                    value: '0 left',
                  }))}
                />
                <AlertGroup
                  icon={PackageMinus}
                  tone="text-amber-600"
                  title="Low stock"
                  rows={lowStock.map((v) => ({
                    key: v.id,
                    href: `/admin/products/${v.product.id}`,
                    name: v.product.name,
                    detail: variantLabel(v),
                    value: `${v.stock_quantity} left`,
                  }))}
                />
                <AlertGroup
                  icon={EyeOff}
                  tone="text-slate-500"
                  title="Hidden from shop"
                  rows={inactiveProducts.map((p) => ({
                    key: p.id,
                    href: `/admin/products/${p.id}`,
                    name: p.name,
                    detail: null,
                    value: 'Inactive',
                  }))}
                />
              </div>
            )}
          </Panel>

          <Panel title="Orders by status">
            {ordersError ? (
              <PanelError what="orders" error={ordersError} />
            ) : (
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
            )}
          </Panel>

          <Panel title="Newest customers">
            {customersResult.error ? (
              <PanelError what="customers" error={customersResult.error} />
            ) : newestCustomers.length === 0 ? (
              <EmptyState>No customer accounts yet.</EmptyState>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {newestCustomers.map((profile) => (
                    <li key={profile.id}>
                      <Link
                        href={`/admin/orders?customer=${profile.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-900">
                          {profile.full_name || 'Unnamed customer'}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">
                          Joined {formatOrderDate(profile.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <PanelFooterLink href="/admin/customers">All customers</PanelFooterLink>
              </>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}

function variantLabel(variant) {
  const parts = [variant.color, variant.size].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

function ChangeHint({ current, previous, period }) {
  // `period` is "yesterday" or "the previous N days"; only the latter takes "in".
  const during = period === 'yesterday' ? period : `in ${period}`
  const change = percentChange(current, previous)
  if (change === null) {
    return current > 0 ? `No sales ${during}` : `No sales ${during} either`
  }
  const rounded = Math.round(change)
  if (rounded === 0) return `Level with ${period}`
  const up = rounded > 0
  return (
    <span>
      <span className={up ? 'text-emerald-700' : 'text-rose-700'}>
        {up ? '▲' : '▼'} {Math.abs(rounded)}%
      </span>{' '}
      vs {period}
    </span>
  )
}

function RevenueFigure({ label, window, period }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">
        {formatCurrency(window.revenue)}
      </dd>
      <dd className="text-xs text-slate-500">
        {window.orders} order{window.orders === 1 ? '' : 's'}
      </dd>
      <dd className="mt-0.5 hidden text-xs text-slate-500 sm:block">
        <ChangeHint current={window.revenue} previous={window.previousRevenue} period={period} />
      </dd>
    </div>
  )
}

const PAYMENT_BAR_COLOURS = {
  paid: 'bg-emerald-500',
  pending: 'bg-amber-400',
  failed: 'bg-rose-500',
}

function PaymentBar({ payments, total }) {
  return (
    <div className="px-4 pt-3">
      <div
        className="flex h-2 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={payments.map((p) => `${p.count} ${p.status}`).join(', ')}
      >
        {payments.map(({ status, count }) =>
          count === 0 ? null : (
            <div
              key={status}
              className={PAYMENT_BAR_COLOURS[status] ?? 'bg-slate-400'}
              style={{ width: `${(count / total) * 100}%` }}
            />
          )
        )}
      </div>
    </div>
  )
}

const ALERT_LIMIT = 5

function AlertGroup({ icon: Icon, tone, title, rows }) {
  if (rows.length === 0) return null
  const shown = rows.slice(0, ALERT_LIMIT)
  const hidden = rows.length - shown.length

  return (
    <div className="py-2">
      <p className={`flex items-center gap-2 px-4 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
        <span className="tabular-nums text-slate-400">{rows.length}</span>
      </p>
      <ul>
        {shown.map((row) => (
          <li key={row.key}>
            <Link
              href={row.href}
              className="flex items-center justify-between gap-3 px-4 py-1.5 text-sm hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-slate-900">{row.name}</span>
                {row.detail && <span className="block text-xs text-slate-500">{row.detail}</span>}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">{row.value}</span>
            </Link>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <Link href="/admin/products" className="block px-4 py-1 text-xs font-medium text-slate-500 hover:text-slate-900">
          and {hidden} more
        </Link>
      )}
    </div>
  )
}

function PanelError({ what, error }) {
  return (
    <p role="alert" className="px-4 py-6 text-center text-sm text-red-700">
      Could not load {what}: {error.message}
    </p>
  )
}

function PanelFooterLink({ href, children }) {
  return (
    <div className="border-t border-slate-200 px-4 py-2.5">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        {children}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
