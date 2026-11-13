import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { NOTE_MAX_LENGTH } from '@/lib/admin-orders'

// Private team notes on an order. Stored as order_events rows of kind 'note',
// which have no RLS policies, so customers can never read them.
export async function POST(request, { params }) {
  const guard = await requireAdminApi('orders.notes')
  if (guard.response) return guard.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note.trim() : ''

  if (!note) return NextResponse.json({ error: 'Write something first' }, { status: 400 })
  if (note.length > NOTE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Notes can be up to ${NOTE_MAX_LENGTH} characters` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('order_events')
    .insert({ order_id: id, kind: 'note', note, actor_email: guard.user.email ?? null })
    .select('id, kind, note, actor_email, created_at')
    .single()

  if (error) {
    // 23503: the order id doesn't exist (foreign key). 22P02: not a uuid.
    if (error.code === '23503' || error.code === '22P02') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}

// An admin can remove a note they wrote themselves, e.g. a typo or a note
// added to the wrong order. Status and tracking history can't be deleted.
export async function DELETE(request, { params }) {
  const guard = await requireAdminApi('orders.notes')
  if (guard.response) return guard.response

  const { id } = await params
  const eventId = new URL(request.url).searchParams.get('event')
  if (!eventId) return NextResponse.json({ error: 'Missing note id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('order_events')
    .delete()
    .eq('id', eventId)
    .eq('order_id', id)
    .eq('kind', 'note')
    .eq('actor_email', guard.user.email)
    .select('id')
    .maybeSingle()

  if (error && error.code !== '22P02') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Note not found, or it was written by someone else' }, { status: 404 })
  }

  return NextResponse.json({ deleted: data.id })
}
