import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
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

  const body = await request.json()
  const { items, addressId } = body

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!addressId) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: address, error: addressError } = await admin
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single()

  if (addressError || !address) {
    return NextResponse.json({ error: 'Address not found' }, { status: 400 })
  }

  const productIds = [...new Set(items.map((item) => item.id))]
  const { data: products, error: productsError } = await admin
    .from('products')
    .select('id, name, base_price, product_variants(id, sku, color, size, price)')
    .in('id', productIds)

  if (productsError) {
    return NextResponse.json({ error: 'Failed to price cart' }, { status: 500 })
  }

  const productsById = new Map(products.map((p) => [p.id, p]))

  let subtotal = 0
  const orderItemsInput = []

  for (const item of items) {
    const product = productsById.get(item.id)
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
    }

    const variant = product.product_variants.find((v) => v.sku === item.sku) ?? product.product_variants[0]
    const price = Number(variant?.price ?? product.base_price)
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1)

    subtotal += price * quantity
    orderItemsInput.push({
      variant_id: variant?.id ?? null,
      product_name: product.name,
      variant_details: variant ? { color: variant.color, size: variant.size, sku: variant.sku } : null,
      price,
      quantity,
    })
  }

  const shippingFee = subtotal >= 999 ? 0 : 99
  const totalAmount = subtotal + shippingFee
  const orderNumber = `MCD${Date.now()}${Math.floor(Math.random() * 1000)}`

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert([
      {
        order_number: orderNumber,
        user_id: user.id,
        address_id: addressId,
        subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        payment_method: 'razorpay',
        payment_status: 'pending',
        order_status: 'pending',
      },
    ])
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const { error: itemsError } = await admin
    .from('order_items')
    .insert(orderItemsInput.map((oi) => ({ ...oi, order_id: order.id })))

  if (itemsError) {
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  let razorpayOrder
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: orderNumber,
    })
  } catch (err) {
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 })
  }

  await admin.from('orders').update({ razorpay_order_id: razorpayOrder.id }).eq('id', order.id)

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    orderNumber,
  })
}
