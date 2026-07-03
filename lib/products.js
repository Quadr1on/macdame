import { createClient } from '@/lib/supabase/server'

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    // Postgres `numeric` columns can deserialize as strings; coerce so the UI's
    // .toLocaleString()/arithmetic on price and rating always work.
    price: Number(row.price),
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    image: row.image,
    images: row.images,
    rating: row.rating == null ? null : Number(row.rating),
    reviews: row.reviews,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    href: `/products/${row.id}`,
    sku: row.sku,
    sizes: row.sizes,
    color: row.color,
    material: row.material,
    work: row.work,
    washCare: row.wash_care,
    itemsIncluded: row.items_included,
    description: row.description,
    highlights: row.highlights,
    recentViews: row.recent_views,
  }
}

export async function getAllProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select('*').order('id')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data.map(mapProduct)
}

export async function getProductById(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return mapProduct(data)
}
