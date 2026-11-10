'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { MapPin, ShoppingBag, Plus, Check } from 'lucide-react'
import useCartStore from '@/lib/cart-store'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase/client'
import { loadRazorpayCheckout } from '@/lib/razorpay'

export default function CheckoutPage() {
  const { items, getSubtotal, getTotalItems, getTotalSavings, clearCart } = useCartStore()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setMounted(true), [])

  const fetchAddresses = useCallback(async (userId) => {
    setAddressesLoading(true)
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    setAddresses(data ?? [])
    setSelectedAddressId((data ?? []).find((a) => a.is_default)?.id ?? data?.[0]?.id ?? null)
    setAddressesLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login?next=/checkout')
      return
    }
    fetchAddresses(user.id)
  }, [user, authLoading, router, fetchAddresses])

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-48"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const totalItems = getTotalItems()
  const totalSavings = getTotalSavings()
  const deliveryFee = subtotal >= 999 ? 0 : 99
  const total = subtotal + deliveryFee

  async function handlePay() {
    setError('')

    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }
    if (!selectedAddressId) {
      setError('Please select a delivery address')
      return
    }

    setPaying(true)

    // Load the gateway before creating the order, so a gateway failure can't
    // leave an orphaned pending order behind.
    let RazorpayCheckout
    try {
      RazorpayCheckout = await loadRazorpayCheckout()
    } catch {
      setError('Could not reach the payment gateway. Check your connection and try again.')
      setPaying(false)
      return
    }

    try {
      const createRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, sku: item.sku, quantity: item.quantity })),
          addressId: selectedAddressId,
        }),
      })
      const createData = await createRes.json()

      if (!createRes.ok) {
        setError(createData.error || 'Could not start payment')
        setPaying(false)
        return
      }

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

      const rzp = new RazorpayCheckout({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: createData.amount,
        currency: createData.currency,
        order_id: createData.razorpayOrderId,
        name: 'Macdame',
        description: `Order ${createData.orderNumber}`,
        prefill: {
          name: selectedAddress?.full_name,
          contact: selectedAddress?.phone,
          email: user.email,
        },
        theme: { color: '#7a5c3e' },
        handler: async function (response) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          const verifyData = await verifyRes.json()

          if (verifyRes.ok && verifyData.success) {
            clearCart()
            router.push(`/checkout/success?order=${verifyData.orderNumber}`)
          } else {
            setError('Payment verification failed. If money was deducted, contact support with your payment ID.')
            setPaying(false)
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false)
          },
        },
      })

      rzp.on('payment.failed', function () {
        setError('Payment failed. Please try again.')
        setPaying(false)
      })

      rzp.open()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="font-display text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)] mb-8"
          >
            Checkout
          </h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <p className="text-gray-600 mb-4">Your cart is empty.</p>
              <Link href="/shop">
                <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                {/* Address selection */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900">
                      Delivery Address
                    </h2>
                    <Link
                      href="/account/addresses"
                      className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Manage
                    </Link>
                  </div>

                  {addressesLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-20 bg-gray-100 rounded-lg"></div>
                      <div className="h-20 bg-gray-100 rounded-lg"></div>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No saved addresses yet</p>
                      <Link href="/account/addresses">
                        <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                          Add Address
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                            selectedAddressId === address.id
                              ? 'border-[var(--color-primary)] bg-[var(--color-cream)]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                                selectedAddressId === address.id
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selectedAddressId === address.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{address.full_name}</span>
                                <span className="text-xs uppercase text-gray-400">{address.type}</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {address.address_line1}
                                {address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state} - {address.pincode}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">{address.phone}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
                    Items ({totalItems})
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="lg:w-96 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28 space-y-5">
                  <h2 className="font-display text-xl font-bold text-gray-900">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>You Save</span>
                        <span className="font-medium">-₹{totalSavings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200" />

                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-[var(--color-primary)]">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handlePay}
                    disabled={paying || !selectedAddressId}
                    className="w-full py-6 text-base font-semibold text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {paying ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
                  </Button>
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
