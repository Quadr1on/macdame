import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeProductPayload, normalizeVariants } from '@/lib/admin-products'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

// Flags the products table can toggle on their own, without re-submitting the
// whole form — used by the row switches on /admin/products.
const TOGGLE_FIELDS = ['is_active', 'is_new', 'is_bestseller']

export async function PATCH(request, { params }) {
  const guard = await requireAdminApi('products.edit')
  if (guard.response) return guard.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const admin = createAdminClient()

  // A payload without a name is a quick toggle, not a full form submission.
  if (body.name === undefined) {
    const updates = { updated_at: new Date().toISOString() }
    for (const field of TOGGLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = Boolean(body[field])
    }
    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('id, is_active, is_new, is_bestseller')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    revalidateStorefront()
    return NextResponse.json({ product: data })
  }

  const { fields, error: fieldsError } = normalizeProductPayload(body)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const { variants, error: variantsError } = normalizeVariants(body.variants, {
    basePrice: fields.base_price,
  })
  if (variantsError) return NextResponse.json({ error: variantsError }, { status: 400 })

  const { data: product, error: updateError } = await admin
    .from('products')
    .update(fields)
    .eq('id', id)
    .select('id, slug')
    .maybeSingle()

  if (updateError) {
    const message = updateError.code === '23505'
      ? `The slug "${fields.slug}" is already taken — pick a different one.`
      : updateError.message
    return NextResponse.json({ error: message }, { status: 400 })
  }
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Reconcile variants against what's already stored: update the ones the form
  // still carries, insert the new rows, remove the ones the admin deleted.
  const { data: existing } = await admin
    .from('product_variants')
    .select('id')
    .eq('product_id', id)

  const existingIds = new Set((existing ?? []).map((variant) => variant.id))
  const keptIds = new Set(variants.map((variant) => variant.id).filter((vid) => vid && existingIds.has(vid)))
  const removedIds = [...existingIds].filter((vid) => !keptIds.has(vid))

  if (removedIds.length > 0) {
    // Variants referenced by a past order must survive, or the order history
    // loses the record of what was actually bought. Deactivate the product
    // instead of stripping those rows.
    const { count } = await admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .in('variant_id', removedIds)

    if (count && count > 0) {
      return NextResponse.json(
        {
          error:
            'One of the variants you removed appears in a past order. Set its stock to 0 instead of deleting it, so the order history stays intact.',
        },
        { status: 409 }
      )
    }

    const { error: deleteError } = await admin.from('product_variants').delete().in('id', removedIds)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  for (const { id: variantId, ...variant } of variants) {
    const payload = { ...variant, product_id: id }
    const { error: variantError } = variantId && existingIds.has(variantId)
      ? await admin.from('product_variants').update(payload).eq('id', variantId)
      : await admin.from('product_variants').insert([payload])

    if (variantError) {
      const message = variantError.code === '23505'
        ? `SKU "${variant.sku}" already exists on another product.`
        : variantError.message
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  revalidateStorefront()
  return NextResponse.json({ product })
}

export async function DELETE(_request, { params }) {
  const guard = await requireAdminApi('products.delete')
  if (guard.response) return guard.response

  const { id } = await params
  const admin = createAdminClient()

  const { data: variants } = await admin.from('product_variants').select('id').eq('product_id', id)
  const variantIds = (variants ?? []).map((variant) => variant.id)

  if (variantIds.length > 0) {
    const { count } = await admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .in('variant_id', variantIds)

    if (count && count > 0) {
      return NextResponse.json(
        {
          error:
            'This product appears in past orders and cannot be deleted. Deactivate it instead — it disappears from the shop while the order history stays intact.',
        },
        { status: 409 }
      )
    }

    await admin.from('product_variants').delete().eq('product_id', id)
  }

  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateStorefront()
  return NextResponse.json({ ok: true })
}
