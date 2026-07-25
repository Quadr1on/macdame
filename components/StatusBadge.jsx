import { orderStatusMeta, paymentStatusMeta } from '@/lib/order-status'

// Shared by the customer order pages and the admin dashboard so a status never
// renders one colour on one side of the app and another colour on the other.
// No 'use client' — it's pure markup, usable from server and client components.

function Badge({ label, badgeClass, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${badgeClass} ${className}`}
    >
      {label}
    </span>
  )
}

export function OrderStatusBadge({ status, className }) {
  const { label, badgeClass } = orderStatusMeta(status)
  return <Badge label={label} badgeClass={badgeClass} className={className} />
}

export function PaymentStatusBadge({ status, className }) {
  const { label, badgeClass } = paymentStatusMeta(status)
  return <Badge label={label} badgeClass={badgeClass} className={className} />
}
