'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { ArrowLeft, Check, Package, Truck, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase/client'
import {
  FULFILMENT_STEPS,
  fulfilmentStepIndex,
  orderStatusMeta,
  formatCurrency,
  formatOrderDate,
  formatVariantDetails,
} from '@/lib/order-status'

const PAYMENT_METHOD_LABELS = {
  razorpay: 'Razorpay (card / UPI / netbanking)',
  cod: 'Cash on delivery',
}

function StatusTimeline({ status }) {
  const currentIndex = fulfilmentStepIndex(status)

  return (
    <ol className="flex items-start">
      {FULFILMENT_STEPS.map((step, index) => {
        const reached = index <= currentIndex
        const isCurrent = index === currentIndex

        return (
          <li key={step} className="flex-1 flex flex-col items-center text-center relative">
            {/* Connector to the previous dot, drawn behind it */}
            {index > 0 && (
              <span
                aria-hidden
                className={`absolute top-4 right-1/2 w-full h-0.5 ${
                  reached ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                reached
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                  : 'bg-white border-gray-300 text-gray-300'
              }`}
            >
              {reached ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-current" />}
            </span>
            <span
              className={`mt-2 text-xs ${
                isCurrent
                  ? 'font-semibold text-[var(--color-primary-dark)]'
                  : reached
                    ? 'text-gray-600'
                    : 'text-gray-400'
              }`}
            >
              {orderStatusMeta(step).label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className={strong ? 'font-semibold text-gray-900' : 'text-gray-700'}>{value}</span>
    </div>
  )
}

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { orderNumber } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchOrder = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(
        `*,
         addresses(*),
         order_items(
           id, product_name, quantity, price, variant_details,
           product_variants(variant_image_url, products(name, slug, image))
         )`
      )
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (error || !data) setNotFound(true)
    else setOrder(data)
    setLoading(false)
  }, [orderNumber])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push(`/login?next=/account/orders/${orderNumber}`)
      return
    }
    fetchOrder()
  }, [user, authLoading, router, orderNumber, fetchOrder])

  const address = order?.addresses
  const items = order?.order_items ?? []
  const isCancelled = order?.order_status === 'cancelled'

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-primary)] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>

          {loading || authLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl">
              <div className="w-20 h-20 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-[var(--color-primary)]/40" />
              </div>
              <h1 className="font-display text-xl font-bold text-gray-900 mb-2">
                Order not found
              </h1>
              <p className="text-gray-500 mb-6 max-w-sm">
                We couldn&apos;t find an order numbered <span className="font-medium">{orderNumber}</span> on
                your account.
              </p>
              <Link href="/account/orders">
                <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                  View All Orders
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1
                      className="font-display text-2xl font-bold text-[var(--color-primary-dark)]"
                    >
                      {order.order_number}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Placed {formatOrderDate(order.created_at, { withTime: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <OrderStatusBadge status={order.order_status} />
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>
              </div>

              {/* Progress — a cancelled order gets a notice instead of a timeline,
                  since cancellation is a branch off the path, not a step along it. */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                {isCancelled ? (
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">This order was cancelled</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        If you were charged, any refund is processed back to your original payment
                        method. Reach out through our contact page if you need help.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-sm font-semibold text-gray-900 mb-5">Progress</h2>
                    <StatusTimeline status={order.order_status} />
                    <p className="text-sm text-gray-500 mt-5 text-center">
                      {orderStatusMeta(order.order_status).description}
                    </p>
                  </>
                )}
              </div>

              {/* Tracking */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900">Tracking ID</h2>
                    {order.tracking_number ? (
                      <p className="mt-1 font-mono text-base text-gray-900 break-all">
                        {order.tracking_number}
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-base text-gray-400 italic">To be decided</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Your tracking ID appears here once the order has been dispatched.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Items ({items.length})
                </h2>
                <ul className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const product = item.product_variants?.products
                    const thumb = item.product_variants?.variant_image_url || product?.image
                    const variantLabel = formatVariantDetails(item.variant_details)

                    return (
                      <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="relative w-14 h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--color-cream)]">
                          {thumb ? (
                            <Image src={thumb} alt={item.product_name} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {product?.slug ? (
                            <Link
                              href={`/products/${product.slug}`}
                              className="font-medium text-gray-900 hover:text-[var(--color-primary)] line-clamp-2"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <p className="font-medium text-gray-900 line-clamp-2">{item.product_name}</p>
                          )}
                          {variantLabel && <p className="text-sm text-gray-500">{variantLabel}</p>}
                          <p className="text-sm text-gray-500">Qty {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900 shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Delivery address */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Delivery address</h2>
                  {address ? (
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p className="font-medium text-gray-900">{address.full_name}</p>
                      <p>{address.phone}</p>
                      <p>
                        {address.address_line1}
                        {address.address_line2 ? `, ${address.address_line2}` : ''}
                      </p>
                      <p>
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">This address has since been removed.</p>
                  )}
                </div>

                {/* Payment + totals */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment</h2>
                  <Row
                    label="Method"
                    value={PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
                  />
                  <div className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-500">Status</span>
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>

                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
                    <Row
                      label="Shipping"
                      value={Number(order.shipping_fee) === 0 ? 'Free' : formatCurrency(order.shipping_fee)}
                    />
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Row label="Total" value={formatCurrency(order.total_amount)} strong />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
