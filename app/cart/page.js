'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Package, Truck, ShieldCheck } from 'lucide-react'
import useCartStore from '@/lib/cart-store'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTotalItems, getTotalSavings } = useCartStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch (Zustand persist loads from localStorage)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded w-48"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
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

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Shopping Cart
              </h1>
              <p className="text-gray-500 mt-1">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
              >
                Clear Cart
              </button>
            )}
          </motion.div>

          {items.length === 0 ? (
            /* Empty Cart State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-[var(--color-cream-dark)] flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-[var(--color-primary)]/40" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Your cart is empty
              </h2>
              <p className="text-gray-500 mb-8 max-w-md">
                Looks like you haven't added any products yet. Explore our collection and find something you love!
              </p>
              <Link href="/shop">
                <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] px-8 py-3 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Button>
              </Link>
            </motion.div>
          ) : (
            /* Cart Layout */
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1 space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="flex flex-row">
                        {/* Product Image */}
                        <Link href={item.href || '#'} className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex-shrink-0 bg-[#f8f6f3]">
                          <Image
                            src={item.image || '/product-kasavu-saree.png'}
                            alt={item.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-500"
                          />
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--color-terracotta)] text-white text-[10px] font-semibold rounded-sm">
                              -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                            </span>
                          )}
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link href={item.href || '#'}>
                                <h3
                                  className="font-semibold text-gray-900 hover:text-[var(--color-primary)] transition-colors line-clamp-2 text-sm sm:text-base"
                                  style={{ fontFamily: 'Georgia, serif' }}
                                >
                                  {item.name}
                                </h3>
                              </Link>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mt-1.5">
                              <span className="text-lg font-bold text-gray-900">
                                ₹{item.price.toLocaleString()}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  ₹{item.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-0.5 bg-[var(--color-cream)] rounded-lg overflow-hidden border border-gray-200">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-[var(--color-secondary)]/10 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-10 text-center text-sm font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-[var(--color-secondary)]/10 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-primary)]">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Continue Shopping */}
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium mt-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Link>
              </div>

              {/* Order Summary Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:w-96 flex-shrink-0"
              >
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28 space-y-5">
                  <h2
                    className="text-xl font-bold text-gray-900"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Order Summary
                  </h2>

                  {/* Summary Lines */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
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

                    {deliveryFee > 0 && (
                      <p className="text-xs text-gray-400">
                        Free delivery on orders above ₹999
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-gray-200" />

                  {/* Total */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[var(--color-primary)]">
                        ₹{total.toLocaleString()}
                      </span>
                      {totalSavings > 0 && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Saving ₹{totalSavings.toLocaleString()} on this order
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    className="w-full py-6 text-base font-semibold text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Proceed to Buy
                  </Button>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-cream)] flex items-center justify-center">
                        <Package className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight">Quality Assured</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-cream)] flex items-center justify-center">
                        <Truck className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight">Fast Delivery</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-cream)] flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight">Secure Payment</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
