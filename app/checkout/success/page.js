'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h1
        className="font-display text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)] mb-3"
      >
        Order Confirmed!
      </h1>
      <p className="text-gray-600 max-w-md mb-2">
        Thank you for shopping with Macdame. We've received your payment and your order is being prepared.
      </p>
      {orderNumber && (
        <p className="text-sm text-gray-500 mb-8">
          Order number: <span className="font-semibold text-gray-800">{orderNumber}</span>
        </p>
      )}
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/shop">
          <Button
            variant="outline"
            className="border-gray-300"
          >
            Continue Shopping
          </Button>
        </Link>
        <Link href={orderNumber ? `/account/orders/${orderNumber}` : '/account/orders'}>
          <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
            View Order Details
          </Button>
        </Link>
      </div>
      <Link href="/" className="mt-4 text-sm text-gray-500 hover:text-[var(--color-primary)]">
        Back to home
      </Link>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main className="pt-24 pb-16">
        <Suspense fallback={null}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
