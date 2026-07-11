import { getAllProducts } from '@/lib/products'
import ShopContent from './ShopContent'

// Catalog data is public — cache the rendered page and refresh every 5 min
export const revalidate = 300

export default async function ShopPage() {
  const products = await getAllProducts()

  return <ShopContent products={products} />
}
