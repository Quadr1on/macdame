import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  MessageCircle,
  Package,
  Phone,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { PageHeader, Panel, FieldRow, NoAccess } from '@/components/admin/ui'
import CopyButton from '@/components/admin/CopyButton'
import {
  formatCurrency,
  formatOrderDate,
  formatVariantDetails,
} from '@/lib/order-status'
import { formatAddress, formatAge, phoneDigits } from '@/lib/admin-orders'
import { getAdminUser } from '@/lib/admin-auth'
import { can } from '@/lib/admin-permissions'
import OrderActions from './OrderActions'
import OrderHistory from './OrderHistory'

const PAYMENT_METHOD_LABELS = { razorpay: 'Razorpay', cod: 'Cash on delivery' }

export default async function AdminOrderDetailPage({ params }) {
  const { access } = await getAdminUser()
  if (!can(access, 'orders.view')) return <NoAccess what="orders" />

  const { id } = await params
  const admin = createAdminClient()

  const { data: order, error } = await admin
    .from('orders')
    .select(
      `*,
       addresses(*),
       users_profile(full_name, phone),
       order_items(
         id, product_name, quantity, price, variant_details,
         product_variants(sku, variant_image_url, products(id, slug, image))
       )`
    )
    .eq('id', id)
    .maybeSingle()

  // A failed query is not the same as a missing order: let the admin error
  // boundary offer a retry instead of claiming the order doesn't exist.
  // (An id that isn't a valid uuid is a client mistake, so it stays a 404.)
  if (error && error.code !== '22P02') throw new Error(`Could not load order: ${error.message}`)
  if (!order) notFound()

  const [authResult, newerResult, olderResult, eventsResult, adminUser] = await Promise.all([
    // users_profile has no email column — it only lives on auth.users, which
    // the service role can reach through the admin auth API. user_id is
    // nulled if the account is deleted.
    order.user_id ? admin.auth.admin.getUserById(order.user_id) : Promise.resolve({ data: null }),
    admin
      .from('orders')
      .select('id, order_number')
      .gt('created_at', order.created_at)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from('orders')
      .select('id, order_number')
      .lt('created_at', order.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('order_events')
      .select('id, kind, from_value, to_value, note, actor_email, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false }),
    // Already resolved once by the admin layout; needed here to mark which
    // notes the viewer wrote (and so may delete).
    getAdminUser(),
  ])

  const email = authResult.data?.user?.email ?? null
  const newer = newerResult.data
  const older = olderResult.data

  const address = order.addresses
  const items = order.order_items ?? []
  const phone = order.users_profile?.phone || address?.phone || null
  const waDigits = phoneDigits(phone)

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
        <nav aria-label="Other orders" className="flex items-center gap-1">
          <NeighbourLink order={newer} label="Newer order" icon={ChevronLeft} />
          <NeighbourLink order={older} label="Older order" icon={ChevronRight} />
        </nav>
      </div>

      <PageHeader
        title={order.order_number}
        description={`Placed ${formatOrderDate(order.created_at, { withTime: true })} · ${formatAge(order.created_at)}`}
      >
        <OrderStatusBadge status={order.order_status} />
        <PaymentStatusBadge status={order.payment_status} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* On phones the actions come first: they are why the page was opened. */}
        <div className="space-y-4 lg:order-2">
          <Panel title="Fulfilment" description="What the customer sees on their order page">
            <OrderActions
              key={order.order_status}
              order={order}
              canUpdate={can(access, 'orders.update')}
              canCancel={can(access, 'orders.cancel')}
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
                value={<span className="font-mono text-xs">{order.razorpay_order_id ?? '—'}</span>}
              />
              <FieldRow
                label="Razorpay payment"
                value={<span className="font-mono text-xs">{order.razorpay_payment_id ?? '—'}</span>}
              />
              <FieldRow
                label="Last updated"
                value={formatOrderDate(order.updated_at, { withTime: true })}
              />
              {order.razorpay_payment_id && (
                <a
                  href={`https://dashboard.razorpay.com/app/payments/${encodeURIComponent(order.razorpay_payment_id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                >
                  Open in Razorpay
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-4 lg:order-1">
          <Panel title={`Items (${items.length})`}>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const thumb =
                  item.product_variants?.variant_image_url ?? item.product_variants?.products?.image
                const productId = item.product_variants?.products?.id
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
                      {productId ? (
                        <Link
                          href={`/admin/products/${productId}`}
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
                <FieldRow label="Email" value={email ?? '—'} />
                <FieldRow label="Phone" value={phone ?? '—'} />
                {(phone || email) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {waDigits && (
                      <ContactLink href={`tel:+${waDigits}`} icon={Phone}>
                        Call
                      </ContactLink>
                    )}
                    {waDigits && (
                      <ContactLink href={`https://wa.me/${waDigits}`} icon={MessageCircle} external>
                        WhatsApp
                      </ContactLink>
                    )}
                    {email && (
                      <ContactLink
                        href={`mailto:${email}?subject=${encodeURIComponent(`Your Macdame order ${order.order_number}`)}`}
                        icon={Mail}
                      >
                        Email
                      </ContactLink>
                    )}
                  </div>
                )}
                {order.user_id && (
                  <Link
                    href={`/admin/orders?customer=${order.user_id}`}
                    className="mt-3 inline-block text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                  >
                    All orders from this customer
                  </Link>
                )}
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
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-wide text-slate-400">{address.type}</span>
                      <CopyButton text={formatAddress(address)} label="Copy address" />
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400">No delivery address is on file for this order.</p>
                )}
              </div>
            </Panel>
          </div>

          <Panel title="History and notes" description="Changes made in the admin, and notes only the team can see">
            <OrderHistory
              orderId={order.id}
              placedAt={order.created_at}
              events={eventsResult.data ?? []}
              eventsError={eventsResult.error?.message ?? null}
              currentEmail={adminUser.user?.email ?? null}
              canNote={can(access, 'orders.notes')}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

function NeighbourLink({ order, label, icon: Icon }) {
  const base =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white'
  if (!order) {
    return (
      <span className={`${base} text-slate-300`} aria-disabled="true" title={`No ${label.toLowerCase()}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">No {label.toLowerCase()}</span>
      </span>
    )
  }
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      title={`${label}: ${order.order_number}`}
      className={`${base} text-slate-600 hover:border-slate-400 hover:text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">
        {label}: {order.order_number}
      </span>
    </Link>
  )
}

function ContactLink({ href, icon: Icon, external, children }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </a>
  )
}
