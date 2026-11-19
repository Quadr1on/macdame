import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing verification fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, order_number, user_id, payment_status')
    .eq('razorpay_order_id', razorpay_order_id)
    .single()

  if (orderError || !order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  // Constant-time compare; lengths must match first or timingSafeEqual throws.
  const given = Buffer.from(String(razorpay_signature))
  const expected = Buffer.from(expectedSignature)
  const isValid = given.length === expected.length && crypto.timingSafeEqual(given, expected)

  if (!isValid) {
    // Only a still-pending order may be marked failed, so a bad signature
    // replayed against an order that is already paid cannot undo the payment.
    await admin
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order.id)
      .eq('payment_status', 'pending')
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  // A repeat of a verification that already succeeded is not an error.
  if (order.payment_status === 'paid') {
    return NextResponse.json({ success: true, orderNumber: order.order_number })
  }

  await admin
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'confirmed',
      razorpay_payment_id,
    })
    .eq('id', order.id)

  return NextResponse.json({ success: true, orderNumber: order.order_number })
}
