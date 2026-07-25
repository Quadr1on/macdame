import { supabasePublic } from './supabase/public'

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
  const { data, error } = await supabasePublic.from('products').select(SELECT)

  if (error) throw error
  return (data ?? []).map(mapProduct)
}

export async function getFeaturedProducts(limit = 4) {
  const { data, error } = await supabasePublic
    .from('products')
    .select(SELECT)
    .eq('is_active', true)
    .order('is_bestseller', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapProduct)
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabasePublic
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .single()

  if (error) return null
  return mapProduct(data)
}

/**
 * Every collection, with a live count of the active products inside it.
 *
 * Drives the homepage bento tiles and the navbar dropdown, so anything created
 * in /admin/collections shows up on the storefront without a code change. The
 * products(count) embed rides the FK, keeping this to one round trip.
 */
export async function getAllCategories() {
  const { data, error } = await supabasePublic
    .from('categories')
    .select('id, name, slug, description, image_url, products(count)')
    .eq('products.is_active', true)
    .order('name')

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image_url,
    href: `/collections/${row.slug}`,
    itemCount: row.products?.[0]?.count ?? 0,
  }))
}

export async function getCategoryWithProducts(slug) {
  // Both queries are independent — run them in parallel so the page pays
  // one Supabase round trip instead of two.
  const [categoryResult, productsResult] = await Promise.all([
    supabasePublic
      .from('categories')
      .select('name, slug, description, image_url')
      .eq('slug', slug)
      .single(),
    supabasePublic
      .from('products')
      .select(`${SELECT}, categories!inner(slug)`)
      .eq('categories.slug', slug)
      .eq('is_active', true),
  ])

  if (categoryResult.error || !categoryResult.data) return null
  if (productsResult.error) return null

  return {
    category: {
      name: categoryResult.data.name,
      slug: categoryResult.data.slug,
      description: categoryResult.data.description,
      image: categoryResult.data.image_url,
    },
    products: (productsResult.data ?? []).map(mapProduct),
  }
}
