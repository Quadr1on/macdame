import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidOrderStatus } from '@/lib/order-status'
import { can } from '@/lib/admin-permissions'

export async function PATCH(request, { params }) {
  const guard = await requireAdminApi()
  if (guard.response) return guard.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { order_status: orderStatus, tracking_number: trackingNumber } = body

  const updates = { updated_at: new Date().toISOString() }

  if (orderStatus !== undefined) {
    // Validated here rather than left to the DB: orders.order_status has a
    // CHECK constraint, and an unknown value would surface as an opaque 500
    // instead of a message the admin can act on.
    if (!isValidOrderStatus(orderStatus)) {
      return NextResponse.json({ error: `Invalid order status: ${orderStatus}` }, { status: 400 })
    }
    updates.order_status = orderStatus
  }

  if (trackingNumber !== undefined) {
    const trimmed = typeof trackingNumber === 'string' ? trackingNumber.trim() : ''
    // Store NULL rather than '' when cleared, so the customer page's
    // "To be decided" fallback keeps working.
    updates.tracking_number = trimmed === '' ? null : trimmed
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Cancelling is its own permission so a role can move orders along without
  // being able to cancel them, or the reverse. Any other change needs update.
  const cancelling = updates.order_status === 'cancelled'
  const otherChange = 'tracking_number' in updates || ('order_status' in updates && !cancelling)
  if ((cancelling && !can(guard.access, 'orders.cancel')) || (otherChange && !can(guard.access, 'orders.update'))) {
    return NextResponse.json(
      { error: 'Your role does not allow this change. Ask an owner for access.' },
      { status: 403 }
    )
  }

  // Service role: orders has a SELECT-only RLS policy and no UPDATE policy, so
  // the cookie-scoped anon client cannot write here.
  const admin = createAdminClient()

  // Read the current values first so the history can say what changed from.
  const { data: before, error: readError } = await admin
    .from('orders')
    .select('order_status, tracking_number')
    .eq('id', id)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!before) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data, error } = await admin
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select('id, order_status, tracking_number')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const actor = guard.user.email ?? null
  const events = []
  if ('order_status' in updates && updates.order_status !== before.order_status) {
    events.push({
      order_id: id,
      kind: 'status',
      from_value: before.order_status,
      to_value: updates.order_status,
      actor_email: actor,
    })
  }
  if ('tracking_number' in updates && updates.tracking_number !== before.tracking_number) {
    events.push({
      order_id: id,
      kind: 'tracking',
      from_value: before.tracking_number,
      to_value: updates.tracking_number,
      actor_email: actor,
    })
  }

  // The order itself is already saved; a failed history write must not turn
  // that into an error the admin would retry. Report it alongside instead.
  let historyError = null
  if (events.length > 0) {
    const { error: eventsError } = await admin.from('order_events').insert(events)
    if (eventsError) {
      console.error('order_events insert failed', eventsError)
      historyError = 'Saved, but the change could not be added to the order history.'
    }
  }

  return NextResponse.json({ order: data, historyError })
}
