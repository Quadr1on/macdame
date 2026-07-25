import { slugify } from './utils'

// Shared normalisation for the product create/update routes. Everything the
// client sends is untrusted: prices are coerced to numbers, unknown keys are
// dropped, and blank strings become NULL so the DB doesn't fill up with ''.

function toNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toInt(value, fallback = 0) {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toText(value) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed === '' ? null : trimmed
}

/**
 * Maps a product form payload onto the products table's columns.
 * Returns { fields } or { error } describing the first validation failure.
 */
export function normalizeProductPayload(body) {
  const name = toText(body?.name)
  if (!name) return { error: 'Product name is required' }

  const basePrice = toNumber(body?.base_price)
  if (basePrice === null || basePrice < 0) {
    return { error: 'Base price must be a number of 0 or more' }
  }

  const categoryId = toText(body?.category_id)
  if (!categoryId) return { error: 'Pick a collection for this product' }

  const images = Array.isArray(body?.images) ? body.images.filter((url) => typeof url === 'string' && url) : []

  const highlights = Array.isArray(body?.highlights)
    ? body.highlights.map((h) => (typeof h === 'string' ? h.trim() : '')).filter(Boolean)
    : []

  return {
    fields: {
      name,
      slug: slugify(body?.slug) || slugify(name),
      category_id: categoryId,
      description: toText(body?.description),
      base_price: basePrice,
      original_price: toNumber(body?.original_price),
      images,
      // `image` is the single primary photo that lib/products.js reads for
      // cards and heroes; keep it pinned to the first uploaded image.
      image: images[0] ?? null,
      material: toText(body?.material),
      work: toText(body?.work),
      wash_care: toText(body?.wash_care),
      items_included: toText(body?.items_included),
      highlights,
      is_new: Boolean(body?.is_new),
      is_bestseller: Boolean(body?.is_bestseller),
      is_active: body?.is_active === undefined ? true : Boolean(body.is_active),
      updated_at: new Date().toISOString(),
    },
  }
}

/**
 * Maps the variant rows from the form. Returns { variants } or { error }.
 * SKU is required and unique per variant — checkout matches cart lines against
 * it in app/api/razorpay/create-order/route.js, so a blank or duplicated SKU
 * would silently mis-price an order.
 */
export function normalizeVariants(rawVariants, { basePrice }) {
  if (!Array.isArray(rawVariants)) return { variants: [] }

  const variants = []
  const seenSkus = new Set()

  for (const raw of rawVariants) {
    const sku = toText(raw?.sku)
    if (!sku) return { error: 'Every variant needs a SKU' }
    if (seenSkus.has(sku.toLowerCase())) return { error: `Duplicate SKU: ${sku}` }
    seenSkus.add(sku.toLowerCase())

    const price = toNumber(raw?.price, basePrice)
    if (price === null || price < 0) return { error: `Variant ${sku} needs a valid price` }

    variants.push({
      id: toText(raw?.id),
      sku,
      color: toText(raw?.color),
      size: toText(raw?.size),
      price,
      stock_quantity: Math.max(0, toInt(raw?.stock_quantity, 0)),
      variant_image_url: toText(raw?.variant_image_url),
    })
  }

  return { variants }
}
