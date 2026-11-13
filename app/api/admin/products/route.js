import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeProductPayload, normalizeVariants } from '@/lib/admin-products'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export async function POST(request) {
  const guard = await requireAdminApi('products.edit')
  if (guard.response) return guard.response

  const body = await request.json().catch(() => ({}))

  const { fields, error: fieldsError } = normalizeProductPayload(body)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const { variants, error: variantsError } = normalizeVariants(body.variants, {
    basePrice: fields.base_price,
  })
  if (variantsError) return NextResponse.json({ error: variantsError }, { status: 400 })

  const admin = createAdminClient()

  const { data: product, error: insertError } = await admin
    .from('products')
    .insert([fields])
    .select('id, slug')
    .single()

  if (insertError) {
    const message = insertError.code === '23505'
      ? `The slug "${fields.slug}" is already taken — pick a different one.`
      : insertError.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (variants.length > 0) {
    const { error: variantError } = await admin.from('product_variants').insert(
      variants.map(({ id, ...variant }) => ({ ...variant, product_id: product.id }))
    )

    if (variantError) {
      // Compensating rollback — same pattern as the Razorpay create-order
      // route, so a half-built product never lands in the catalog.
      await admin.from('products').delete().eq('id', product.id)
      const message = variantError.code === '23505'
        ? 'One of those SKUs already exists on another product.'
        : variantError.message
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  revalidateStorefront()
  return NextResponse.json({ product })
}
