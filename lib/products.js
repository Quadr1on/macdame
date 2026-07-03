import { createClient } from './supabase/server'

const SELECT = '*, product_variants(*)'

function mapProduct(row) {
  const variants = row.product_variants ?? []
  const firstVariant = variants[0] ?? {}

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.base_price),
    originalPrice: row.original_price !== null ? Number(row.original_price) : null,
    image: row.image,
    images: row.images ?? [],
    rating: row.rating !== null ? Number(row.rating) : null,
    reviews: row.reviews,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    href: `/products/${row.slug}`,
    sku: firstVariant.sku,
    sizes: variants.map((v) => v.size).filter(Boolean),
    color: firstVariant.color,
    material: row.material,
    work: row.work,
    washCare: row.wash_care,
    itemsIncluded: row.items_included,
    description: row.description,
    highlights: row.highlights ?? [],
    recentViews: row.recent_views,
  }
}

export async function getAllProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select(SELECT)

  if (error) throw error
  return (data ?? []).map(mapProduct)
}

export async function getProductBySlug(slug) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .single()

  if (error) return null
  return mapProduct(data)
}
