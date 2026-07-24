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
    .select('id, order_number, user_id')
    .eq('razorpay_order_id', razorpay_order_id)
    .single()

  if (orderError || !order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  const isValid = expectedSignature === razorpay_signature

  if (!isValid) {
    await admin.from('orders').update({ payment_status: 'failed' }).eq('id', order.id)
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
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
