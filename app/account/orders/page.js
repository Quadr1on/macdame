'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge'
import { Package, ChevronRight, MapPin } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatOrderDate } from '@/lib/order-status'

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    // RLS on orders/order_items already scopes these to auth.uid(), so no
    // user_id filter is needed — the anon key simply cannot see anyone else's.
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(id, product_name, quantity, price, variant_details)')
      .order('created_at', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else setOrders(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login?next=/account/orders')
      return
    }
    fetchOrders()
  }, [user, authLoading, router, fetchOrders])

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Your Orders
              </h1>
              <p className="text-gray-500 mt-1">Track and review everything you&apos;ve ordered</p>
            </div>
            <Link
              href="/account/addresses"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline shrink-0 mt-2"
            >
              <MapPin className="w-4 h-4" />
              Addresses
            </Link>
          </div>

          {loading || authLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-36 bg-gray-200 rounded-xl" />
              <div className="h-36 bg-gray-200 rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              Couldn&apos;t load your orders: {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl">
              <div className="w-20 h-20 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-[var(--color-primary)]/40" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                No orders yet
              </h2>
              <p className="text-gray-500 mb-6 max-w-sm">
                Once you place an order it will show up here, along with its tracking details.
              </p>
              <Link href="/shop">
                <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const items = order.order_items ?? []
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.order_number}`}
                    className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{order.order_number}</p>
                        <p className="text-sm text-gray-500">
                          Placed {formatOrderDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <OrderStatusBadge status={order.order_status} />
                        <PaymentStatusBadge status={order.payment_status} />
                      </div>
                    </div>

                    <ul className="mt-4 space-y-1 border-t border-gray-100 pt-4">
                      {items.slice(0, 3).map((item) => (
                        <li key={item.id} className="text-sm text-gray-600 truncate">
                          {item.quantity} × {item.product_name}
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="text-sm text-gray-400">
                          + {items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <p className="text-sm text-gray-500">
                        {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
                        View details
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
