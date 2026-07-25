import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCategory } from '@/lib/admin-categories'

export async function POST(request) {
  const guard = await requireAdminApi()
  if (guard.response) return guard.response

  const body = await request.json().catch(() => ({}))
  const { fields, error: fieldsError } = normalizeCategory(body)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('categories').insert([fields]).select().single()

  if (error) {
    // categories.name and categories.slug are both UNIQUE.
    const message = error.code === '23505'
      ? `A collection named "${fields.name}" or using /${fields.slug} already exists.`
      : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ category: data })
}
