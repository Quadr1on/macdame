import { getAllProducts } from '@/lib/products'
import ShopPageClient from './ShopPageClient'

export default async function ShopPage() {
  const products = await getAllProducts()

  return <ShopPageClient products={products} />
}
