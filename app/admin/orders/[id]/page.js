import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { PageHeader, Panel, FieldRow } from '@/components/admin/ui'
import {
  formatCurrency,
  formatOrderDate,
  formatVariantDetails,
} from '@/lib/order-status'
import OrderStatusForm from './OrderStatusForm'

const PAYMENT_METHOD_LABELS = { razorpay: 'Razorpay', cod: 'Cash on delivery' }

export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select(
      `*,
       addresses(*),
       users_profile(full_name, phone),
       order_items(
         id, product_name, quantity, price, variant_details,
         product_variants(sku, variant_image_url, products(slug, image))
       )`
    )
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  // users_profile has no email column — it only lives on auth.users, which the
  // service role can reach through the admin auth API.
  const { data: authUser } = await admin.auth.admin.getUserById(order.user_id)
  const email = authUser?.user?.email ?? '—'

  const address = order.addresses
  const items = order.order_items ?? []

  return (
    <>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        All orders
      </Link>

      <PageHeader
        title={order.order_number}
        description={`Placed ${formatOrderDate(order.created_at, { withTime: true })}`}
      >
        <OrderStatusBadge status={order.order_status} />
        <PaymentStatusBadge status={order.payment_status} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Panel title={`Items (${items.length})`}>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const thumb =
                  item.product_variants?.variant_image_url ?? item.product_variants?.products?.image
                const slug = item.product_variants?.products?.slug
                const variantLabel = formatVariantDetails(item.variant_details)

                return (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                      {thumb ? (
                        <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {slug ? (
                        <Link
                          href={`/products/${slug}`}
                          className="text-sm font-medium text-slate-900 hover:underline line-clamp-2"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                          {item.product_name}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {[variantLabel, item.product_variants?.sku].filter(Boolean).join(' · ') ||
                          'No variant recorded'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-slate-900 tabular-nums">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      <p className="text-xs font-medium text-slate-500 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-slate-200 px-4 py-3">
              <FieldRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              <FieldRow
                label="Shipping"
                value={Number(order.shipping_fee) === 0 ? 'Free' : formatCurrency(order.shipping_fee)}
              />
              <FieldRow
                label={<span className="font-medium text-slate-900">Total</span>}
                value={<span className="font-semibold">{formatCurrency(order.total_amount)}</span>}
                className="border-t border-slate-100 mt-1 pt-2"
              />
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Customer">
              <div className="px-4 py-3">
                <FieldRow label="Name" value={order.users_profile?.full_name || '—'} />
                <FieldRow label="Email" value={email} />
                <FieldRow label="Phone" value={order.users_profile?.phone || address?.phone || '—'} />
                <Link
                  href={`/admin/orders?customer=${order.user_id}`}
                  className="mt-2 inline-block text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                >
                  All orders from this customer
                </Link>
              </div>
            </Panel>

            <Panel title="Delivery address">
              <div className="px-4 py-3 text-sm text-slate-600">
                {address ? (
                  <>
                    <p className="font-medium text-slate-900">{address.full_name}</p>
                    <p>{address.phone}</p>
                    <p className="mt-1">
                      {address.address_line1}
                      {address.address_line2 ? `, ${address.address_line2}` : ''}
                    </p>
                    <p>
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      {address.type}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400">The customer has since deleted this address.</p>
                )}
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Fulfilment" description="What the customer sees on their order page">
            <OrderStatusForm
              orderId={order.id}
              initialStatus={order.order_status}
              initialTracking={order.tracking_number}
            />
          </Panel>

          <Panel title="Payment">
            <div className="px-4 py-3">
              <FieldRow
                label="Method"
                value={PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
              />
              <FieldRow label="Status" value={<PaymentStatusBadge status={order.payment_status} />} />
              <FieldRow
                label="Razorpay order"
                value={
                  <span className="font-mono text-xs">{order.razorpay_order_id ?? '—'}</span>
                }
              />
              <FieldRow
                label="Razorpay payment"
                value={
                  <span className="font-mono text-xs">{order.razorpay_payment_id ?? '—'}</span>
                }
              />
              <FieldRow
                label="Last updated"
                value={formatOrderDate(order.updated_at, { withTime: true })}
              />
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
