import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCategory } from '@/lib/admin-categories'

export async function PATCH(request, { params }) {
  const guard = await requireAdminApi()
  if (guard.response) return guard.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const { fields, error: fieldsError } = normalizeCategory(body)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .update(fields)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    const message = error.code === '23505'
      ? `A collection named "${fields.name}" or using /${fields.slug} already exists.`
      : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }
  if (!data) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  return NextResponse.json({ category: data })
}
